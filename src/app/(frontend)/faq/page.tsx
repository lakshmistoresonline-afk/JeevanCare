import Link from 'next/link'
import { JeevanCareHeader } from '@/components/JeevanCareHeader'
import { btnPrimary } from '@/components/primitives'

export const metadata = {
  title: 'Frequently Asked Questions — JeevanCare',
  description: 'Verified answers about JeevanCare clinic registration, OPD tokens, doctor limits, CSV imports, patient portal, and pricing.',
}

const FAQS = [
  {
    q: 'How do I register my clinic?',
    a: 'Click "Register Your Clinic", enter your clinic name, city, and phone number. Your clinic account is created immediately with a 14-day trial period.',
  },
  {
    q: 'Is patient data secure and isolated?',
    a: 'Yes. Every clinic operates inside isolated database tenant boundaries. Staff members can only view data belonging to their own clinic, and patients can read only their personal medical records.',
  },
  {
    q: 'Can patients book appointments online?',
    a: 'Yes. Patients can search for your clinic on the public directory, view real-time available consultation slots in IST, and book appointments directly on web or mobile.',
  },
  {
    q: 'How do walk-in queue tokens work?',
    a: 'When a walk-in patient arrives at your clinic, the receptionist registers them and generates a daily token (e.g. T-01, T-02). Tokens update live on the receptionist queue and waiting room TV display.',
  },
  {
    q: 'Do you support multiple doctors and staff roles?',
    a: 'Yes. JeevanCare supports four distinct roles: Owners (full operational access), Doctors (clinical consultation & EMR), Receptionists (check-in & billing), and Patients (portal access).',
  },
  {
    q: 'Can I import existing patient lists and doctor schedules?',
    a: 'Yes. JeevanCare includes CSV bulk import capabilities for patient master records and doctor lists with row validation and audit logging.',
  },
  {
    q: 'Does JeevanCare work on mobile phones and tablets?',
    a: 'JeevanCare is built as a fully responsive Progressive Web App (PWA) with a dedicated mobile bottom navigation bar (`PatientBottomNav`) for patients and touch-optimized controls for clinic staff.',
  },
  {
    q: 'How does UPI QR billing work?',
    a: 'When an invoice is generated, JeevanCare formats an instant `upi://pay` payment string based on your clinic\'s configured UPI ID (e.g. `clinicname@upi`), generating a printable payment QR code.',
  },
]

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <div>
        <JeevanCareHeader />

        {/* Page Banner */}
        <section className="border-b border-border/80 bg-card py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 text-center">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Help &amp; Support</span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">
              Frequently Asked Questions
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Find clear, verified answers regarding clinic onboarding, features, OPD queue tokens, data security, and plans.
            </p>
          </div>
        </section>

        {/* Accordions Container */}
        <section className="py-12 sm:py-16">
          <div className="max-w-4xl mx-auto px-6 space-y-4">
            {FAQS.map((faq) => (
              <details key={faq.q} className="group rounded-2xl border border-border/80 bg-card p-5 text-xs sm:text-sm font-semibold shadow-2xs">
                <summary className="cursor-pointer flex items-center justify-between text-ink hover:text-primary">
                  <span className="text-sm font-bold">{faq.q}</span>
                  <span className="transition-transform group-open:rotate-180 text-muted-foreground">▼</span>
                </summary>
                <p className="mt-3 text-xs sm:text-sm text-muted-foreground font-normal leading-relaxed border-t border-border/60 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-12 border-t border-border/80 bg-card">
          <div className="mx-auto max-w-4xl px-6 text-center space-y-4">
            <h2 className="font-display text-2xl font-bold text-ink">Have additional questions?</h2>
            <div className="flex items-center justify-center gap-3">
              <Link href="/signup" className={btnPrimary}>Register Your Clinic</Link>
              <Link href="/clinics" className="text-xs font-bold text-primary hover:underline">Browse Clinics &rarr;</Link>
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
