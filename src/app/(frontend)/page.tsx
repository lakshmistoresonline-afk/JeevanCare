import Link from 'next/link'
import Image from 'next/image'
import { btnPrimary, btnGhost } from '@/components/primitives'
import { JeevanCareHeader } from '@/components/JeevanCareHeader'
import { ClinicDoctorFinder } from '@/components/ClinicDoctorFinder'
import { getPayloadClient } from '@/lib/auth'
import {
  IconCalendar,
  IconUsers,
  IconClock,
  IconArrowRight,
  IconCheck,
  IconStethoscope,
  IconBuilding,
  IconStaff,
  IconUserPlus,
  IconCalendarCheck,
} from '@/components/icons'

const STEPS = [
  {
    n: '01',
    icon: IconUserPlus,
    title: 'Register the patient',
    body: 'Name and +91 mobile number is enough. An MRN is assigned automatically and their medical history starts building.',
  },
  {
    n: '02',
    icon: IconCalendar,
    title: 'Book a slot — or take a walk-in',
    body: 'Pick a doctor with real-time availability. Walk-ins receive an OPD queue token instantly.',
  },
  {
    n: '03',
    icon: IconCalendarCheck,
    title: 'Run the clinic day smoothly',
    body: 'Check-in, consultations, NMC-compliant prescriptions, ₹ billing, and follow-ups from one screen.',
  },
]

const FEATURES = [
  {
    icon: IconCalendar,
    title: 'Live OPD queue & tokens',
    body: 'A simple token list for the front desk and a consultation timeline for the doctor — zero friction.',
  },
  {
    icon: IconClock,
    title: 'Zero double-bookings',
    body: 'Slot overlaps are checked inside database transactions to ensure absolute appointment integrity.',
  },
  {
    icon: IconUsers,
    title: 'Connected patient history',
    body: 'Every patient gets an MRN, allergy alerts front-and-centre, and a chronological visit log.',
  },
  {
    icon: IconStethoscope,
    title: 'Real doctor schedules',
    body: 'Daily windows, specific weekdays, on-call, or by-appointment — booking respects all practitioner rules.',
  },
  {
    icon: IconStaff,
    title: 'Clinic role-based access',
    body: 'Owner, receptionist, doctor, and patient portal — each sees exactly what their role requires.',
  },
  {
    icon: IconBuilding,
    title: 'Multi-clinic isolation',
    body: 'Each clinic operates securely with its own tenant boundary, ₹ currency, and working hours.',
  },
]

export default async function HomePage() {
  const payload = await getPayloadClient()
  const tenantsRes = await payload.find({
    collection: 'tenants',
    where: { status: { equals: 'active' } },
    limit: 20,
    overrideAccess: true,
  })
  const clinics = tenantsRes.docs

  const doctorsRes = await payload.find({
    collection: 'users',
    where: { role: { equals: 'doctor' }, active: { equals: true } },
    limit: 50,
    overrideAccess: true,
  })
  const doctors = doctorsRes.docs

  return (
    <main className="min-h-screen bg-canvas">
      {/* ---------------- Nav ---------------- */}
      <JeevanCareHeader />

      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 60% 55% at 75% 0%, rgb(13 110 96 / 0.09), transparent), radial-gradient(rgb(24 35 32 / 0.05) 1px, transparent 1px)',
            backgroundSize: 'auto, 28px 28px',
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pt-14 pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:pt-20">
          {/* Copy */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3 py-1 text-xs font-medium text-primary">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Built for Indian clinics, doctors &amp; patients
            </span>
            <h1 className="mt-6 max-w-xl font-display text-[2.6rem] leading-[1.06] font-semibold sm:text-[3.6rem]">
              Healthcare management built for{' '}
              <span className="relative inline-block text-primary">
                Indian clinics.
                <svg
                  viewBox="0 0 220 10"
                  className="absolute -bottom-2 start-0 w-full text-primary/30"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <path d="M2 8c40-5 140-7 216-3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground">
              Appointments, patient records, consultations, NMC-compliant prescriptions and ₹ billing — designed around the way Indian out-patient clinics work.
            </p>
            <p className="mt-2 text-sm italic text-faint">JeevanCare · Your Trusted Healthcare Companion.</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={btnPrimary}>
                Register Your Clinic
                <IconArrowRight size={15} />
              </Link>
              <Link href="/patient/login" className={btnGhost}>
                Patient Portal Sign In
              </Link>
            </div>
          </div>

          {/* Photo + floating product cards */}
          <div className="relative animate-fade-up [animation-delay:80ms]">
            <div className="relative mx-auto aspect-[4/4.4] max-w-[440px] overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_30px_70px_-30px_rgb(13_110_96/0.45)]">
              <Image
                src="/images/hero-doctor2.jpg"
                alt="Doctor consulting patient in modern clinic"
                fill
                priority
                sizes="(min-width: 1024px) 440px, 90vw"
                className="object-cover object-[60%_20%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sidebar/45 via-transparent to-transparent" />
            </div>

            {/* floating: doctor schedule chip */}
            <div className="absolute -start-2 top-8 w-[210px] rounded-xl border border-border bg-card/95 p-3 shadow-[0_14px_36px_-14px_rgb(24_35_32/0.35)] backdrop-blur sm:-start-6">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary">
                  AM
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[12px] font-semibold">Dr. Arjun Menon</div>
                  <div className="tabular mt-0.5 text-[10px] text-muted-foreground">
                    General Medicine · Reg: SMC-12345
                  </div>
                </div>
              </div>
            </div>

            {/* floating: live appointment card */}
            <div className="absolute -end-2 bottom-10 w-[230px] rounded-xl border border-border bg-card/95 p-3 shadow-[0_14px_36px_-14px_rgb(24_35_32/0.35)] backdrop-blur sm:-end-5">
              <div className="flex items-center justify-between gap-2">
                <span className="tabular text-[12px] font-bold">10:30 am</span>
                <span className="rounded bg-blue-soft px-1.5 py-0.5 text-[10px] font-bold text-blue">Token #04</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-blue-soft text-[10px] font-semibold text-blue">
                  AK
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[12px] font-semibold">Anita Krishnan</div>
                  <div className="tabular text-[10px] text-muted-foreground">+91 98400 11111</div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] font-semibold text-primary">
                <span>Consultation Fee</span>
                <span className="tabular">₹500</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Product Pillars strip ---------------- */}
      <section className="border-y border-border/70 bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-border/70 px-6 sm:grid-cols-4">
          {[
            { v: 'Multi-Tenant', l: 'Secure clinic isolation' },
            { v: '₹ / INR', l: 'Indian clinic billing' },
            { v: '+91 Mobile', l: 'Patient registration' },
            { v: 'ABDM Ready', l: 'Health ID optional' },
          ].map((s) => (
            <div key={s.l} className="px-4 py-6 text-center sm:py-7">
              <div className="tabular font-display text-lg font-semibold text-primary sm:text-xl">{s.v}</div>
              <div className="mt-1 text-xs text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Clinics & Doctors Directory ---------------- */}
      <ClinicDoctorFinder clinics={clinics} doctors={doctors} />

      {/* ---------------- How it works ---------------- */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="mx-auto max-w-xl text-center">
          <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Patient Journey</span>
          <h2 className="mt-3 font-display text-3xl font-semibold">
            From registration to prescription, seamlessly
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Designed for Indian outpatient clinics — fast, mobile-friendly, and connected.
          </p>
        </div>
        <div className="relative mt-12 grid gap-5 md:grid-cols-3">
          <div className="pointer-events-none absolute inset-x-16 top-[2.4rem] hidden border-t-2 border-dashed border-border md:block" />
          {STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.n} className="card-flat relative p-6 pt-7">
                <div className="flex items-center gap-3">
                  <span className="relative flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary ring-4 ring-canvas">
                    <Icon size={20} strokeWidth={1.75} />
                  </span>
                  <span className="tabular font-display text-sm font-semibold text-faint">{s.n}</span>
                </div>
                <h3 className="mt-4 text-[16px] font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="border-t border-border/70 bg-card py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto max-w-xl text-center">
            <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Features</span>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              Everything your clinic needs, nothing it doesn&rsquo;t
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Built specifically around Indian clinical practice and front-desk workflows.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card-flat p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-4 text-[16px] font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="border-t border-border/70 bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-8 text-xs text-faint">
          <span className="flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded bg-primary text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="size-3" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m-7-7h14" />
              </svg>
            </span>
            <span className="font-display text-sm font-semibold text-primary/80">JeevanCare</span>
          </span>
          <span>
            JeevanCare · Your Trusted Healthcare Companion · Built for Indian Healthcare &amp; Clinics
          </span>
        </div>
      </footer>
    </main>
  )
}
