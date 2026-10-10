import Link from 'next/link'
import { JeevanCareHeader } from '@/components/JeevanCareHeader'
import { btnPrimary, btnGhost } from '@/components/primitives'
import {
  IconCalendar,
  IconClock,
  IconStethoscope,
  IconStaff,
  IconUsers,
  IconReceipt,
  IconBuilding,
  IconCheck,
} from '@/components/icons'

export const metadata = {
  title: 'Complete Feature Catalogue — JeevanCare',
  description: 'Explore JeevanCare OPD queue, EMR, prescriptions, medical documents, UPI billing, and clinic administration tools.',
}

const FEATURE_GROUPS = [
  {
    category: 'Clinic Operations',
    desc: 'Streamline front-desk check-in, appointments, and OPD waiting queues.',
    features: [
      {
        title: 'Online & Walk-In Scheduling',
        desc: 'Book IST time slots with automatic double-booking conflict prevention.',
        icon: IconCalendar,
      },
      {
        title: 'Live OPD Queue & Token Stepper',
        desc: 'Real-time token stepper (T-01, T-02) tracking patient queue progress.',
        icon: IconClock,
      },
      {
        title: 'Doctor Schedule Management',
        desc: 'Configurable daily availability windows, specific weekdays, and on-call schedule tags.',
        icon: IconStethoscope,
      },
    ],
  },
  {
    category: 'Clinical Care & EMR',
    desc: 'Empower doctors with structured consultation forms and instant prescription tools.',
    features: [
      {
        title: 'Split-Pane EMR Workspace',
        desc: 'Simultaneous view of patient identity, MRN, allergy alerts, past visits, and active consultation.',
        icon: IconStethoscope,
      },
      {
        title: 'Quick Treatment Protocol Kits',
        desc: '1-tap prefilled prescription kits for common conditions (Fever, Gastritis, Hypertension).',
        icon: IconStaff,
      },
      {
        title: 'Quick Frequency Dosage Chips',
        desc: '1-click dosage buttons (1-0-1 BD, 1-1-1 TDS, 1-0-0 OD, SOS) for fast prescription entry.',
        icon: IconCheck,
      },
    ],
  },
  {
    category: 'Documents & Billing',
    desc: 'Integrated medical record storage, dynamic UPI QR billing, and financial summaries.',
    features: [
      {
        title: 'SHA-256 Medical Document Library',
        desc: 'Secure lab reports, scans, and PDFs with magic-byte validation and checksum verification.',
        icon: IconUsers,
      },
      {
        title: 'Dynamic UPI QR Payments',
        desc: 'Generates upi://pay payment QR codes directly on invoices in ₹ INR.',
        icon: IconReceipt,
      },
      {
        title: 'A5 Prescription & Receipt Printing',
        desc: 'NMC-compliant A5 prescription layout with clinic letterhead, doctor credentials, and e-Signature.',
        icon: IconReceipt,
      },
    ],
  },
  {
    category: 'Patient Experience',
    desc: 'Empower patients with self-service booking, digital records, and live queue status.',
    features: [
      {
        title: 'Patient Self-Service Portal',
        desc: 'Dedicated portal for patients to view upcoming appointments, prescription history, and bills.',
        icon: IconUsers,
      },
      {
        title: 'Live OPD Wait-Time Counter',
        desc: 'Real-time estimated wait time calculation based on live clinic queue position.',
        icon: IconClock,
      },
    ],
  },
  {
    category: 'Administration & Security',
    desc: 'Enterprise multi-tenant data boundaries, role permissions, and audit trails.',
    features: [
      {
        title: 'Multi-Clinic Tenant Isolation',
        desc: 'Strict database boundaries ensuring clinic data remains 100% private per tenant.',
        icon: IconBuilding,
      },
      {
        title: 'Role-Based Access Control (RBAC)',
        desc: 'Granular permissions for Owners, Doctors, Receptionists, and Patients.',
        icon: IconStaff,
      },
      {
        title: 'Immutable Audit Logging',
        desc: 'Tracks sensitive operations (exports, voids, user changes) for compliance.',
        icon: IconBuilding,
      },
    ],
  },
]

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <div>
        <JeevanCareHeader />

        {/* Page Banner */}
        <section className="border-b border-border/80 bg-card py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 text-center">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Capabilities</span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">
              Complete OPD, EMR, Prescription &amp; Billing Catalogue
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explore the full suite of clinical and administrative tools designed specifically for modern Indian outpatient healthcare.
            </p>
          </div>
        </section>

        {/* Categorized Feature Groups */}
        <section className="py-12 sm:py-16 space-y-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-16">
            {FEATURE_GROUPS.map((group) => (
              <div key={group.category} className="space-y-6">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">{group.category}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{group.desc}</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {group.features.map((f) => {
                    const Icon = f.icon
                    return (
                      <div key={f.title} className="card-flat p-6 flex flex-col justify-between space-y-3">
                        <div>
                          <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">
                            <Icon size={20} />
                          </span>
                          <h3 className="mt-4 font-bold text-base text-ink">{f.title}</h3>
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-12 border-t border-border/80 bg-card">
          <div className="mx-auto max-w-4xl px-6 text-center space-y-4">
            <h2 className="font-display text-2xl font-bold text-ink">Ready to try these features in your clinic?</h2>
            <div className="flex items-center justify-center gap-3">
              <Link href="/signup" className={btnPrimary}>Register Your Clinic</Link>
              <Link href="/login" className={btnGhost}>Clinic Login</Link>
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
