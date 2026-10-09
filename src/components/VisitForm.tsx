'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, btnGhost, inputClass, textareaClass, Card, Field, Avatar, AllergyBanner, Spinner } from './primitives'
import { AppSelect } from './AppSelect'
import { DatePicker } from './DatePicker'
import { VoiceDictationBar } from './VoiceDictationBar'
import { IconPlus, IconX, IconStethoscope, IconPrinter, IconCheck } from './icons'
import { PRESCRIPTION_FREQUENCIES } from '@/lib/constants'
import { recordVisit, type PrescriptionRowInput } from '@/app/(frontend)/dashboard/visits/actions'

const FREQ_OPTIONS = PRESCRIPTION_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))
const blankRow = (): PrescriptionRowInput => ({ medicine: '', dosage: '', frequency: '', durationDays: undefined, instructions: '' })

export function VisitForm({
  appointmentId,
  patientName,
  patientMrn,
  patientAllergies,
  doctorName,
  pastVisits = [],
}: {
  appointmentId: string
  patientName: string
  patientMrn?: string | null
  patientAllergies?: string | null
  doctorName: string
  pastVisits?: { id: string; date: string; diagnosis?: string | null; symptoms?: string | null }[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'consultation' | 'history' | 'documents' | 'billing'>('consultation')

  // Vitals
  const [bpS, setBpS] = useState('')
  const [bpD, setBpD] = useState('')
  const [temp, setTemp] = useState('')
  const [weight, setWeight] = useState('')
  const [pulse, setPulse] = useState('')

  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [rows, setRows] = useState<PrescriptionRowInput[]>([
    { medicine: 'Paracetamol 500 mg', dosage: '1 tablet', frequency: 'tds', durationDays: 5, instructions: 'After food' },
    { medicine: 'Pantoprazole 40 mg', dosage: '1 tablet', frequency: 'od', durationDays: 5, instructions: 'Before food' },
  ])
  const [kitConfirm, setKitConfirm] = useState<{ label: string; items: PrescriptionRowInput[] } | null>(null)

  const setRow = (i: number, patch: Partial<PrescriptionRowInput>) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)))
  const addRow = () => setRows((r) => [...r, blankRow()])
  const removeRow = (i: number) => setRows((r) => (r.length === 1 ? r : r.filter((_, idx) => idx !== i)))

  const hasDraftData = rows.some((r) => r.medicine.trim() || (r.dosage || '').trim() || (r.instructions || '').trim())

  const applyKit = (kit: { label: string; items: PrescriptionRowInput[] }) => {
    if (hasDraftData) {
      setKitConfirm(kit)
    } else {
      setRows(kit.items)
    }
  }
  const confirmReplace = () => {
    if (kitConfirm) setRows(kitConfirm.items)
    setKitConfirm(null)
  }
  const confirmAdd = () => {
    if (kitConfirm) setRows((r) => [...r, ...kitConfirm.items])
    setKitConfirm(null)
  }

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s))

  const submit = () => {
    setError(null)
    start(async () => {
      const res = await recordVisit({
        appointmentId,
        symptoms,
        diagnosis,
        notes,
        vitals: { bpSystolic: num(bpS), bpDiastolic: num(bpD), temperatureC: num(temp), weightKg: num(weight), pulse: num(pulse) },
        prescription: rows.filter((r) => r.medicine.trim()).map((r) => ({ ...r, durationDays: r.durationDays ? Number(r.durationDays) : undefined })),
        followUpDate: followUp || undefined,
      })
      if (res.ok) router.refresh()
      else setError(res.message)
    })
  }

  return (
    <div className="space-y-5">
      {/* Top Patient Header Bar (Matching Panel 10 in Reference Image) */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5 bg-card border-border/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Avatar name={patientName} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink">{patientName}</h2>
              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">
                ID: {patientMrn || 'PAT-00123'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              32 yrs | Male · Attending Physician: <span className="font-semibold text-ink">{doctorName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button type="button" onClick={submit} className={btnGhost} disabled={pending}>
            Save Draft
          </button>
          <button type="button" onClick={submit} className={btnPrimary} disabled={pending}>
            {pending ? <Spinner /> : <IconCheck size={16} />}
            {pending ? 'Saving…' : 'Complete Consultation'}
          </button>
        </div>
      </Card>

      {/* Workspace Navigation Tabs (Panel 10) */}
      <div className="flex border-b border-border/80 text-sm font-semibold">
        {[
          { id: 'consultation', label: 'Consultation & Rx' },
          { id: 'history', label: 'Medical History' },
          { id: 'documents', label: 'Documents & Lab Reports' },
          { id: 'billing', label: 'Invoices & Billing' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`border-b-2 px-5 py-2.5 transition-colors ${
              activeTab === tab.id
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Workspace View */}
      {activeTab === 'consultation' ? (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Left EMR Sub-Navigation & History Pane (Panel 10) */}
          <Card className="w-full shrink-0 overflow-hidden lg:w-72">
            <div className="border-b border-border/80 bg-secondary/30 p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Consultation Sections
              </div>
            </div>

            <nav className="p-2 space-y-1 text-xs font-semibold text-muted-foreground">
              {[
                { label: 'Chief Complaint', icon: '💬' },
                { label: 'Vitals & Measurements', icon: '📊' },
                { label: 'Examination Notes', icon: '🔍' },
                { label: 'Diagnosis', icon: '🩺' },
                { label: 'Prescription', icon: '💊' },
                { label: 'Advice & Instructions', icon: '📝' },
                { label: 'Follow Up', icon: '📅' },
              ].map((item, i) => (
                <div key={item.label} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 ${i === 4 ? 'bg-primary-soft text-primary font-bold' : 'hover:bg-secondary/40'}`}>
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-border/80 space-y-4">
              {patientAllergies && (
                <AllergyBanner allergies={patientAllergies} />
              )}

              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Past Visits ({pastVisits.length})
                </div>
                {pastVisits.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No prior visits recorded.</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {pastVisits.map((v) => (
                      <li key={v.id} className="rounded-xl border border-border bg-canvas p-2.5">
                        <div className="flex justify-between font-bold text-ink">
                          <span>{v.diagnosis || 'Consultation'}</span>
                          <span className="text-[10px] text-muted-foreground">{v.date}</span>
                        </div>
                        {v.symptoms && (
                          <p className="mt-1 text-[11px] text-muted-foreground truncate">{v.symptoms}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          {/* Right Active Clinical Form Pane (Matching Panel 10) */}
          <Card className="flex-1 min-w-0 overflow-hidden divide-y divide-border/80">
            {/* 1. Vitals Section */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-ink">1. Vitals &amp; Measurements</h3>
                <span className="text-[11px] text-muted-foreground">Recorded in IST</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Field label="BP Systolic"><input className={inputClass} inputMode="numeric" value={bpS} onChange={(e) => setBpS(e.target.value)} placeholder="120" /></Field>
                <Field label="BP Diastolic"><input className={inputClass} inputMode="numeric" value={bpD} onChange={(e) => setBpD(e.target.value)} placeholder="80" /></Field>
                <Field label="Temp (°C)"><input className={inputClass} inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="37.2" /></Field>
                <Field label="Weight (kg)"><input className={inputClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="68" /></Field>
                <Field label="Pulse (bpm)"><input className={inputClass} inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="76" /></Field>
              </div>
            </div>

            {/* 2. Assessment Section */}
            <div className="p-5 space-y-4">
              <h3 className="font-display text-sm font-bold text-ink">2. Assessment &amp; Diagnosis</h3>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">Symptoms / Chief Complaint</label>
                  <VoiceDictationBar
                    label="Dictate"
                    onTranscript={(text) => setSymptoms((prev) => (prev ? `${prev} ${text}` : text))}
                  />
                </div>
                <textarea className={textareaClass} rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Presenting symptoms (e.g. Fever, cough, fatigue for 3 days)…" />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">Diagnosis</label>
                  <VoiceDictationBar
                    label="Dictate"
                    onTranscript={(text) => setDiagnosis((prev) => (prev ? `${prev} ${text}` : text))}
                  />
                </div>
                <input className={inputClass} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Acute Upper Respiratory Infection" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Clinical Notes (Optional)</label>
                <textarea className={textareaClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Examination findings, lab orders, or special instructions…" />
              </div>
            </div>

            {/* 3. Prescription Section (Panel 10 Table & Treatment Kits) */}
            <div className="p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-ink">3. Prescription</h3>

                {/* Quick Treatment Protocol Kits */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-primary">⚡ Protocol Kits:</span>
                  {[
                    {
                      label: 'Fever & Cold',
                      items: [
                        { medicine: 'Paracetamol 500 mg', dosage: '1 tablet', frequency: 'tds', durationDays: 3, instructions: 'After food' },
                        { medicine: 'Cetirizine 10 mg', dosage: '1 tablet', frequency: 'od', durationDays: 5, instructions: 'At bedtime' },
                      ],
                    },
                    {
                      label: 'Gastritis',
                      items: [
                        { medicine: 'Pantoprazole 40 mg', dosage: '1 tablet', frequency: 'od', durationDays: 7, instructions: 'Before food, morning' },
                        { medicine: 'Domperidone 10 mg', dosage: '1 tablet', frequency: 'bd', durationDays: 5, instructions: 'Before meals' },
                      ],
                    },
                    {
                      label: 'Hypertension',
                      items: [
                        { medicine: 'Amlodipine 5 mg', dosage: '1 tablet', frequency: 'od', durationDays: 30, instructions: 'Morning' },
                      ],
                    },
                  ].map((kit) => (
                    <button
                      key={kit.label}
                      type="button"
                      onClick={() => applyKit(kit)}
                      className="rounded-full border border-primary/30 bg-secondary px-2.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      + {kit.label}
                    </button>
                  ))}
                </div>
              </div>

              {kitConfirm && (
                <div className="rounded-xl border border-amber/30 bg-amber-soft/40 p-3.5 text-xs">
                  <p className="font-semibold text-ink">
                    Replace existing draft with &quot;{kitConfirm.label}&quot; or add to current list?
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={confirmAdd} className="rounded-lg border border-border bg-card px-3 py-1 font-semibold hover:bg-secondary">
                      Add to List
                    </button>
                    <button type="button" onClick={confirmReplace} className="rounded-lg bg-primary px-3 py-1 font-semibold text-white hover:bg-primary/90">
                      Replace Draft
                    </button>
                    <button type="button" onClick={() => setKitConfirm(null)} className="px-2 py-1 text-muted-foreground hover:text-ink">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Prescription Rows List */}
              <div className="space-y-3">
                {rows.map((row, i) => (
                  <div key={i} className="rounded-2xl border border-border/80 bg-canvas/60 p-3.5 space-y-2">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.5fr_0.8fr_1fr]">
                      <input className={inputClass} placeholder="Suggested Medicines (e.g. Paracetamol 500 mg)" value={row.medicine} onChange={(e) => setRow(i, { medicine: e.target.value })} />
                      <input className={inputClass} placeholder="Dosage (1 tablet)" value={row.dosage} onChange={(e) => setRow(i, { dosage: e.target.value })} />
                      <AppSelect value={row.frequency ?? ''} onChange={(v) => setRow(i, { frequency: v })} placeholder="Frequency" options={FREQ_OPTIONS} />
                    </div>

                    {/* Quick Frequency Dosage Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="text-muted-foreground font-semibold">Quick Freq:</span>
                      {[
                        { label: '1-0-1 (BD)', val: 'bd' },
                        { label: '1-1-1 (TDS)', val: 'tds' },
                        { label: '1-0-0 (OD)', val: 'od' },
                        { label: 'SOS', val: 'sos' },
                      ].map((chip) => (
                        <button
                          key={chip.val}
                          type="button"
                          onClick={() => setRow(i, { frequency: chip.val })}
                          className={`rounded px-2 py-0.5 font-semibold transition-colors ${
                            row.frequency === chip.val
                              ? 'bg-primary text-white'
                              : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-primary'
                          }`}
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-[0.8fr_1.6fr_auto]">
                      <input className={inputClass} inputMode="numeric" placeholder="Duration (Days)" value={row.durationDays ?? ''} onChange={(e) => setRow(i, { durationDays: e.target.value === '' ? undefined : Number(e.target.value) })} />
                      <input className={inputClass} placeholder="Food Timing / Instructions (Take after food)" value={row.instructions} onChange={(e) => setRow(i, { instructions: e.target.value })} />
                      <button type="button" onClick={() => removeRow(i)} className="flex h-10 size-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-red hover:text-red transition-colors" disabled={rows.length === 1} title="Remove">
                        <IconX size={15} />
                      </button>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addRow} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                  <IconPlus size={14} /> Add Medicine Row
                </button>
              </div>
            </div>

            {/* 4. Follow Up Section */}
            <div className="p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="w-64">
                <Field label="Follow Up Date (Optional)"><DatePicker value={followUp} onChange={setFollowUp} /></Field>
              </div>

              <div className="flex items-center gap-3">
                {error && <p className="text-xs font-semibold text-red">{error}</p>}
                <button type="button" className={btnPrimary} disabled={pending} onClick={submit}>
                  {pending && <Spinner />}
                  {pending ? 'Saving Consultation…' : 'Complete Consultation'}
                </button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          View patient {activeTab} in dedicated section.
        </Card>
      )}
    </div>
  )
}
