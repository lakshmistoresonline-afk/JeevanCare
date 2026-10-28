import { notFound } from 'next/navigation'
import { requirePatientSession, getPayloadClient } from '@/lib/auth'
import { getPatientTimeline } from '@/lib/timeline'
import { PrintButton } from '@/components/PrintButton'
import { formatDateTime, formatMoney, ageFromDOB } from '@/lib/format'

export default async function PatientHealthSummaryPrintPage() {
  const { patient, tenant } = await requirePatientSession()
  const payload = await getPayloadClient()

  const timeline = await getPatientTimeline(payload, String(tenant.id), String(patient.id), 100)
  const age = patient?.ageYears ?? (patient?.dateOfBirth ? ageFromDOB(patient.dateOfBirth) : null)

  return (
    <main className="mx-auto w-full max-w-[210mm] bg-white p-10 text-[13px] text-ink print:max-w-none print:p-[15mm]">
      <style>{`@page { size: A4; margin: 0; } @media print { html, body { background: #fff; } }`}</style>

      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* Header */}
      <header className="border-b border-border pb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary">JeevanCare Patient Health Summary</h1>
          <p className="mt-1 text-xs text-muted-foreground">{tenant?.name} · {tenant?.city}</p>
        </div>
        <div className="text-end text-xs text-muted-foreground">
          <div>Generated on: {new Date().toLocaleDateString('en-IN')}</div>
        </div>
      </header>

      {/* Patient Info */}
      <section className="mt-6 grid grid-cols-2 gap-4 rounded-xl border border-border/80 bg-secondary/20 p-4 text-xs">
        <div>
          <span className="text-muted-foreground block font-semibold">Patient Name</span>
          <span className="font-bold text-ink text-sm">{patient?.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground block font-semibold">MRN / ID</span>
          <span className="tabular font-bold text-ink">{patient?.mrn || 'N/A'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block font-semibold">Age &amp; Gender</span>
          <span>{age != null ? `${age} yrs` : 'Age unknown'} · {patient?.gender || 'Not recorded'}</span>
        </div>
        <div>
          <span className="text-muted-foreground block font-semibold">Phone Number</span>
          <span className="tabular">{patient?.phone || 'Not recorded'}</span>
        </div>
      </section>

      {/* Timeline Summary */}
      <section className="mt-8 space-y-4">
        <h2 className="font-display text-base font-bold text-ink border-b border-border pb-2">Chronological Medical Timeline</h2>
        {timeline.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4">No medical history records found.</p>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-left">
                <th className="p-2.5 font-bold text-ink">Date &amp; Time</th>
                <th className="p-2.5 font-bold text-ink">Category</th>
                <th className="p-2.5 font-bold text-ink">Details / Diagnosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/80">
              {timeline.map((e) => (
                <tr key={`${e.kind}-${e.id}`}>
                  <td className="tabular p-2.5 text-muted-foreground">{formatDateTime(e.at, tenant)}</td>
                  <td className="p-2.5 uppercase font-bold text-primary text-[10px]">{e.kind}</td>
                  <td className="p-2.5 font-medium text-ink">
                    {e.kind === 'visit' && (e.diagnosis || 'Consultation') + (e.doctorName ? ` · ${e.doctorName}` : '')}
                    {e.kind === 'invoice' && `Invoice ${e.invoiceNumber} (${formatMoney(e.amount, { settings: { currency: e.currency } })}) — ${e.status}`}
                    {e.kind === 'appointment' && `Appointment with ${e.doctorName || 'Doctor'} (${e.status})`}
                    {e.kind === 'document' && `${e.documentType}: ${e.title}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="mt-16 border-t border-border pt-4 text-center text-xs text-faint">
        Official Medical Summary · JeevanCare Health Platform · Confidential Patient Record
      </footer>
    </main>
  )
}
