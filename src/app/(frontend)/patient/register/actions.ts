'use server'

import { cookies } from 'next/headers'
import crypto from 'crypto'
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

  let existingPatientForRecovery: any = null
  let claimIdForRecovery: string | null = null
  let tokenWasConsumed = false
  let userAccountCreated = false

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
      showHiddenFields: true,
    })

    let patientId: string

    if (existingPatientRes.docs.length > 0) {
      const existingPatient = existingPatientRes.docs[0] as any
      existingPatientForRecovery = existingPatient

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
      // Require verification via single-use activation token hash ONLY. MRN & Plaintext codes are STRICTLY REJECTED.
      const providedCode = activationCode.toUpperCase()
      const tokenHash = existingPatient.activationTokenHash
      const tokenExp = existingPatient.activationTokenExp ? new Date(existingPatient.activationTokenExp) : null

      // Mandatory Expiry Check: If activationTokenExp is missing or in the past, FAIL CLOSED.
      if (!tokenExp || new Date() > tokenExp) {
        return {
          ok: false,
          code: 'ACTIVATION_EXPIRED',
          message: 'Activation code has expired. Please request a new activation code from your clinic.',
        }
      }

      const providedHash = providedCode ? crypto.createHash('sha256').update(providedCode).digest('hex') : ''
      const isVerified = Boolean(providedCode) && Boolean(tokenHash) && providedHash === tokenHash

      const db = (payload.db as any)?.connection?.db || (payload.db as any)?.collections?.patients?.collection?.db

      const queryId = existingPatient._id || existingPatient.id

      if (!isVerified) {
        // Atomic increment of activation attempts counter on failed claim
        if (db) {
          await db.collection('patients').updateOne(
            { _id: queryId },
            { $inc: { activationAttempts: 1 } },
          ).catch(() => {})
        } else {
          await payload.update({
            collection: 'patients',
            id: existingPatient.id,
            overrideAccess: true,
            data: {
              activationAttempts: attempts + 1,
              activationTokenHash: tokenHash || undefined,
              activationTokenExp: existingPatient.activationTokenExp || undefined,
            } as never,
          }).catch(() => {})
        }

        return {
          ok: false,
          code: 'VERIFICATION_REQUIRED',
          message: 'A medical record exists for this mobile number. To claim your portal account, please enter the Activation Code provided on your clinic receipt.',
        }
      }

      // Database-level conditional atomic single-use token consumption with claim ownership marker
      if (!db) {
        return { ok: false, code: 'SYSTEM_ERROR', message: 'Database connection error during activation claim.' }
      }

      const now = new Date()
      const nowIso = now.toISOString()
      const claimId = crypto.randomUUID()
      claimIdForRecovery = claimId

      const updateRes = await db.collection('patients').updateOne(
        {
          _id: queryId,
          activationTokenHash: tokenHash, // Match condition ensures ONLY ONE concurrent request wins!
          $or: [
            { activationTokenExp: { $gt: now } },
            { activationTokenExp: { $gt: nowIso } },
          ],
          activationAttempts: { $lt: MAX_ACTIVATION_ATTEMPTS },
        },
        {
          $unset: { activationCode: '', activationTokenHash: '', activationTokenExp: '' },
          $set: { activationAttempts: 0, activeClaimId: claimId, claimedAt: nowIso },
        },
      )

      if (updateRes.modifiedCount === 0) {
        return {
          ok: false,
          code: 'PORTAL_ACCOUNT_EXISTS',
          message: 'Activation code has already been claimed or consumed. Please sign in or reset your password.',
        }
      }

      tokenWasConsumed = true
      patientId = String(existingPatient.id)
    } else {
      // Validate demographics for new patient creation (no fabricated defaults)
      if (!dob && !ageYearsStr) {
        return { ok: false, code: 'VALIDATION', message: 'Date of birth or age is required.' }
      }
      if (!gender) {
        return { ok: false, code: 'VALIDATION', message: 'Gender is required.' }
      }

      let parsedAge: number | undefined = undefined
      if (ageYearsStr) {
        parsedAge = Number(ageYearsStr)
        if (isNaN(parsedAge) || parsedAge < 0 || parsedAge > 130) {
          return { ok: false, code: 'VALIDATION', message: 'Enter a valid age between 0 and 130 years.' }
        }
      }

      if (dob) {
        const birthDate = new Date(dob)
        const now = new Date()
        if (isNaN(birthDate.getTime()) || birthDate > now || birthDate.getFullYear() < now.getFullYear() - 130) {
          return { ok: false, code: 'VALIDATION', message: 'Enter a valid date of birth.' }
        }
      }

      const newPatient = await payload.create({
        collection: 'patients',
        overrideAccess: true,
        data: {
          tenant: tenantID,
          name: rawName,
          phone,
          dateOfBirth: dob || undefined,
          ageYears: parsedAge,
          gender: gender as any,
          addressLine: addressLine || undefined,
          city: city || undefined,
          state: state || undefined,
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

    userAccountCreated = Boolean(newUser?.id)

    // Clear activeClaimId and claimedAt now that user portal account creation succeeded
    if (claimIdForRecovery && existingPatientForRecovery) {
      const db = (payload.db as any)?.connection?.db || (payload.db as any)?.collections?.patients?.collection?.db
      if (db) {
        const queryId = existingPatientForRecovery._id || existingPatientForRecovery.id
        await db.collection('patients').updateOne(
          { _id: queryId, activeClaimId: claimIdForRecovery },
          { $unset: { activeClaimId: '', claimedAt: '' } },
        ).catch(() => {})
      }
    }

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
    // Failure Recovery: If token was consumed for an existing patient BUT user creation failed,
    // perform atomic conditional rollback ONLY IF:
    // 1. User account creation failed (!userAccountCreated)
    // 2. Authoritative DB check confirms NO user portal account exists in users collection for this patient
    // 3. The claim ownership marker matches (activeClaimId === claimIdForRecovery)
    if (tokenWasConsumed && !userAccountCreated && claimIdForRecovery && existingPatientForRecovery) {
      try {
        const payload = await getPayloadClient()
        // Authoritative Database check: Verify no user portal account exists in users collection for this patient
        const existingPortalUser = await payload.find({
          collection: 'users',
          where: { patientProfile: { equals: existingPatientForRecovery.id } },
          overrideAccess: true,
          limit: 1,
        })

        if (existingPortalUser.docs.length === 0) {
          const db = (payload.db as any)?.connection?.db || (payload.db as any)?.collections?.patients?.collection?.db

          if (db) {
            const queryId = existingPatientForRecovery._id || existingPatientForRecovery.id

            // Atomic conditional rollback matching ONLY THIS REQUEST'S activeClaimId!
            // If staff issued a new activation code in the meantime, activeClaimId was cleared/changed,
            // so this update modifies 0 docs and CANNOT overwrite staff's newly issued activation token!
            await db.collection('patients').updateOne(
              {
                _id: queryId,
                activeClaimId: claimIdForRecovery, // Claim ownership match requirement!
              },
              {
                $set: {
                  activationTokenHash: existingPatientForRecovery.activationTokenHash,
                  activationTokenExp: existingPatientForRecovery.activationTokenExp,
                  activationAttempts: existingPatientForRecovery.activationAttempts ?? 0,
                },
                $unset: { activeClaimId: '', claimedAt: '' },
              },
            )
          }
        }
      } catch {}
    }

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
