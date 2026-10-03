'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/auth'
import { toActionError, type ActionResult } from '@/lib/errors'

export async function patientLoginAction(
  _prev: ActionResult<{ role: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ role: string }>> {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')

  if (!email || !password) {
    return { ok: false, code: 'VALIDATION', message: 'Enter your email and password.' }
  }

  try {
    const payload = await getPayloadClient()
    const result = await payload.login({
      collection: 'users',
      data: { email, password },
    })

    if (!result.token || !result.user || (result.user as any).role !== 'patient') {
      return { ok: false, code: 'AUTH', message: 'Invalid patient credentials.' }
    }

    const cookieStore = await cookies()
    cookieStore.set('payload-token', result.token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      expires: result.exp ? new Date(result.exp * 1000) : undefined,
    })

    return { ok: true, data: { role: 'patient' } }
  } catch (err) {
    const mapped = toActionError(err)
    return { ok: false, ...mapped, message: 'Invalid email or password.' }
  }
}

export async function patientLogoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('payload-token')
  redirect('/patient/login')
}
