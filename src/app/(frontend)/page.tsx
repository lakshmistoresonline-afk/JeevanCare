import Link from 'next/link'
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
  IconCheck,
} from '@/components/icons'

const STEPS = [
  {
    n: '01',
    icon: IconCalendar,
    title: 'Book Appointment',
    body: 'Choose a clinic, doctor, and convenient time slot in IST.',
  },
  {
    n: '02',
    icon: IconUserPlus,
    title: 'Check-In',
    body: 'Get your digital OPD queue token (e.g. T-01) at the clinic front desk.',
  },
  {
    n: '03',
    icon: IconStethoscope,
    title: 'Consult',
    body: 'Meet your doctor with full access to vitals and longitudinal health records.',
  },
  {
    n: '04',
    icon: IconStaff,
    title: 'Prescribe',
    body: 'Receive digital A5 prescriptions with quick dosage instructions.',
  },
  {
    n: '05',
    icon: IconReceipt,
    title: 'Bill & Records',
    body: 'Pay via dynamic UPI QR code and download reports anytime.',
  },
]

const FEATURES = [
  {
    icon: IconCalendar,
    title: 'Appointment Management',
    body: 'Online and walk-in scheduling with conflict detection.',
  },
  {
    icon: IconClock,
    title: 'OPD Queue & Token Stepper',
    body: 'Real-time clinic queue tracking from check-in to consultation room.',
  },
  {
    icon: IconStethoscope,
    title: 'Consultation & EMR',
    body: 'Fast, structured clinical workspace with past medical history.',
  },
  {
    icon: IconStaff,
    title: 'Prescriptions & Treatment Kits',
    body: 'Safe digital prescriptions with 1-tap dosage chips (1-0-1 BD).',
  },
  {
    icon: IconUsers,
    title: 'Medical Documents',
    body: 'Secure lab reports, scans, and consultation history.',
  },
  {
    icon: IconReceipt,
    title: 'Billing & UPI Payments',
    body: 'Instant invoices, receipts, and dynamic upi://pay QR codes in ₹ INR.',
  },
]

const FAQS = [
  { q: 'How do I register my clinic?', a: 'Click "Register Your Clinic", enter your clinic name and mobile number. Your account is created instantly with a 14-day free trial.' },
  { q: 'Is patient data secure?', a: 'Yes. Every clinic operates inside isolated database boundaries with strict role-based access control and SHA-256 document checksums.' },
  { q: 'Can patients book online?', a: 'Yes! Patients can find your clinic, view real-time available slots, and book appointments directly on mobile or web.' },
  { q: 'Do you support multiple doctors?', a: 'Absolutely. You can add unlimited doctors, assign consultation rooms, set individual availability windows, and manage staff roles.' },
  { q: 'Can I import existing data?', a: 'Yes, JeevanCare includes CSV bulk import templates for patient master lists and doctor schedules.' },
  { q: 'Is there a mobile app?', a: 'JeevanCare is a fully responsive Progressive Web App (PWA) that runs seamlessly on Android, iOS, tablets, and desktop browsers.' },
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
    <main className="min-h-screen bg-canvas text-ink">
      {/* Navigation Header */}
      <JeevanCareHeader />

      {/* Hero Section (Balanced Two-Column Composition) */}
      <section className="relative overflow-hidden border-b border-border/80 bg-canvas">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 60% at 75% 0%, rgb(13 110 96 / 0.12), transparent), radial-gradient(rgb(24 35 32 / 0.05) 1px, transparent 1px)',
            backgroundSize: 'auto, 28px 28px',
          }}
        />
        <div className="relative mx-auto max-w-7xl grid items-center gap-10 px-6 sm:px-8 lg:px-12 pt-12 pb-16 lg:grid-cols-[1.05fr_0.95fr] lg:pt-16 lg:pb-20">
          {/* Left Copy Panel */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3.5 py-1 text-xs font-bold text-primary">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Designed for Indian Clinics
            </span>

            <h1 className="mt-5 font-display text-[2.8rem] leading-[1.06] font-bold sm:text-[3.8rem] text-ink tracking-tight">
              Better clinic days <br />
              <span className="relative inline-block text-primary">
                start here.
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
              Manage appointments, OPD queue, consultations, prescriptions, medical documents and billing — all in one connected workspace.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/patient/appointments/book" className={btnPrimary}>
                Book an Appointment
                <IconArrowRight size={15} />
              </Link>
              <Link href="/login" className={btnGhost}>
                Clinic Login
              </Link>
            </div>

            <div className="mt-3">
              <Link href="/signup" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                Register Your Clinic &rarr;
              </Link>
            </div>

            {/* Stat Counters Row */}
            <div className="mt-10 border-t border-border/80 pt-6 grid grid-cols-4 gap-4 text-start">
              <div>
                <div className="tabular font-display text-2xl font-bold text-ink">2.5L+</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Appointments</div>
              </div>
              <div>
                <div className="tabular font-display text-2xl font-bold text-ink">100+</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Clinics</div>
              </div>
              <div>
                <div className="tabular font-display text-2xl font-bold text-ink">50K+</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Patients</div>
              </div>
              <div>
                <div className="text-xs font-bold text-primary">Made for</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Indian Healthcare</div>
              </div>
            </div>
          </div>

          {/* Right Product Preview Mockup (Prominent & Balanced) */}
          <div className="relative animate-fade-up [animation-delay:80ms]">
            <div className="relative w-full max-w-[540px] mx-auto overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl p-5 space-y-4">
              {/* Mockup Header Bar */}
              <div className="flex items-center justify-between border-b border-border/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">J</span>
                  <span className="font-display text-sm font-bold text-primary">JeevanCare</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="tabular font-semibold text-muted-foreground">Mon, 6 Oct 2026</span>
                  <div className="flex items-center gap-1.5 font-bold text-ink">
                    <span className="size-6 rounded-full bg-secondary text-primary flex items-center justify-center text-[10px]">DM</span>
                    <span>Dr. Meera Nair</span>
                  </div>
                </div>
              </div>

              {/* Mockup KPI Stats Row */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-xl border border-border bg-canvas p-2.5">
                  <div className="tabular font-bold text-lg text-ink">28</div>
                  <div className="text-[10px] text-muted-foreground">Total Appts</div>
                </div>
                <div className="rounded-xl border border-amber/30 bg-amber-soft/50 p-2.5">
                  <div className="tabular font-bold text-lg text-amber">12</div>
                  <div className="text-[10px] text-amber font-semibold">Waiting</div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-secondary/50 p-2.5">
                  <div className="tabular font-bold text-lg text-primary">8</div>
                  <div className="text-[10px] text-primary font-semibold">Consulted</div>
                </div>
                <div className="rounded-xl border border-border bg-canvas p-2.5">
                  <div className="tabular font-bold text-lg text-ink">2</div>
                  <div className="text-[10px] text-muted-foreground">In Progress</div>
                </div>
              </div>

              {/* Mockup OPD Queue & Appts Tables */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-border bg-canvas p-3 space-y-2">
                  <div className="font-bold text-ink text-[11px] uppercase tracking-wider">Live Queue</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center rounded bg-card p-1.5 border border-border/60">
                      <span className="font-bold text-primary">T-01</span>
                      <span className="font-semibold">Patient A</span>
                      <span className="text-[10px] bg-amber-soft text-amber px-1.5 py-0.5 rounded font-bold">Waiting</span>
                    </div>
                    <div className="flex justify-between items-center rounded bg-card p-1.5 border border-border/60">
                      <span className="font-bold text-primary">T-02</span>
                      <span className="font-semibold">Patient B</span>
                      <span className="text-[10px] bg-amber-soft text-amber px-1.5 py-0.5 rounded font-bold">Waiting</span>
                    </div>
                    <div className="flex justify-between items-center rounded bg-card p-1.5 border border-border/60">
                      <span className="font-bold text-primary">T-03</span>
                      <span className="font-semibold">Patient C</span>
                      <span className="text-[10px] bg-secondary text-primary px-1.5 py-0.5 rounded font-bold">Done</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-canvas p-3 space-y-2">
                  <div className="font-bold text-ink text-[11px] uppercase tracking-wider">Today&apos;s Appts</div>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between items-center rounded bg-card p-1.5 border border-border/60">
                      <span className="font-semibold">Patient A</span>
                      <span className="text-[10px] bg-secondary text-primary px-1.5 py-0.5 rounded font-bold">Checked In</span>
                    </div>
                    <div className="flex justify-between items-center rounded bg-card p-1.5 border border-border/60">
                      <span className="font-semibold">Patient B</span>
                      <span className="text-[10px] bg-secondary text-primary px-1.5 py-0.5 rounded font-bold">Consulting</span>
                    </div>
                    <div className="flex justify-between items-center rounded bg-card p-1.5 border border-border/60">
                      <span className="font-semibold">Patient C</span>
                      <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-bold">Scheduled</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Illustrative Preview Badge */}
              <div className="text-center pt-2">
                <span className="inline-block rounded-full bg-secondary px-3 py-1 text-[11px] font-bold text-primary">
                  Illustrative product preview (no real patient data)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Badges Strip */}
      <section className="border-b border-border/80 bg-card py-6">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {[
            { title: 'Appointment Management', icon: IconCalendar },
            { title: 'OPD Queue & Walk-ins', icon: IconClock },
            { title: 'Consultations & EMR', icon: IconStethoscope },
            { title: 'Prescriptions', icon: IconStaff },
            { title: 'Medical Documents', icon: IconUsers },
            { title: 'Billing & UPI Payments', icon: IconReceipt },
          ].map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="rounded-2xl border border-border/80 bg-canvas p-3.5 flex flex-col items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-lg bg-secondary text-primary">
                  <Icon size={16} />
                </span>
                <span className="text-xs font-bold text-ink leading-snug">{item.title}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Doctor & Clinic Finder (Shared Content Width Container) */}
      <section id="clinics" className="py-12">
        <ClinicDoctorFinder clinics={clinics} doctors={doctors} />
      </section>

      {/* How It Works Patient Journey */}
      <section id="how" className="border-t border-border/80 bg-card/50 py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">How It Works</span>
            <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-ink">
              Seamless Patient Care Journey
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              From online slot selection to OPD check-in, prescription, and UPI billing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {STEPS.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.n} className="card-flat p-5 flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon size={18} />
                    </span>
                    <span className="tabular font-display text-xs font-bold text-faint">{s.n}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-ink">{s.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Substantial Key Features Grid */}
      <section id="features" className="border-t border-border/80 bg-canvas py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Key Features Section</span>
            <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-ink">
              Built for Modern Outpatient Healthcare
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="card-flat p-6">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon size={18} />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold text-ink">{f.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{f.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Trust, Security & Care */}
      <section className="border-t border-border/80 bg-card py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Trust, Security &amp; Care</span>
            <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-ink">
              Enterprise Data Protection &amp; Patient Privacy
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { title: 'Your data stays private', desc: 'Clinic-level data isolation and encrypted medical documents.' },
              { title: 'Role-based access', desc: 'Strict permissions for Owners, Doctors, Receptionists, and Patients.' },
              { title: 'Secure medical records', desc: 'SHA-256 document checksums and immutable audit logging.' },
              { title: 'Built for Indian healthcare', desc: 'Native ₹ INR, IST Asia/Kolkata timezone, and +91 mobile verification.' },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-border bg-canvas p-5 space-y-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-primary font-bold text-xs">🛡️</span>
                <h3 className="font-bold text-sm text-ink">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Simple) */}
      <section id="pricing" className="border-t border-border/80 bg-canvas py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Pricing Section (Simple)</span>
            <h2 className="mt-1.5 font-display text-2xl sm:text-3xl font-bold text-ink">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">Made for Indian clinics. No hidden fees or lock-ins.</p>
          </div>

          <div className="max-w-md mx-auto card-flat p-8 text-center space-y-6 shadow-md border-primary/30">
            <div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary uppercase">
                Clinic Plan
              </span>
              <div className="mt-4 flex items-baseline justify-center gap-1">
                <span className="tabular font-display text-4xl font-extrabold text-ink">₹2,999</span>
                <span className="text-xs font-semibold text-muted-foreground">/month</span>
              </div>
            </div>

            <ul className="space-y-3 text-xs font-medium text-ink text-start max-w-xs mx-auto">
              {[
                'Complete OPD & EMR Workspace',
                'Prescription & Document Library',
                'Billing & Dynamic UPI QR Payments',
                'Multi-doctor support & RBAC',
                'Priority WhatsApp & phone support',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <IconCheck size={14} className="text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <Link href="/signup" className={`${btnPrimary} w-full justify-center text-xs font-bold`}>
              Register Your Clinic
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="border-t border-border/80 bg-card py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">FAQ Section</span>
            <h2 className="mt-1.5 font-display text-2xl font-bold text-ink">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-border/80 bg-canvas p-4 text-xs font-semibold">
                <summary className="cursor-pointer flex items-center justify-between text-ink hover:text-primary">
                  <span>{faq.q}</span>
                  <span className="transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-3 text-muted-foreground font-normal leading-relaxed border-t border-border/60 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 sm:px-8 lg:px-12 py-8 text-xs text-faint">
          <span className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">J</span>
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
