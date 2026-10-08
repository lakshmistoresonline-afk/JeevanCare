'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { patientRegisterAction } from './actions'
import { AuthLayout } from '@/components/AuthLayout'
import { btnPrimary, inputClass, Field, Spinner } from '@/components/primitives'
import { PasswordField } from '@/components/PasswordField'
import { IconCheck } from '@/components/icons'
import { INDIAN_STATES } from '@/lib/constants'

export default function PatientRegisterPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<{ id: string; name: string; city: string }[]>([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<null | { name: string }>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    fetch('/api/tenants?limit=50')
      .then((res) => res.json())
      .then((data) => {
        if (data.docs) setTenants(data.docs)
      })
      .catch(() => {})
      .finally(() => setLoadingTenants(false))
  }, [])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await patientRegisterAction(null, formData)
      if (res.ok) {
        setSuccess({ name: String(formData.get('name') || 'Patient') })
      } else {
        setError(res.message || 'Could not create patient account.')
      }
    })
  }

  return (
    <AuthLayout>
      {success ? (
        <div className="rounded-2xl border border-primary/20 bg-card p-7 text-center shadow-lg animate-fade-up">
          <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary text-white">
            <IconCheck size={24} strokeWidth={3} />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Your JeevanCare account is ready</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Welcome to JeevanCare, <span className="font-semibold text-ink">{success.name}</span>. You can now access your appointments, prescriptions, and lab reports.
          </p>
          <button
            type="button"
            onClick={() => router.push('/patient/dashboard')}
            className={`${btnPrimary} mt-6 w-full`}
          >
            Go to Patient Portal
          </button>
        </div>
      ) : (
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Create your JeevanCare account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage appointments, prescriptions, medical documents, and visit history in one place.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6">
            {/* Section 1: Personal Information */}
            <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
                1. Personal Information
              </h2>

              <Field label="Full Name" htmlFor="name">
                <input id="name" name="name" type="text" required placeholder="e.g. Anita Krishnan" className={inputClass} />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Mobile Number (+91)" htmlFor="phone">
                  <input id="phone" name="phone" type="tel" required placeholder="+91 98470 11111" className={inputClass} />
                </Field>
                <Field label="Email Address (Optional)" htmlFor="email">
                  <input id="email" name="email" type="email" placeholder="you@example.com" className={inputClass} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date of Birth" htmlFor="dob">
                  <input id="dob" name="dob" type="date" className={inputClass} />
                </Field>
                <Field label="Gender" htmlFor="gender">
                  <select id="gender" name="gender" className={inputClass} defaultValue="female">
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* Section 2: Address Details */}
            <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
                2. Address Details
              </h2>

              <Field label="Address / Locality" htmlFor="addressLine">
                <input id="addressLine" name="addressLine" type="text" placeholder="House/Flat, Street, Area" className={inputClass} />
              </Field>

              <div className="grid grid-cols-3 gap-2">
                <Field label="City" htmlFor="city">
                  <input id="city" name="city" type="text" defaultValue="Thrissur" placeholder="City" className={inputClass} />
                </Field>
                <Field label="State" htmlFor="state">
                  <select id="state" name="state" className={inputClass} defaultValue="Kerala">
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </Field>
                <Field label="PIN Code" htmlFor="pinCode">
                  <input id="pinCode" name="pinCode" type="text" defaultValue="680001" placeholder="680001" className={inputClass} />
                </Field>
              </div>
            </div>

            {/* Section 3: Clinic & Security */}
            <div className="rounded-xl border border-border/80 bg-card p-4 flex flex-col gap-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-primary">
                3. Clinic Link &amp; Security
              </h2>

              <Field label="Select Clinic / Hospital" htmlFor="tenant">
                <select id="tenant" name="tenant" required className={inputClass} defaultValue="">
                  <option value="" disabled>
                    {loadingTenants ? 'Loading clinics...' : 'Choose your registered clinic'}
                  </option>
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.city ? `(${t.city})` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Patient MRN / Activation Code (If claiming clinic record)" htmlFor="activationCode" hint="Enter Patient MRN (e.g. P-0001) printed on your prescription or clinic receipt.">
                <input id="activationCode" name="activationCode" type="text" placeholder="e.g. P-0001" className={inputClass} />
              </Field>

              <PasswordField
                label="Password"
                id="password"
                name="password"
                autoComplete="new-password"
                required
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-sm text-red" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className={`${btnPrimary} w-full`} disabled={pending}>
              {pending && <Spinner />}
              {pending ? 'Creating patient account…' : 'Create Patient Account'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            Already have a patient account?{' '}
            <Link href="/patient/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      )}
    </AuthLayout>
  )
}
