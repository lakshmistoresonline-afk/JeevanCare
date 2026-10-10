import Link from 'next/link'
import { btnPrimary, btnGhost } from '@/components/primitives'
import { JeevanCareHeader } from '@/components/JeevanCareHeader'
import {
  IconCalendar,
  IconClock,
  IconArrowRight,
  IconStethoscope,
  IconBuilding,
  IconStaff,
  IconReceipt,
} from '@/components/icons'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      {/* Navigation Header */}
      <JeevanCareHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/80 bg-canvas py-12 lg:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 70% 60% at 75% 0%, rgb(13 110 96 / 0.12), transparent), radial-gradient(rgb(24 35 32 / 0.05) 1px, transparent 1px)',
            backgroundSize: 'auto, 28px 28px',
          }}
        />
        <div className="relative mx-auto max-w-7xl grid items-center gap-10 px-6 sm:px-8 lg:px-12 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Left Copy Panel */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-3.5 py-1 text-xs font-bold text-primary">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
              </span>
              Designed for Indian Healthcare
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
              <Link href="/clinics" className={btnPrimary}>
                Find a Doctor / Book
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

            {/* Product Capability Highlights */}
            <div className="mt-10 border-t border-border/80 pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-start">
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider">Multi-Clinic</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Tenant Isolation</div>
              </div>
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider">+91 Mobile</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Patient Accounts</div>
              </div>
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider">₹ INR Billing</div>
                <div className="text-[11px] font-semibold text-muted-foreground">Dynamic UPI QR</div>
              </div>
              <div>
                <div className="text-xs font-bold text-primary uppercase tracking-wider">Asia/Kolkata</div>
                <div className="text-[11px] font-semibold text-muted-foreground">IST Time Slots</div>
              </div>
            </div>
          </div>

          {/* Right Illustrative Product Preview Mockup */}
          <div className="relative animate-fade-up [animation-delay:80ms]">
            <div className="relative w-full max-w-[540px] mx-auto overflow-hidden rounded-3xl border border-border/80 bg-card shadow-2xl p-5 space-y-4">
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
                  </div>
                </div>
              </div>

              <div className="text-center pt-1">
                <span className="inline-block rounded-full bg-secondary px-3 py-0.5 text-[10px] font-bold text-primary">
                  Illustrative product preview (no real patient data)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Concise Value Proposition Cards */}
      <section className="py-12 border-b border-border/80 bg-card">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              title: 'OPD Queue & Token Stepper',
              desc: 'Live token stepper tracking patient queue progress from check-in to doctor room.',
              icon: IconClock,
            },
            {
              title: 'Structured EMR & Prescriptions',
              desc: 'Fast clinical workspace with 1-tap dosage chips (1-0-1 BD) and treatment kits.',
              icon: IconStethoscope,
            },
            {
              title: 'Dynamic UPI QR Billing',
              desc: 'Generates upi://pay payment QR codes on invoices and receipts in ₹ INR.',
              icon: IconReceipt,
            },
            {
              title: 'Isolated Multi-Clinic Privacy',
              desc: 'Clinic-level data separation with SHA-256 document checksums & audit logs.',
              icon: IconBuilding,
            },
          ].map((v) => {
            const Icon = v.icon
            return (
              <div key={v.title} className="card-flat p-5 flex flex-col justify-between space-y-2">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <Icon size={20} />
                </span>
                <h3 className="font-bold text-base text-ink mt-2">{v.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Short Final Call-to-Action Banner */}
      <section className="py-12 bg-canvas">
        <div className="mx-auto max-w-4xl px-6 text-center card-flat p-8 sm:p-10 space-y-4 border-primary/30 shadow-xs">
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Start Today</span>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Ready to streamline your clinic OPD?
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Register your clinic in minutes. Experience connected appointments, live tokens, EMR, prescriptions, and UPI billing.
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link href="/signup" className={btnPrimary}>
              Register Your Clinic
              <IconArrowRight size={15} />
            </Link>
            <Link href="/clinics" className={btnGhost}>
              Find a Doctor / Clinic
            </Link>
          </div>
        </div>
      </section>

      {/* Compact Footer */}
      <footer className="border-t border-border/80 bg-card py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 sm:px-8 lg:px-12 text-xs text-faint">
          <span className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">J</span>
            <span className="font-display text-base font-bold text-primary">JeevanCare</span>
          </span>
          <div className="flex gap-4 font-semibold text-muted-foreground">
            <Link href="/clinics" className="hover:text-primary">Clinics</Link>
            <Link href="/features" className="hover:text-primary">Features</Link>
            <Link href="/pricing" className="hover:text-primary">Pricing</Link>
            <Link href="/security" className="hover:text-primary">Security</Link>
            <Link href="/faq" className="hover:text-primary">FAQ</Link>
          </div>
          <span>JeevanCare · Your Trusted Healthcare Companion</span>
        </div>
      </footer>
    </main>
  )
}
