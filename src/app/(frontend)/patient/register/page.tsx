'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { patientRegisterAction } from './actions'
import { btnPrimary, inputClass, Field, Spinner } from '@/components/primitives'

export default function PatientRegisterPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<{ id: string; name: string; city: string }[]>([])
  const [loadingTenants, setLoadingTenants] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
        router.push('/patient/dashboard')
      } else {
        setError(res.message || 'Could not create patient account.')
      }
    })
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="size-3.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
            </svg>
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-primary">JeevanCare</span>
        </Link>

        <h1 className="font-display text-2xl font-semibold tracking-tight">Create your Patient Account</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Register to book appointments, view your prescriptions, and access medical records.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Field label="Select Clinic / Hospital" htmlFor="tenant">
            <select id="tenant" name="tenant" required className={inputClass} defaultValue="">
              <option value="" disabled>
                {loadingTenants ? 'Loading clinics...' : 'Select your clinic'}
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.city ? `(${t.city})` : ''}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Full Name" htmlFor="name">
            <input id="name" name="name" type="text" required placeholder="e.g. Anita Krishnan" className={inputClass} />
          </Field>

          <Field label="Mobile Number (+91...)" htmlFor="phone">
            <input id="phone" name="phone" type="tel" required placeholder="+91 9876543210" className={inputClass} />
          </Field>

          <Field label="Email (Optional)" htmlFor="email">
            <input id="email" name="email" type="email" placeholder="you@example.com" className={inputClass} />
          </Field>

          <Field label="Password" htmlFor="password">
            <input id="password" name="password" type="password" required placeholder="••••••••" className={inputClass} />
          </Field>

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

          <Field label="Address / Locality" htmlFor="addressLine">
            <input id="addressLine" name="addressLine" type="text" placeholder="House/Flat, Street, Area" className={inputClass} />
          </Field>

          <div className="grid grid-cols-3 gap-2">
            <Field label="City" htmlFor="city">
              <input id="city" name="city" type="text" placeholder="City" className={inputClass} />
            </Field>
            <Field label="State" htmlFor="state">
              <input id="state" name="state" type="text" placeholder="State" className={inputClass} />
            </Field>
            <Field label="PIN Code" htmlFor="pinCode">
              <input id="pinCode" name="pinCode" type="text" placeholder="PIN Code" className={inputClass} />
            </Field>
          </div>

          {error && (
            <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-sm text-red" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className={`${btnPrimary} mt-2 w-full`} disabled={pending}>
            {pending && <Spinner />}
            {pending ? 'Creating account…' : 'Create Patient Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Already have a patient account?{' '}
          <Link href="/patient/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
