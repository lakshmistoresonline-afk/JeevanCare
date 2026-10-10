'use server'

import { cookies } from 'next/headers'
import { getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'
import { normalizePhone } from '@/lib/phone'
import { rateLimit } from '@/lib/rateLimit'

const MAX_ACTIVATION_ATTEMPTS = 5

export async function patientRegisterAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const rawName = String(formData.get('name') || '').trim()
  const rawPhone = String(formData.get('phone') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const dob = String(formData.get('dob') || '').trim()
  const gender = String(formData.get('gender') || '').trim()
  const ageYearsStr = String(formData.get('ageYears') || '').trim()
  const addressLine = String(formData.get('addressLine') || '').trim()
  const city = String(formData.get('city') || '').trim()
  const state = String(formData.get('state') || '').trim()
  const pinCode = String(formData.get('pinCode') || '').trim()
  const tenantID = String(formData.get('tenant') || '').trim()
  const activationCode = String(formData.get('activationCode') || '').trim()

  if (!rawName || !rawPhone || !password || !tenantID) {
    return { ok: false, code: 'VALIDATION', message: 'Name, mobile number, password, and clinic are required.' }
  }

  const phone = normalizePhone(rawPhone)

  // Apply rate limiting per phone number
  const rl = rateLimit(`patient_reg_${phone}`, 5)
  if (!rl.allowed) {
    return { ok: false, code: 'RATE_LIMITED', message: 'Too many registration attempts. Please try again later.' }
  }

  try {
    const payload = await getPayloadClient()

    // 0. Validate clinic tenant exists and is active
    const tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantID,
      depth: 0,
      overrideAccess: true,
    }).catch(() => null)

    if (!tenant || tenant.status !== 'active') {
      return { ok: false, code: 'FORBIDDEN', message: 'Selected clinic is inactive or not found.' }
    }

    // 1. Detect if a portal account in `users` collection already exists for this normalized mobile or email
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

    // 2. Detect if an existing patient record exists in `patients` collection within this clinic by phone
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

      // Check if this existing patient record ALREADY has a portal user account linked
      const existingPortalUser = await payload.find({
        collection: 'users',
        where: {
          patientProfile: { equals: existingPatient.id },
        },
        limit: 1,
        overrideAccess: true,
      })

      if (existingPortalUser.docs.length > 0) {
        return {
          ok: false,
          code: 'PORTAL_ACCOUNT_EXISTS',
          message: 'An active portal account already exists for this medical record. Please sign in or reset your password.',
        }
      }

      // Check failed activation attempt limit
      const attempts = existingPatient.activationAttempts ?? 0
      if (attempts >= MAX_ACTIVATION_ATTEMPTS) {
        return {
          ok: false,
          code: 'ACTIVATION_RATE_LIMITED',
          message: 'Too many failed activation attempts. Please contact your clinic for assistance.',
        }
      }

      // Existing staff-created patient record without portal account.
      // Require ownership verification (Activation Code or MRN match)
      const expectedMrn = (existingPatient.mrn || '').trim().toUpperCase()
      const expectedCode = (existingPatient.activationCode || '').trim().toUpperCase()
      const providedCode = activationCode.toUpperCase()

      const isVerified =
        providedCode &&
        (providedCode === expectedMrn || (expectedCode && providedCode === expectedCode))

      if (!isVerified) {
        // Increment activation attempts counter on failed claim
        await payload.update({
          collection: 'patients',
          id: existingPatient.id,
          overrideAccess: true,
          data: { activationAttempts: attempts + 1 } as never,
        }).catch(() => {})

        return {
          ok: false,
          code: 'VERIFICATION_REQUIRED',
          message: 'A medical record exists for this mobile number. To claim your portal account, please enter your Patient MRN or Activation Code provided on your prescription or clinic receipt.',
        }
      }

      patientId = String(existingPatient.id)
    } else {
      // Create new patient record
      const newPatient = await payload.create({
        collection: 'patients',
        overrideAccess: true,
        data: {
          tenant: tenantID,
          name: rawName,
          phone,
          dateOfBirth: dob || undefined,
          ageYears: ageYearsStr ? Number(ageYearsStr) : (!dob ? 30 : undefined),
          gender: (gender || 'female') as any,
          addressLine: addressLine || undefined,
          city: city || 'Thrissur',
          state: state || 'Kerala',
          pinCode: pinCode || undefined,
        } as never,
      })
      patientId = String(newPatient.id)
    }

    // 3. Create single user portal account linked to patientProfile
    const userEmail = email ? email.toLowerCase() : `${phone.replace(/[^0-9]/g, '')}.${tenantID.slice(-6)}@patient.portal`
    const newUser = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: rawName,
        email: userEmail,
        password,
        role: 'patient' as any,
        tenant: tenantID,
        phone,
        patientProfile: patientId,
        active: true,
        emailVerified: true,
      } as never,
    })

    // 4. Log in the user automatically
    const loginRes = await payload.login({
      collection: 'users',
      data: {
        email: newUser.email,
        password,
      },
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
