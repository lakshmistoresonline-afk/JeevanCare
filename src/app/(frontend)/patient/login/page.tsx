'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { patientLoginAction } from './actions'
import { btnPrimary, inputClass, Field, Spinner } from '@/components/primitives'

export default function PatientLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('email', email)
      formData.set('password', password)
      const res = await patientLoginAction(null, formData)
      if (res.ok) {
        router.push('/patient/dashboard')
      } else {
        setError(res.message || 'Invalid email or password.')
      }
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm animate-fade-up">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
            </svg>
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-primary">JeevanCare</span>
        </Link>

        <h1 className="font-display text-2xl font-semibold tracking-tight">Patient Portal</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Sign in to view your appointments, medical history, and documents.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <Field label="Email" htmlFor="email">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </Field>

          {error && (
            <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-sm text-red" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={`${btnPrimary} mt-1 w-full`} disabled={pending}>
            {pending && <Spinner />}
            {pending ? 'Signing in…' : 'Sign in to Patient Portal'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-center text-xs text-muted-foreground">
          <div>
            New patient?{' '}
            <Link href="/patient/register" className="font-medium text-primary hover:underline">
              Create Patient Account
            </Link>
          </div>
          <div>
            Are you clinic staff?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
