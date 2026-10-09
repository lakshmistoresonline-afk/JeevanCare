'use client'

import { Suspense, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { patientLoginAction } from './actions'
import { AuthLayout } from '@/components/AuthLayout'
import { AuthContextTabs } from '@/components/AuthContextTabs'
import { BookingContextBanner } from '@/components/BookingContextBanner'
import { btnPrimary, inputClass, Field, Spinner } from '@/components/primitives'
import { PasswordField } from '@/components/PasswordField'

export default function PatientLoginPage() {
  return (
    <Suspense>
      <PatientLoginForm />
    </Suspense>
  )
}

function PatientLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const doctorId = searchParams.get('doctor') || searchParams.get('doctorId')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await patientLoginAction(null, formData)
      if (res.ok) {
        if (doctorId) {
          router.push(`/patient/appointments/book?doctor=${doctorId}`)
        } else {
          router.push('/patient/dashboard')
        }
      } else {
        setError(res.message || 'Invalid mobile number, email or password.')
      }
    })
  }

  return (
    <AuthLayout>
      <div>
        <AuthContextTabs active="patient" doctorQuery={doctorId || undefined} />

        <BookingContextBanner doctorId={doctorId} />

        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome to JeevanCare</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your healthcare, in one place.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Field label="Mobile Number or Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="+91 98470 11111 or patient@example.com"
              className={inputClass}
            />
          </Field>

          <PasswordField
            label="Password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="-mt-2 text-right">
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>

          {error && (
            <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-sm text-red" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={`${btnPrimary} mt-1 w-full`} disabled={pending}>
            {pending && <Spinner />}
            {pending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Factual Trust Indicator */}
        <div className="mt-5 rounded-lg bg-secondary/50 p-2.5 text-center text-[11px] font-medium text-primary border border-primary/15">
          🔒 Secure access · Private patient records · Role-based permissions
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          New to JeevanCare?{' '}
          <Link
            href={doctorId ? `/patient/register?doctor=${doctorId}` : '/patient/register'}
            className="font-semibold text-primary hover:underline"
          >
            Create Patient Account
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
