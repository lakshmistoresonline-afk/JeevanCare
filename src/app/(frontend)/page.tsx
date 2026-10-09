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
      {/* Navigation Header */}
      <JeevanCareHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 60% at 75% 0%, rgb(13 110 96 / 0.12), transparent), radial-gradient(rgb(24 35 32 / 0.05) 1px, transparent 1px)',
            backgroundSize: 'auto, 28px 28px',
          }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pt-12 pb-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16 lg:pb-20">
          {/* Hero Copy */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3.5 py-1 text-xs font-semibold text-primary">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Designed for Indian Clinics, Practitioners &amp; Patients
            </span>
            <h1 className="mt-5 max-w-2xl font-display text-[2.6rem] leading-[1.08] font-bold sm:text-[3.6rem] text-ink">
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
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              OPD queue tokens, appointment scheduling, split-pane consultations, quick dosage chips (1-0-1 BD), A5 prescriptions, WhatsApp sharing, and dynamic UPI QR billing in ₹ INR.
            </p>
            <p className="mt-2 text-xs italic text-faint">JeevanCare · Your Trusted Healthcare Companion.</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/signup" className={btnPrimary}>
                Register Your Clinic
                <IconArrowRight size={15} />
              </Link>
              <Link href="/patient/login" className={btnGhost}>
                Patient Portal Sign In
              </Link>
            </div>
          </div>

          {/* Photo & Floating Feature Cards */}
          <div className="relative animate-fade-up [animation-delay:80ms]">
            <div className="relative mx-auto aspect-[4/4.2] max-w-[480px] overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_70px_-30px_rgb(13_110_96/0.45)]">
              <Image
                src="/images/hero-doctor2.jpg"
                alt="Doctor consulting patient at JeevanCare Thrissur Clinic"
                fill
                priority
                sizes="(min-width: 1024px) 480px, 90vw"
                className="object-cover object-[60%_20%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-sidebar/45 via-transparent to-transparent" />
            </div>

            {/* Floating: Doctor profile chip */}
            <div className="absolute -start-2 top-8 w-[240px] rounded-2xl border border-border bg-card/95 p-3.5 shadow-md backdrop-blur sm:-start-6">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                  KN
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-xs font-bold text-ink">Dr. Kavya Nair</div>
                  <div className="tabular mt-0.5 text-[10px] text-muted-foreground">
                    MBBS, MD · Reg: KMC-2026-101
                  </div>
                  <div className="text-[10px] font-semibold text-primary">JeevanCare Thrissur Clinic</div>
                </div>
              </div>
            </div>

            {/* Floating: Live OPD queue token card */}
            <div className="absolute -end-2 bottom-8 w-[250px] rounded-2xl border border-border bg-card/95 p-3.5 shadow-md backdrop-blur sm:-end-5">
              <div className="flex items-center justify-between gap-2">
                <span className="tabular text-xs font-bold text-ink">Today · 10:30 am</span>
                <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold text-white">Token #T-01</span>
              </div>
              <div className="mt-2 flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary">
                  AK
                </span>
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-xs font-bold text-ink">Anita Krishnan</div>
                  <div className="tabular text-[10px] text-muted-foreground">+91 98470 11111 · MRN: P-0001</div>
                </div>
              </div>
              <div className="mt-2.5 border-t border-border/60 pt-2 flex items-center justify-between text-xs font-bold text-primary">
                <span>Consultation Fee</span>
                <span className="tabular">₹500</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Pillars Strip */}
      <section className="border-b border-border/70 bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/70 px-6 sm:grid-cols-4">
          {[
            { v: 'Multi-Tenant', l: 'Clinic data isolation' },
            { v: '₹ INR Billing', l: 'Dynamic UPI QR Code' },
            { v: '+91 Mobile', l: 'Patient registration & MRN' },
            { v: 'Asia/Kolkata', l: 'IST scheduling & tokens' },
          ].map((s) => (
            <div key={s.l} className="px-4 py-5 text-center sm:py-6">
              <div className="tabular font-display text-lg font-bold text-primary sm:text-xl">{s.v}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Clinics & Doctors Interactive Finder */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <ClinicDoctorFinder clinics={clinics} doctors={doctors} />
      </section>

      {/* How It Works Journey */}
      <section id="how" className="border-t border-border/70 bg-card/40 scroll-mt-20 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Patient &amp; Clinic Journey</span>
            <h2 className="mt-2.5 font-display text-2xl sm:text-3xl font-bold text-ink">
              From OPD token check-in to A5 prescription &amp; UPI payment
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tailored around the fast-paced daily workflow of Indian outpatient clinics.
            </p>
          </div>
          <div className="relative mt-10 grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.n} className="card-flat relative p-6">
                  <div className="flex items-center gap-3">
                    <span className="relative flex size-11 items-center justify-center rounded-xl bg-secondary text-primary ring-4 ring-canvas">
                      <Icon size={20} strokeWidth={1.75} />
                    </span>
                    <span className="tabular font-display text-sm font-bold text-faint">{s.n}</span>
                  </div>
                  <h3 className="mt-4 text-base font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="border-t border-border/70 bg-card py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Clinic System Capabilities</span>
            <h2 className="mt-2.5 font-display text-2xl sm:text-3xl font-bold text-ink">
              Complete OPD, EMR, Prescription &amp; Billing Platform
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Everything required to manage your clinic OPD efficiently with zero clutter.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card-flat p-5">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-3.5 text-base font-bold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/70 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8 text-xs text-faint">
          <span className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">
              J
            </span>
            <span className="font-display text-base font-bold text-primary">JeevanCare</span>
          </span>
          <span>
            JeevanCare · Your Trusted Healthcare Companion · Designed for Indian Healthcare &amp; Clinics
          </span>
        </div>
      </footer>
    </main>
  )
}
