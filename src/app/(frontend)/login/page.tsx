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

  useEffect(() => {
    getActiveSessionUser().then((res) => {
      if (res) setActiveUser(res)
    })
  }, [])

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

  return (
    <AuthLayout>
      <div>
        <BookingContextBanner doctorId={doctorId} />

        <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome to JeevanCare</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your account for clinic workspace or patient portal.
        </p>

        {activeUser && activeUser.active ? (
          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary-soft/40 p-5 space-y-4 animate-fade-up">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-xs">
                👤
              </span>
              <div>
                <div className="text-xs font-bold text-primary uppercase">Active Session Detected</div>
                <h2 className="font-display text-base font-bold text-ink">{activeUser.name}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeUser.email} · Role: <span className="font-semibold capitalize text-ink">{activeUser.role === 'superAdmin' ? 'Super Admin' : activeUser.role === 'owner' ? 'Clinic Admin' : activeUser.role}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => {
                  if (activeUser.role === 'superAdmin') router.push('/super')
                  else if (activeUser.role === 'patient') router.push('/patient/dashboard')
                  else router.push('/dashboard')
                }}
                className={`${btnPrimary} w-full`}
              >
                Continue to {activeUser.role === 'superAdmin' ? 'Super Admin' : activeUser.role === 'patient' ? 'Patient Portal' : 'Clinic Dashboard'} Workspace →
              </button>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="w-full text-xs font-semibold text-muted-foreground hover:text-red hover:underline py-1.5 transition-colors"
                >
                  Log Out &amp; Switch Account
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
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

            <QuickLoginToolbar
              onSelectAccount={(accEmail, accPassword) => {
                setEmail(accEmail)
                setPassword(accPassword || 'Test@123')
              }}
            />
          </>
        )}
      </div>
    </AuthLayout>
  )
}
