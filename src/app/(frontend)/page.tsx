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
  IconStethoscope,
  IconBuilding,
  IconStaff,
  IconUserPlus,
  IconCalendarCheck,
  IconReceipt,
} from '@/components/icons'

const STEPS = [
  {
    n: '01',
    icon: IconUserPlus,
    title: 'Front-Desk & Walk-In Token Check-In',
    body: 'Register patients with +91 mobile numbers. Walk-in patients receive OPD Queue Tokens (e.g. T-01) instantly while an MRN is assigned.',
  },
  {
    n: '02',
    icon: IconCalendar,
    title: 'Slot Scheduling & Live OPD Queue Tracker',
    body: 'Patients book specific available slots or track their OPD live queue position and estimated wait times directly on their mobile phones.',
  },
  {
    n: '03',
    icon: IconCalendarCheck,
    title: 'Consultation, Prescriptions & UPI Billing',
    body: 'Doctors record vitals, write prescriptions with quick dosage chips (1-0-1 BD), print A5 Rx or share via WhatsApp, and generate instant UPI QR bills in ₹ INR.',
  },
]

const FEATURES = [
  {
    icon: IconCalendar,
    title: 'Live OPD Queue & Token Stepper',
    body: 'Real-time token stepper tracking patient queue progress from check-in to consultation room.',
  },
  {
    icon: IconClock,
    title: 'Double-Booking Race Condition Guard',
    body: 'Slot overlaps are checked inside MongoDB transactions with backstop partial unique indexes to guarantee zero double-bookings.',
  },
  {
    icon: IconUsers,
    title: 'Longitudinal Patient Health Record',
    body: 'Every patient is tracked by per-clinic MRN (e.g. P-0001), prominently displaying allergy alerts and chronological consultation history.',
  },
  {
    icon: IconStethoscope,
    title: 'Practitioner Schedule Management',
    body: 'Configurable daily windows, specific weekdays, on-call, or by-appointment schedules respecting doctor availability.',
  },
  {
    icon: IconStaff,
    title: 'Role-Based Access Control (RBAC)',
    body: 'Owner, Doctor, Receptionist, and Patient roles with strict data isolation and auditability.',
  },
  {
    icon: IconBuilding,
    title: 'Multi-Clinic Tenant Isolation',
    body: 'Secure multi-tenant data boundaries ensuring clinics operate independently in ₹ INR currency and Asia/Kolkata timezone.',
  },
  {
    icon: IconReceipt,
    title: 'Dynamic UPI QR Billing & WhatsApp Sharing',
    body: 'Generates upi://pay payment QR codes on receipts and enables 1-tap WhatsApp sharing for prescriptions and bills.',
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
              Designed for Indian Clinics, Practitioners &amp; Patients
            </span>
            <h1 className="mt-6 max-w-xl font-display text-[2.6rem] leading-[1.06] font-semibold sm:text-[3.6rem]">
              Healthcare Management Built for{' '}
              <span className="relative inline-block text-primary">
                Indian Clinics.
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
              OPD queue tokens, appointment scheduling, split-pane consultations, quick dosage chips (1-0-1 BD), A5 prescriptions, WhatsApp sharing, and dynamic UPI QR billing in ₹ INR.
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
                alt="Doctor consulting patient at JeevanCare Thrissur Clinic"
                fill
                priority
                sizes="(min-width: 1024px) 440px, 90vw"
                className="object-cover object-[60%_20%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sidebar/45 via-transparent to-transparent" />
            </div>

            {/* Floating: Doctor profile chip */}
            <div className="absolute -start-2 top-8 w-[230px] rounded-xl border border-border bg-card/95 p-3 shadow-[0_14px_36px_-14px_rgb(24_35_32/0.35)] backdrop-blur sm:-start-6">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-primary">
                  KN
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[12px] font-semibold">Dr. Kavya Nair</div>
                  <div className="tabular mt-0.5 text-[10px] text-muted-foreground">
                    MBBS, MD · Reg: KMC-2026-101
                  </div>
                  <div className="text-[10px] font-medium text-primary">JeevanCare Thrissur Clinic</div>
                </div>
              </div>
            </div>

            {/* Floating: Live OPD queue token card */}
            <div className="absolute -end-2 bottom-10 w-[240px] rounded-xl border border-border bg-card/95 p-3 shadow-[0_14px_36px_-14px_rgb(24_35_32/0.35)] backdrop-blur sm:-end-5">
              <div className="flex items-center justify-between gap-2">
                <span className="tabular text-[12px] font-bold text-ink">06/10/2026 · 10:30 am</span>
                <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">Token #T-01</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[10px] font-semibold text-primary">
                  AK
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-[12px] font-semibold">Anita Krishnan</div>
                  <div className="tabular text-[10px] text-muted-foreground">+91 98470 11111 · MRN: P-0001</div>
                </div>
              </div>
              <div className="mt-2.5 border-t border-border/60 pt-2 flex items-center justify-between text-[11px] font-semibold text-primary">
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
            { v: 'Multi-Tenant', l: 'Clinic data isolation' },
            { v: '₹ INR Billing', l: 'Dynamic UPI QR Code' },
            { v: '+91 Mobile', l: 'Patient registration & MRN' },
            { v: 'Asia/Kolkata', l: 'IST scheduling & tokens' },
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
          <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Patient &amp; Clinic Journey</span>
          <h2 className="mt-3 font-display text-3xl font-semibold">
            From OPD token check-in to A5 prescription &amp; UPI payment
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Tailored around the fast-paced daily workflow of Indian outpatient clinics.
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
            <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Clinic System Capabilities</span>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              Complete OPD, EMR, Prescription &amp; Billing Platform
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              Everything required to manage your clinic OPD efficiently with zero clutter.
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
            JeevanCare · Your Trusted Healthcare Companion · Designed for Indian Healthcare &amp; Clinics
          </span>
        </div>
      </footer>
    </main>
  )
}
