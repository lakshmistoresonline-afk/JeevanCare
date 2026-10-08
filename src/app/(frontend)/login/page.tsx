'use client'

import { Suspense, useActionState, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { loginAction } from './actions'
import { AuthLayout } from '@/components/AuthLayout'
import { AuthContextTabs } from '@/components/AuthContextTabs'
import { btnPrimary, inputClass, Field, Spinner } from '@/components/primitives'
import { PasswordField } from '@/components/PasswordField'

const DEMO_ACCOUNTS = [
  { label: 'Owner', email: 'owner1@test.com' },
  { label: 'Receptionist', email: 'staff1@test.com' },
  { label: 'Doctor', email: 'doctor1@test.com' },
  { label: 'Super admin', email: 'admin@test.com' },
]

export default function LoginPage() {
  return (
    <Suspense>
      <AuthLayout>
        <LoginForm />
      </AuthLayout>
    </Suspense>
  )
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null)
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [password, setPassword] = useState('')

  useEffect(() => {
    if (state?.ok) {
      router.push(state.data.role === 'superAdmin' ? '/super' : '/dashboard')
    }
  }, [state, router])

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword('Test@123')
  }

  return (
    <div>
      <AuthContextTabs active="clinic" />

      <h1 className="font-display text-2xl font-semibold tracking-tight">Clinic Workspace</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        For doctors, clinic owners, and authorized staff.
      </p>

      <form action={formAction} className="mt-6 flex flex-col gap-4">
        <Field label="Work Email Address" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@clinic.com"
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
          {pending ? 'Signing in to Clinic Workspace…' : 'Sign In'}
        </button>
      </form>

      {/* Demo quick-fill */}
      <div className="mt-6 rounded-xl border border-border bg-card p-3.5">
        <p className="text-xs font-medium text-muted-foreground">
          Demo — click to prefill test credentials:
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((d) => (
            <button
              key={d.email}
              type="button"
              onClick={() => quickFill(d.email)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                email === d.email
                  ? 'border-primary/30 bg-secondary text-primary font-semibold'
                  : 'border-border bg-canvas text-muted-foreground hover:border-primary/30 hover:text-primary'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-muted-foreground">
        New clinic?{' '}
        <Link href="/signup" className="font-semibold text-primary hover:underline">
          Register Your Clinic
        </Link>
      </div>
    </div>
  )
}
