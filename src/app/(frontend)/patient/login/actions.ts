'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'

const normalizePhone = (raw: string): string => {
  const trimmed = raw.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/[^0-9]/g, '')
  return hasPlus ? `+${digits}` : digits
}

export async function patientLoginAction(
  _prev: ActionResult<{ role: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ role: string }>> {
  const input = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!input || !password) {
    return { ok: false, code: 'VALIDATION', message: 'Enter your mobile number or email address and password.' }
  }

  try {
    const payload = await getPayloadClient()
    let loginEmail = input

    // If input is a phone number (e.g. +91 9847555001 or 9847555001), resolve linked user account email
    const isPhone = /^\+?[0-9\s-]{7,15}$/.test(input)
    if (isPhone) {
      const normalized = normalizePhone(input)
      const digitsOnly = input.replace(/[^0-9]/g, '')
      const userRes = await payload.find({
        collection: 'users',
        where: {
          role: { equals: 'patient' },
          or: [
            { phone: { equals: normalized } },
            { phone: { equals: `+${digitsOnly}` } },
            { phone: { equals: digitsOnly } },
            { email: { equals: input } },
          ],
        },
        limit: 1,
        overrideAccess: true,
      })

      if (userRes.docs.length > 0) {
        loginEmail = userRes.docs[0].email
      }
    }

    const result = await payload.login({
      collection: 'users',
      data: { email: loginEmail, password },
    })

    if (!result.token || !result.user || (result.user as any).role !== 'patient') {
      return { ok: false, code: 'AUTH', message: 'Invalid mobile number, email address or password.' }
    }

    try {
      const cookieStore = await cookies()
      cookieStore.set('payload-token', result.token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        expires: result.exp ? new Date(result.exp * 1000) : undefined,
      })
    } catch {
      // Safe fallback in unit tests outside request store
    }

    return { ok: true, data: { role: 'patient' } }
  } catch (err) {
    const mapped = toActionError(err)
    return { ok: false, ...mapped, message: 'Invalid mobile number, email address or password.' }
  }
}

export async function patientLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('payload-token')
  redirect('/patient/login')
}
