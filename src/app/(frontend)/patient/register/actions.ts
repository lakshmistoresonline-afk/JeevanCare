'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'

export async function patientRegisterAction(
  _prev: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  const name = String(formData.get('name') || '').trim()
  const phone = String(formData.get('phone') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const dob = String(formData.get('dob') || '')
  const gender = String(formData.get('gender') || 'other')
  const addressLine = String(formData.get('addressLine') || '')
  const city = String(formData.get('city') || '')
  const state = String(formData.get('state') || '')
  const pinCode = String(formData.get('pinCode') || '')
  const tenantID = String(formData.get('tenant') || '')

  if (!name || !phone || !password || !tenantID) {
    return { ok: false, code: 'VALIDATION', message: 'Name, mobile number, password, and clinic are required.' }
  }

  try {
    const payload = await getPayloadClient()

    // 1. Check if patient already exists in this tenant by phone or email
    const existing = await payload.find({
      collection: 'patients',
      where: {
        tenant: { equals: tenantID },
        or: [
          { phone: { equals: phone } },
          ...(email ? [{ email: { equals: email } }] : []),
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    let patientId: string
    if (existing.docs.length > 0) {
      patientId = String(existing.docs[0].id)
    } else {
      // Create new patient record
      const newPatient = await payload.create({
        collection: 'patients',
        overrideAccess: true,
        data: {
          tenant: tenantID,
          name,
          phone,
          email: email || undefined,
          dob: dob || undefined,
          gender: gender as any,
          addressLine: addressLine || undefined,
          city: city || undefined,
          state: state || undefined,
          pinCode: pinCode || undefined,
        } as never,
      })
      patientId = String(newPatient.id)
    }

    // 2. Create user account for patient portal login
    const newUser = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name,
        email: email || `${phone.replace(/[^0-9]/g, '')}@patient.portal`,
        password,
        role: 'patient' as any,
        tenant: tenantID,
        phone,
        patientProfile: patientId,
        active: true,
        emailVerified: true,
      } as never,
    })

    // 3. Log in the user automatically
    const loginRes = await payload.login({
      collection: 'users',
      data: {
        email: newUser.email,
        password,
      },
    })

    if (loginRes.token) {
      const cookieStore = await cookies()
      cookieStore.set('payload-token', loginRes.token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: loginRes.exp ? new Date(loginRes.exp * 1000) : undefined,
      })
    }

    return { ok: true, data: { id: patientId } }
  } catch (err) {
    const mapped = toActionError(err)
    return { ok: false, ...mapped, message: mapped.message || 'Could not create patient account.' }
  }
}
