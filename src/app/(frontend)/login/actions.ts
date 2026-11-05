'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'
import { rateLimit } from '@/lib/rateLimit'

const normalizePhone = (raw: string): string => {
  const trimmed = raw.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/[^0-9]/g, '')
  return hasPlus ? `+${digits}` : digits
}

export async function loginAction(
  _prev: ActionResult<{ role: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ role: string }>> {
  const input = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!input || !password) {
    return { ok: false, code: 'VALIDATION', message: 'Enter your email or mobile number and password.' }
  }

  // Brute-force rate limiting (max 10 attempts per hour per account)
  const limiter = rateLimit(`login:${input.toLowerCase()}`, 10)
  if (!limiter.allowed) {
    return { ok: false, code: 'RATE_LIMIT', message: 'Too many login attempts. Please try again later.' }
  }

  try {
    const payload = await getPayloadClient()
    let loginEmail = input

    // If input is a phone number, resolve linked user account email
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

    if (!result.token) {
      return { ok: false, code: 'VALIDATION', message: 'Incorrect email/mobile or password.' }
    }

    const userRole = (result.user as { role: string }).role
    const cookieStore = await cookies()
    const cookieOpts = {
      httpOnly: true,
      path: '/',
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      expires: result.exp ? new Date(result.exp * 1000) : undefined,
    }

    cookieStore.set('payload-token', result.token, cookieOpts)

    if (userRole === 'superAdmin') {
      cookieStore.set('payload-token-super', result.token, cookieOpts)
    } else if (userRole === 'patient') {
      cookieStore.set('payload-token-patient', result.token, cookieOpts)
    } else {
      cookieStore.set('payload-token-staff', result.token, cookieOpts)
    }

    return { ok: true, data: { role: userRole } }
  } catch (err) {
    const mapped = toActionError(err)
    if (mapped.code === 'UNKNOWN') {
      return { ok: false, code: 'AUTH', message: 'Incorrect email/mobile or password.' }
    }
    return { ok: false, ...mapped, message: 'Incorrect email/mobile or password.' }
  }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('payload-token')
  cookieStore.delete('payload-token-super')
  cookieStore.delete('payload-token-staff')
  cookieStore.delete('payload-token-patient')
  redirect('/login')
}

export async function getActiveSessionUser(): Promise<{
  active: boolean
  name?: string
  email?: string
  role?: string
} | null> {
  try {
    const user = await getCurrentUser()
    if (user && user.active !== false) {
      return {
        active: true,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    }
    return { active: false }
  } catch {
    return { active: false }
  }
}
