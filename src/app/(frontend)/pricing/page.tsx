import Link from 'next/link'
import { JeevanCareHeader } from '@/components/JeevanCareHeader'
import { btnPrimary, btnGhost } from '@/components/primitives'
import { IconCheck, IconX } from '@/components/icons'

export const metadata = {
  title: 'Simple, Transparent Pricing — JeevanCare',
  description: 'Explore verified subscription plans for JeevanCare. Free Starter, Clinic Plan, and Plus Plan with no lock-ins.',
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <div>
        <JeevanCareHeader />

        {/* Banner */}
        <section className="border-b border-border/80 bg-card py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 text-center">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Plans &amp; Pricing</span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">
              Transparent Pricing for Indian Clinics
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              No hidden fees, no lock-in contracts. Upgrade or change plans anytime from your owner dashboard.
            </p>
          </div>
        </section>

        {/* 3 Verified Plan Cards (Sourced from PLAN_LIMITS in src/lib/plans.ts) */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
              {/* Free Starter Plan */}
              <div className="card-flat p-6 text-center space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary uppercase">
                    Free Starter
                  </span>
                  <div className="mt-3 flex items-baseline justify-center gap-1">
                    <span className="tabular font-display text-4xl font-extrabold text-ink">₹0</span>
                    <span className="text-xs font-semibold text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Perfect for solo practitioners testing digital OPD.</p>

                  <ul className="space-y-2.5 text-xs font-medium text-ink text-start border-t border-border/80 pt-4">
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>1 Doctor Limit</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>50 Patient Records Cap</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Full OPD &amp; EMR Workspace</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Digital A5 Prescriptions</span></li>
                  </ul>
                </div>
                <Link href="/signup" className={`${btnGhost} w-full justify-center text-xs font-bold`}>
                  Start Free
                </Link>
              </div>

              {/* Clinic Plan */}
              <div className="card-flat p-6 text-center space-y-5 flex flex-col justify-between border-primary/40 ring-2 ring-primary/20 shadow-md relative">
                <span className="absolute -top-3 start-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold text-white uppercase">
                  Most Popular
                </span>
                <div className="space-y-4">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary uppercase">
                    Clinic Plan
                  </span>
                  <div className="mt-3 flex items-baseline justify-center gap-1">
                    <span className="tabular font-display text-4xl font-extrabold text-ink">₹2,999</span>
                    <span className="text-xs font-semibold text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Ideal for growing outpatient clinics and team practices.</p>

                  <ul className="space-y-2.5 text-xs font-medium text-ink text-start border-t border-border/80 pt-4">
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Up to 5 Doctors</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Unlimited Patient Records</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Billing &amp; Dynamic UPI QR Payments</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Medical Document Storage</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Staff Role Permissions (RBAC)</span></li>
                  </ul>
                </div>
                <Link href="/signup" className={`${btnPrimary} w-full justify-center text-xs font-bold`}>
                  Register Your Clinic
                </Link>
              </div>

              {/* Plus Plan */}
              <div className="card-flat p-6 text-center space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary uppercase">
                    Plus Plan
                  </span>
                  <div className="mt-3 flex items-baseline justify-center gap-1">
                    <span className="tabular font-display text-4xl font-extrabold text-ink">₹4,999</span>
                    <span className="text-xs font-semibold text-muted-foreground">/month</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Designed for multispecialty centers with unlimited doctors.</p>

                  <ul className="space-y-2.5 text-xs font-medium text-ink text-start border-t border-border/80 pt-4">
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Unlimited Doctors</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Unlimited Patient Records</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Full Billing &amp; Audit Trail</span></li>
                    <li className="flex items-center gap-2"><IconCheck size={14} className="text-primary shrink-0" /><span>Priority Phone &amp; WhatsApp Support</span></li>
                  </ul>
                </div>
                <Link href="/signup" className={`${btnGhost} w-full justify-center text-xs font-bold`}>
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="py-12 border-t border-border/80 bg-card">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="font-display text-xl font-bold text-ink text-center mb-8">Plan Comparison Matrix</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-border/80 bg-canvas">
                    <th className="p-3 font-bold text-ink text-start">Feature</th>
                    <th className="p-3 font-bold text-ink text-center">Free</th>
                    <th className="p-3 font-bold text-primary text-center">Clinic</th>
                    <th className="p-3 font-bold text-ink text-center">Plus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr><td className="p-3 font-semibold">Doctor Limit</td><td className="p-3 text-center">1 Doctor</td><td className="p-3 text-center font-bold text-primary">5 Doctors</td><td className="p-3 text-center">Unlimited</td></tr>
                  <tr><td className="p-3 font-semibold">Patient Records</td><td className="p-3 text-center">50 Max</td><td className="p-3 text-center font-bold text-primary">Unlimited</td><td className="p-3 text-center">Unlimited</td></tr>
                  <tr><td className="p-3 font-semibold">OPD Queue &amp; Token Stepper</td><td className="p-3 text-center">✓</td><td className="p-3 text-center">✓</td><td className="p-3 text-center">✓</td></tr>
                  <tr><td className="p-3 font-semibold">Dynamic UPI QR Billing</td><td className="p-3 text-center"><IconX className="mx-auto text-muted-foreground" size={14} /></td><td className="p-3 text-center font-bold text-primary">✓</td><td className="p-3 text-center">✓</td></tr>
                  <tr><td className="p-3 font-semibold">Medical Document Library</td><td className="p-3 text-center"><IconX className="mx-auto text-muted-foreground" size={14} /></td><td className="p-3 text-center font-bold text-primary">✓</td><td className="p-3 text-center">✓</td></tr>
                  <tr><td className="p-3 font-semibold">Immutable Audit Trail</td><td className="p-3 text-center"><IconX className="mx-auto text-muted-foreground" size={14} /></td><td className="p-3 text-center font-bold text-primary">✓</td><td className="p-3 text-center">✓</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 sm:px-8 lg:px-12 text-xs text-faint">
          <span className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">J</span>
            <span className="font-display text-base font-bold text-primary">JeevanCare</span>
          </span>
          <span>JeevanCare · Your Trusted Healthcare Companion</span>
        </div>
      </footer>
    </main>
  )
}
