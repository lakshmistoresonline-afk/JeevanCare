'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { patientLoginAction } from './actions'
import { AuthLayout } from '@/components/AuthLayout'
import { AuthContextTabs } from '@/components/AuthContextTabs'
import { btnPrimary, inputClass, Field, Spinner } from '@/components/primitives'
import { PasswordField } from '@/components/PasswordField'

export default function PatientLoginPage() {
  const router = useRouter()
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
        router.push('/patient/dashboard')
      } else {
        setError(res.message || 'Invalid email or password.')
      }
    })
  }

  return (
    <AuthLayout>
      <div>
        <AuthContextTabs active="patient" />

        <h1 className="font-display text-2xl font-semibold tracking-tight">Patient Portal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to access your appointments, prescriptions, and lab reports.
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
              placeholder="+91 9876543210 or patient@example.com"
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
            {pending ? 'Signing in to Patient Portal…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          New to JeevanCare?{' '}
          <Link href="/patient/register" className="font-semibold text-primary hover:underline">
            Create Patient Account
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}
