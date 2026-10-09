'use server'

import { cookies } from 'next/headers'
import crypto from 'crypto'
import { getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'
import { normalizePhone } from '@/lib/phone'
import { rateLimit } from '@/lib/rateLimit'
import { ERROR_CODES } from '@/lib/constants'

const ACTIVATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const MAX_ACTIVATION_ATTEMPTS = 5

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function generateActivationToken(): string {
  return crypto.randomBytes(6).toString('hex')
}

export async function patientRegisterAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const name = String(formData.get('name') || '').trim()
  const phoneRaw = String(formData.get('phone') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const dob = String(formData.get('dob') || '')
  const gender = String(formData.get('gender') || 'female')
  const addressLine = String(formData.get('addressLine') || '')
  const city = String(formData.get('city') || '')
  const state = String(formData.get('state') || '')
  const pinCode = String(formData.get('pinCode') || '')
  const tenantID = String(formData.get('tenant') || '')
  const activationCode = String(formData.get('activationCode') || '').trim()

  if (!name || !phoneRaw || !password || !tenantID) {
    return { ok: false, code: 'VALIDATION', message: 'Name, mobile number, password, and clinic are required.' }
  }

  // Normalize phone once — used for all lookups and persistence
  const phone = normalizePhone(phoneRaw)

  // Rate limit registration attempts by phone
  if (!rateLimit(`register:${phone}`, 5).allowed) {
    return { ok: false, code: ERROR_CODES.SIGNUP_RATE_LIMITED, message: 'Too many registration attempts. Please try again later.' }
  }

  try {
    const payload = await getPayloadClient()

    // 1. Check if a portal account already exists for this phone or email
    const existingUser = await payload.find({
      collection: 'users',
      where: {
        or: [
          { phone: { equals: phone } },
          ...(email ? [{ email: { equals: email.toLowerCase() } }] : []),
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existingUser.docs.length > 0) {
      return {
        ok: false,
        code: 'PORTAL_ACCOUNT_EXISTS',
        message: 'A portal account already exists for this mobile number or email. Please sign in or reset your password.',
      }
    }

    // 2. Check for existing patient record by normalized phone
    const existingPatientRes = await payload.find({
      collection: 'patients',
      where: {
        tenant: { equals: tenantID },
        phone: { equals: phone },
      },
      limit: 1,
      overrideAccess: true,
    })

    let patientId: string

    if (existingPatientRes.docs.length > 0) {
      const existingPatient = existingPatientRes.docs[0] as any

      // Check if this patient record already has a portal user account
      const existingPortalUser = await payload.find({
        collection: 'users',
        where: { patientProfile: { equals: existingPatient.id } },
        limit: 1,
        overrideAccess: true,
      })

      if (existingPortalUser.docs.length > 0) {
        return {
          ok: false,
          code: 'PORTAL_ACCOUNT_EXISTS',
          message: 'A portal account already exists for this mobile number. Please sign in or reset your password.',
        }
      }

      // Existing patient claim: require a valid activation token, not MRN alone
      const tokenHash = existingPatient.activationTokenHash
      const tokenExp = existingPatient.activationTokenExp
      const attempts = existingPatient.activationAttempts ?? 0

      if (!tokenHash || !tokenExp) {
        return {
          ok: false,
          code: ERROR_CODES.ACTIVATION_INVALID,
          message: 'A medical record exists for this mobile number. Please contact your clinic to receive an activation code before creating a portal account.',
        }
      }

      // Rate limit activation attempts
      if (attempts >= MAX_ACTIVATION_ATTEMPTS) {
        return {
          ok: false,
          code: ERROR_CODES.ACTIVATION_RATE_LIMITED,
          message: 'Too many activation attempts. Please contact your clinic for assistance.',
        }
      }

      // Check token expiry
      if (new Date(tokenExp).getTime() < Date.now()) {
        return {
          ok: false,
          code: ERROR_CODES.ACTIVATION_EXPIRED,
          message: 'Your activation code has expired. Please contact your clinic for a new one.',
        }
      }

      // Verify the activation code against the stored hash
      const providedHash = hashToken(activationCode)
      if (providedHash !== tokenHash) {
        // Increment failed attempts
        await payload.update({
          collection: 'patients',
          id: String(existingPatient.id),
          overrideAccess: true,
          data: { activationAttempts: attempts + 1 } as never,
        })
        return {
          ok: false,
          code: ERROR_CODES.ACTIVATION_INVALID,
          message: 'The activation code you entered is incorrect. Please check and try again.',
        }
      }

      // Token is valid — consume it (one-time use)
      await payload.update({
        collection: 'patients',
        id: String(existingPatient.id),
        overrideAccess: true,
        data: {
          activationTokenHash: null,
          activationTokenExp: null,
          activationAttempts: 0,
        } as never,
      })

      patientId = String(existingPatient.id)
    } else {
      // Create new patient record — require DOB or age, never fabricate
      if (!dob) {
        return {
          ok: false,
          code: 'VALIDATION',
          message: 'Date of birth is required for new patient registration.',
        }
      }

      const newPatient = await payload.create({
        collection: 'patients',
        overrideAccess: true,
        data: {
          tenant: tenantID,
          name,
          phone,
          dateOfBirth: dob,
          gender: gender as any,
          addressLine: addressLine || undefined,
          city: city || undefined,
          state: state || undefined,
          pinCode: pinCode || undefined,
        } as never,
      })
      patientId = String(newPatient.id)
    }

    // 3. Create portal user account
    const userEmail = email || `${phone.replace(/[^0-9]/g, '')}.${tenantID.slice(-6)}@patient.portal`
    let newUser: any
    try {
      newUser = await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          name,
          email: userEmail.toLowerCase(),
          password,
          role: 'patient' as any,
          tenant: tenantID,
          phone,
          patientProfile: patientId,
          active: true,
          emailVerified: true,
        } as never,
      })
    } catch (userErr: any) {
      // If user creation fails after a new patient was created, attempt cleanup
      // so we don't leave an orphaned patient record without a portal account.
      // For claimed records the patient already existed, so no cleanup needed.
      if (existingPatientRes.docs.length === 0) {
        await payload.delete({
          collection: 'patients',
          id: patientId,
          overrideAccess: true,
        }).catch(() => {})
      }
      const isDuplicate =
        userErr?.data?.errors?.some((e: any) => String(e?.message || '').toLowerCase().includes('unique')) ||
        String(userErr?.message || '').toLowerCase().includes('unique')
      if (isDuplicate) {
        return {
          ok: false,
          code: 'PORTAL_ACCOUNT_EXISTS',
          message: 'A portal account already exists for this mobile number or email. Please sign in or reset your password.',
        }
      }
      return { ok: false, ...toActionError(userErr), message: 'Could not create patient account.' }
    }

    // 4. Log in the user automatically
    const loginRes = await payload.login({
      collection: 'users',
      data: { email: newUser.email, password },
    })

    if (loginRes.token) {
      try {
        const cookieStore = await cookies()
        cookieStore.set('payload-token', loginRes.token, {
          httpOnly: true,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          expires: loginRes.exp ? new Date(loginRes.exp * 1000) : undefined,
        })
      } catch {
        // Safe fallback in unit tests outside request store
      }
    }

    return { ok: true, data: { id: patientId } }
  } catch (err: any) {
    const isDuplicate =
      err?.data?.errors?.some((e: any) => String(e?.message || '').toLowerCase().includes('unique')) ||
      String(err?.message || '').toLowerCase().includes('unique')
    if (isDuplicate) {
      return {
        ok: false,
        code: 'PORTAL_ACCOUNT_EXISTS',
        message: 'A portal account already exists for this mobile number or email. Please sign in or reset your password.',
      }
    }
    const mapped = toActionError(err)
    return { ok: false, ...mapped, message: mapped.message || 'Could not create patient account.' }
  }
}

/**
 * Issue an activation token for a patient record. Called by staff when
 * a patient needs to claim their pre-existing record through the portal.
 * Returns the plaintext token once — staff share it with the patient out-of-band.
 */
export async function issueActivationToken(patientId: string): Promise<ActionResult<{ token: string }>> {
  try {
    const payload = await getPayloadClient()
    const token = generateActivationToken()
    const tokenHash = hashToken(token)
    const exp = new Date(Date.now() + ACTIVATION_TOKEN_TTL_MS)

    await payload.update({
      collection: 'patients',
      id: patientId,
      overrideAccess: true,
      data: {
        activationTokenHash: tokenHash,
        activationTokenExp: exp.toISOString(),
        activationAttempts: 0,
      } as never,
    })

    return { ok: true, data: { token } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}
