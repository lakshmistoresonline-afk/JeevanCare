'use client'

import { Suspense, useActionState, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginAction } from './actions'
import { AuthLayout } from '@/components/AuthLayout'
import { BookingContextBanner } from '@/components/BookingContextBanner'
import { btnPrimary, inputClass, Field, Spinner } from '@/components/primitives'
import { PasswordField } from '@/components/PasswordField'

const DEMO_ACCOUNTS = [
  { label: 'Owner', email: 'owner1@test.com' },
  { label: 'Doctor', email: 'doctor1@test.com' },
  { label: 'Receptionist', email: 'staff1@test.com' },
  { label: 'Patient', email: 'patient1@test.com' },
  { label: 'Super admin', email: 'admin@test.com' },
]

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

  useEffect(() => {
    if (state?.ok) {
      const role = state.data.role
      if (role === 'superAdmin') {
        router.push('/super')
      } else if (role === 'patient') {
        if (doctorId) {
          router.push(`/patient/appointments/book?doctor=${doctorId}`)
        } else {
          router.push('/patient/dashboard')
        }
      } else {
        router.push('/dashboard')
      }
    }
  }, [state, router, doctorId])

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Test@123')
  }

  return (
    <AuthLayout>
      <div>
        <BookingContextBanner doctorId={doctorId} />

        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome to JeevanCare</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your account for clinic workspace or patient portal.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <Field label="Email Address or Mobile Number" htmlFor="email">
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@clinic.com or +91 98470 11111"
              className={inputClass}
            />
          </Field>

          <PasswordField
            label="Password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
          />

          <div className="-mt-2 text-right">
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          {state && !state.ok && (
            <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-sm text-red" role="alert">
              {state.message}
            </p>
          )}

          <button type="submit" className={`${btnPrimary} mt-1 w-full`} disabled={pending}>
            {pending && <Spinner />}
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Demo quick-fill — gated for development environment */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 rounded-xl border border-border/80 bg-card p-3.5">
            <p className="text-xs font-semibold text-muted-foreground">
              Development Mode — prefill test credentials:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => quickFill(d.email)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
                    email === d.email
                      ? 'border-primary/30 bg-secondary text-primary font-bold'
                      : 'border-border bg-canvas text-muted-foreground hover:border-primary/30 hover:text-primary'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-muted-foreground">
          New to JeevanCare?{' '}
          <Link
            href={doctorId ? `/patient/register?doctor=${doctorId}` : '/patient/register'}
            className="font-semibold text-primary hover:underline"
          >
            Create Patient Account
          </Link>
          {' or '}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Register Clinic
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
