'use client'

import { Suspense, useActionState, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginAction, logoutAction, getActiveSessionUser } from './actions'
import { AuthLayout } from '@/components/AuthLayout'
import { BookingContextBanner } from '@/components/BookingContextBanner'
import { btnPrimary, inputClass, Field, Spinner } from '@/components/primitives'
import { PasswordField } from '@/components/PasswordField'
import { QuickLoginToolbar } from '@/components/QuickLoginToolbar'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null)
  const router = useRouter()
  const params = useSearchParams()
  const doctorId = params.get('doctor') || params.get('doctorId')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')
  const [activeUser, setActiveUser] = useState<{ active: boolean; name?: string; email?: string; role?: string } | null>(null)

  const urlError = params.get('error')
  const urlErrorMsg =
    urlError === 'account_deactivated'
      ? 'Your account has been deactivated. Please contact support.'
      : urlError === 'clinic_inactive'
        ? 'The clinic workspace is currently inactive.'
        : urlError === 'no_patient_profile'
          ? 'Could not link patient profile. Please try logging in again.'
          : urlError === 'no_clinic_tenant'
            ? 'No clinic tenant associated with this account.'
            : urlError

  useEffect(() => {
    getActiveSessionUser().then((res) => {
      if (res) setActiveUser(res)
    })
  }, [])

  useEffect(() => {
    if (state?.ok) {
      const role = state.data.role
      let target = '/dashboard'
      if (role === 'superAdmin') {
        target = '/super'
      } else if (role === 'patient') {
        target = doctorId ? `/patient/appointments/book?doctor=${doctorId}` : '/patient/dashboard'
      }
      window.location.href = target
    }
  }, [state, doctorId])

  return (
    <AuthLayout>
      <div>
        <BookingContextBanner doctorId={doctorId} />

        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome to JeevanCare</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your account for clinic workspace or patient portal.
        </p>

        {urlErrorMsg && (
          <div className="mt-4 rounded-xl border border-red/25 bg-red-soft p-3.5 text-xs font-medium text-red animate-fade-in">
            ⚠️ {urlErrorMsg}
          </div>
        )}

        {activeUser && activeUser.active && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-primary/30 bg-primary-soft/50 px-4 py-3 text-xs animate-fade-in">
            <div className="min-w-0 flex-1">
              <span className="font-bold text-primary">Active Session: </span>
              <span className="font-semibold text-ink">{activeUser.name}</span>{' '}
              <span className="text-muted-foreground">({activeUser.email})</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (activeUser.role === 'superAdmin') window.location.href = '/super'
                  else if (activeUser.role === 'patient') window.location.href = '/patient/dashboard'
                  else window.location.href = '/dashboard'
                }}
                className="font-bold text-primary hover:underline"
              >
                Resume →
              </button>
              <form action={logoutAction} className="inline">
                <button
                  type="submit"
                  className="font-medium text-muted-foreground hover:text-red hover:underline"
                >
                  Log Out
                </button>
              </form>
            </div>
          </div>
        )}

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <Field label="Email Address or Mobile Number" htmlFor="email">
            <div className="relative">
              <input
                id="email"
                name="email"
                type="text"
                autoComplete="off"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@clinic.com or +91 98470 11111"
                className={`${inputClass} pr-9`}
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink text-xs font-bold size-5 flex items-center justify-center rounded-full hover:bg-secondary transition-colors"
                  title="Clear text"
                >
                  ✕
                </button>
              )}
            </div>
          </Field>

          <PasswordField
            label="Password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
          />

          <div className="-mt-2 text-right">
            <Link href="/forgot-password" prefetch={false} className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          {state && !state.ok && (
            <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-sm text-red" role="alert">
              {state.message}
            </p>
          )}

          <button type="submit" className={`${btnPrimary} mt-1 w-full justify-center`} disabled={pending}>
            {pending && <Spinner />}
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <QuickLoginToolbar
          onSelectAccount={(accEmail, accPassword) => {
            setEmail(accEmail)
            setPassword(accPassword || 'Test@123')
          }}
        />
      </div>
    </AuthLayout>
  )
}
