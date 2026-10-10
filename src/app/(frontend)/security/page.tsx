import Link from 'next/link'
import { JeevanCareHeader } from '@/components/JeevanCareHeader'
import { btnPrimary } from '@/components/primitives'
import { IconBuilding, IconStaff, IconUsers, IconCheck } from '@/components/icons'

export const metadata = {
  title: 'Data Security & Patient Privacy — JeevanCare',
  description: 'Verified security capabilities of JeevanCare: clinic-level tenant isolation, role-based access, SHA-256 document checksums, and audit trails.',
}

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <div>
        <JeevanCareHeader />

        {/* Page Banner */}
        <section className="border-b border-border/80 bg-card py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 text-center">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Enterprise Security</span>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-ink">
              Data Security &amp; Patient Privacy Architecture
            </h1>
            <p className="mt-3 text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              JeevanCare is engineered with strict database tenant isolation, role-based permissions, SHA-256 file verification, and audit trails to protect clinical data.
            </p>
          </div>
        </section>

        {/* Security Capabilities Grid */}
        <section className="py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 space-y-12">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Capability 1 */}
              <div className="card-flat p-6 space-y-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary font-bold text-sm">
                  <IconBuilding size={20} />
                </span>
                <h3 className="font-bold text-base text-ink">Clinic-Level Tenant Isolation</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Every clinic operates inside a strict database tenant boundary (`tenant` relationship ID). Database queries automatically scope queries so patient records, appointments, and bills never cross clinic boundaries.
                </p>
              </div>

              {/* Capability 2 */}
              <div className="card-flat p-6 space-y-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary font-bold text-sm">
                  <IconStaff size={20} />
                </span>
                <h3 className="font-bold text-base text-ink">Role-Based Access Control (RBAC)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Granular permissions enforce role boundaries: Owners manage staff and finances; Doctors manage clinical visits; Receptionists handle check-ins; Patients read ONLY their personal records.
                </p>
              </div>

              {/* Capability 3 */}
              <div className="card-flat p-6 space-y-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary font-bold text-sm">
                  <IconUsers size={20} />
                </span>
                <h3 className="font-bold text-base text-ink">SHA-256 Document Integrity</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Uploaded medical documents undergo magic-byte file format verification (PDF, PNG, JPEG) and SHA-256 checksum hashing to detect file tampering or corruption.
                </p>
              </div>

              {/* Capability 4 */}
              <div className="card-flat p-6 space-y-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary font-bold text-sm">
                  🛡️
                </span>
                <h3 className="font-bold text-base text-ink">Immutable Audit Trail</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Sensitive administrative actions (CSV data exports, invoice voiding, user deactivations) generate immutable entries in the `auditLogs` collection for compliance.
                </p>
              </div>

              {/* Capability 5 */}
              <div className="card-flat p-6 space-y-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary font-bold text-sm">
                  🔒
                </span>
                <h3 className="font-bold text-base text-ink">Immutable Financial Records</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Recorded invoice payments and currency snapshots are locked against modification to preserve billing ledger integrity.
                </p>
              </div>

              {/* Capability 6 */}
              <div className="card-flat p-6 space-y-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary font-bold text-sm">
                  🇮🇳
                </span>
                <h3 className="font-bold text-base text-ink">Indian Standards Compliance</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Built natively for Indian healthcare: +91 mobile verification, IST Asia/Kolkata slot calculation, and NMC-compliant A5 prescription formats.
                </p>
              </div>
            </div>

            {/* Storage Architecture Note */}
            <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-3">
              <h3 className="font-display text-base font-bold text-ink">Medical Document Storage Architecture</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Medical document files (PDFs, scans, images) uploaded through JeevanCare are validated server-side and stored on the application server&apos;s host storage directory. When hosted locally on a doctor&apos;s workstation PC, files reside directly on that local drive.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-12 border-t border-border/80 bg-card">
          <div className="mx-auto max-w-4xl px-6 text-center space-y-4">
            <h2 className="font-display text-2xl font-bold text-ink">Questions about clinic security setup?</h2>
            <Link href="/signup" className={btnPrimary}>Register Your Clinic</Link>
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
