'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { signupAction } from './actions'
import { AuthLayout } from '@/components/AuthLayout'
import { btnPrimary, inputClass, Field, Spinner } from '@/components/primitives'
import { PasswordField } from '@/components/PasswordField'
import { AppSelect } from '@/components/AppSelect'
import { IconCheck } from '@/components/icons'
import { COUNTRY_DEFAULTS, DEFAULT_COUNTRY, CURRENCIES, TIMEZONES } from '@/lib/constants'

const STEP_LABELS = [
  { n: '01', title: 'Clinic Identity' },
  { n: '02', title: 'Account Owner' },
  { n: '03', title: 'Setup' },
  { n: '04', title: 'Complete' },
]

const defaultsFor = (country: string) =>
  COUNTRY_DEFAULTS.find((c) => c.label === country) ?? COUNTRY_DEFAULTS[0]

export default function SignupPage() {
  const [pending, start] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<null | { verifyEmail: boolean }>(null)
  const [startedAt] = useState(() => Date.now())

  const initial = defaultsFor(DEFAULT_COUNTRY)
  const [form, setForm] = useState({
    clinicName: '',
    phone: '',
    city: 'Thrissur',
    country: DEFAULT_COUNTRY,
    currency: initial.currency,
    timezone: initial.timezone,
    ownerName: '',
    email: '',
    password: '',
    company: '', // honeypot
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const onCountry = (country: string) => {
    const d = defaultsFor(country)
    setForm((f) => ({ ...f, country, currency: d.currency, timezone: d.timezone }))
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!form.clinicName || !form.phone || !form.city) {
        setError('Please fill in clinic name, phone, and city.')
        return
      }
    } else if (currentStep === 2) {
      if (!form.ownerName || !form.email || !form.password) {
        setError('Please fill in owner name, email, and password.')
        return
      }
    }
    setError(null)
    setCurrentStep((s) => Math.min(s + 1, 3))
  }

  const submit = () => {
    setError(null)
    start(async () => {
      const res = await signupAction({ ...form, startedAt })
      if (res.ok) {
        setDone({ verifyEmail: res.data.verifyEmail })
        setCurrentStep(4)
      } else {
        setError(res.message)
      }
    })
  }

  return (
    <AuthLayout>
      {done ? (
        <div className="rounded-2xl border border-primary/20 bg-card p-7 text-center shadow-lg animate-fade-up">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-white">
            <IconCheck size={24} strokeWidth={3} />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {done.verifyEmail ? 'Check your inbox' : 'Clinic workspace is ready'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {done.verifyEmail
              ? 'We sent a confirmation link to your email. Click it to verify your address — your clinic workspace will then be submitted for admin approval.'
              : 'Your clinic has been registered and is currently queued for admin approval. You can sign in as soon as it is approved.'}
          </p>
          <Link href="/login" className={`${btnPrimary} mt-6 w-full`}>
            Continue to Clinic Sign In
          </Link>
        </div>
      ) : (
        <div>
          {/* Visual 4-Step Stepper Header */}
          <div className="mb-6 grid grid-cols-4 gap-1.5 rounded-xl border border-border bg-card p-1.5 text-center">
            {STEP_LABELS.map((s, idx) => {
              const stepNum = idx + 1
              const isActive = currentStep === stepNum
              const isPast = currentStep > stepNum
              return (
                <div
                  key={s.n}
                  className={`rounded-lg py-1.5 text-[11px] font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-xs'
                      : isPast
                        ? 'bg-secondary text-primary'
                        : 'text-muted-foreground opacity-60'
                  }`}
                >
                  <div>{s.n}</div>
                  <div className="text-[10px] font-medium leading-none mt-0.5">{s.title}</div>
                </div>
              )
            })}
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight">Register Your Clinic</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your clinic workspace in under 60 seconds.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (currentStep < 3) handleNext()
              else submit()
            }}
            className="mt-6 flex flex-col gap-5"
          >
            {/* STEP 1: CLINIC IDENTITY */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-4 animate-fade-up">
                <Field label="Clinic Name" htmlFor="clinicName">
                  <input
                    id="clinicName"
                    name="clinicName"
                    required
                    value={form.clinicName}
                    onChange={(e) => set('clinicName', e.target.value)}
                    placeholder="e.g. Swaraj Medical Centre"
                    className={inputClass}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Clinic Phone" htmlFor="phone">
                    <input
                      id="phone"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder="+91 98470 11111"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="City" htmlFor="city">
                    <input
                      id="city"
                      name="city"
                      required
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="Thrissur"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Country" hint="Sets your default currency & timezone.">
                  <AppSelect
                    value={form.country}
                    onChange={onCountry}
                    options={COUNTRY_DEFAULTS.map((c) => ({ value: c.label, label: c.label }))}
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Currency">
                    <AppSelect
                      value={form.currency}
                      onChange={(v) => set('currency', v)}
                      options={CURRENCIES.map((c) => ({ value: c.value, label: c.value }))}
                    />
                  </Field>
                  <Field label="Timezone">
                    <AppSelect
                      value={form.timezone}
                      onChange={(v) => set('timezone', v)}
                      options={TIMEZONES.map((t) => ({ value: t.value, label: t.label }))}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* STEP 2: ACCOUNT OWNER */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-4 animate-fade-up">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Owner Account Credentials
                </p>
                <Field label="Owner Name" htmlFor="ownerName">
                  <input
                    id="ownerName"
                    name="ownerName"
                    required
                    value={form.ownerName}
                    onChange={(e) => set('ownerName', e.target.value)}
                    placeholder="e.g. Dr. Kavya Nair"
                    className={inputClass}
                  />
                </Field>
                <Field label="Work Email Address" htmlFor="email">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="you@clinic.com"
                    className={inputClass}
                  />
                </Field>
                <PasswordField
                  label="Password"
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => set('password', e.target.value)}
                  hint="At least 8 characters."
                />
              </div>
            )}

            {/* STEP 3: SAMPLE CONFIGURATION REVIEW */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-4 animate-fade-up">
                <div className="rounded-xl border border-primary/20 bg-secondary/30 p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                    3. Sample OPD Workspace Setup
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Your clinic will be pre-configured with sample doctors, available slots, and OPD token counters so you can explore immediately.
                  </p>
                  <dl className="mt-3 divide-y divide-border/60 text-xs">
                    <div className="flex justify-between py-1.5">
                      <dt className="text-muted-foreground">Clinic:</dt>
                      <dd className="font-semibold text-ink">{form.clinicName}</dd>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <dt className="text-muted-foreground">Location:</dt>
                      <dd className="font-medium text-ink">{form.city}, {form.country}</dd>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <dt className="text-muted-foreground">Owner Account:</dt>
                      <dd className="font-medium text-ink">{form.ownerName} ({form.email})</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Honeypot */}
            <div aria-hidden className="hidden">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                value={form.company}
                onChange={(e) => set('company', e.target.value)}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-sm text-red" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3 mt-2">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => Math.max(s - 1, 1))}
                  className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium hover:bg-secondary"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                className={`${btnPrimary} flex-1`}
                disabled={pending}
              >
                {pending && <Spinner />}
                {pending
                  ? 'Registering clinic…'
                  : currentStep === 3
                    ? 'Confirm & Create Clinic'
                    : 'Next Step'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign In to Clinic Workspace
            </Link>
          </p>
        </div>
      )}
    </AuthLayout>
  )
}
