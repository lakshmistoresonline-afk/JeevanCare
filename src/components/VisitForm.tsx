'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, inputClass, textareaClass, Card, Field, Avatar, AllergyBanner, Spinner } from './primitives'
import { AppSelect } from './AppSelect'
import { DatePicker } from './DatePicker'
import { VoiceDictationBar } from './VoiceDictationBar'
import { IconPlus, IconX, IconStethoscope } from './icons'
import { PRESCRIPTION_FREQUENCIES } from '@/lib/constants'
import { recordVisit, type PrescriptionRowInput } from '@/app/(frontend)/dashboard/visits/actions'

const FREQ_OPTIONS = PRESCRIPTION_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))
const blankRow = (): PrescriptionRowInput => ({ medicine: '', dosage: '', frequency: '', durationDays: undefined, instructions: '' })

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="border-b border-border px-6 py-5 last:border-0">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="flex size-5 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">{n}</span>
        <h2 className="text-[13px] font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

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

  // Vitals (kept as strings so empty stays empty, parsed on submit)
  const [bpS, setBpS] = useState('')
  const [bpD, setBpD] = useState('')
  const [temp, setTemp] = useState('')
  const [weight, setWeight] = useState('')
  const [pulse, setPulse] = useState('')

  const [symptoms, setSymptoms] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [followUp, setFollowUp] = useState('')
  const [rows, setRows] = useState<PrescriptionRowInput[]>([blankRow()])
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
      // The server route re-renders into the "Visit recorded → next steps" panel.
      if (res.ok) router.refresh()
      else setError(res.message)
    })
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* LEFT PANE: Patient EMR History & Summary (300px) */}
      <Card className="w-full shrink-0 overflow-hidden lg:w-80">
        <div className="flex items-center gap-3 border-b border-border bg-secondary/30 p-4">
          <Avatar name={patientName} size="md" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{patientName}</div>
            <div className="text-xs text-muted-foreground">MRN: {patientMrn || 'N/A'}</div>
          </div>
        </div>

        <div className="p-4 flex flex-col gap-4">
          {patientAllergies && (
            <div>
              <AllergyBanner allergies={patientAllergies} />
            </div>
          )}

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Attending Physician
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-ink">
              <IconStethoscope size={14} className="text-primary" />
              {doctorName}
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Past Consultation History
            </div>
            {pastVisits.length === 0 ? (
              <p className="text-xs text-muted-foreground">No prior visits recorded for this patient.</p>
            ) : (
              <ul className="space-y-2 text-xs">
                {pastVisits.map((v) => (
                  <li key={v.id} className="rounded-lg border border-border bg-canvas/60 p-2.5">
                    <div className="flex justify-between font-medium text-ink">
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

      {/* RIGHT PANE: Active Consultation Form */}
      <Card className="flex-1 min-w-0 overflow-hidden">
        <Section n={1} title="Vitals">
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
            <Field label="BP systolic"><input className={inputClass} inputMode="numeric" value={bpS} onChange={(e) => setBpS(e.target.value)} placeholder="120" /></Field>
            <Field label="BP diastolic"><input className={inputClass} inputMode="numeric" value={bpD} onChange={(e) => setBpD(e.target.value)} placeholder="80" /></Field>
            <Field label="Temp (°C)"><input className={inputClass} inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="37" /></Field>
            <Field label="Weight (kg)"><input className={inputClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70" /></Field>
            <Field label="Pulse (bpm)"><input className={inputClass} inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="72" /></Field>
          </div>
        </Section>

      <Section n={2} title="Assessment">
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-medium text-ink">Symptoms</label>
              <VoiceDictationBar
                label="Voice Symptoms"
                onTranscript={(text) => setSymptoms((prev) => (prev ? `${prev} ${text}` : text))}
              />
            </div>
            <textarea className={textareaClass} rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Presenting complaints…" />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-medium text-ink">Diagnosis</label>
              <VoiceDictationBar
                label="Voice Diagnosis"
                onTranscript={(text) => setDiagnosis((prev) => (prev ? `${prev} ${text}` : text))}
              />
            </div>
            <input className={inputClass} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g. Viral fever" />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-[13px] font-medium text-ink">Notes (optional)</label>
              <VoiceDictationBar
                label="Voice Notes"
                onTranscript={(text) => setNotes((prev) => (prev ? `${prev} ${text}` : text))}
              />
            </div>
            <textarea className={textareaClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
      </Section>

      <Section n={3} title="Prescription">
        {/* Treatment Protocol Kits */}
        <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-primary/20 bg-secondary/20 p-3">
          <span className="text-xs font-semibold text-primary">⚡ Quick Treatment Kit:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              {
                label: 'Fever & Cold Kit',
                items: [
                  { medicine: 'Paracetamol', dosage: '500mg', frequency: 'tds', durationDays: 3, instructions: 'After food' },
                  { medicine: 'Cetirizine', dosage: '10mg', frequency: 'od', durationDays: 5, instructions: 'At bedtime' },
                  { medicine: 'Vitamin C', dosage: '500mg', frequency: 'od', durationDays: 5, instructions: 'After food' },
                ],
              },
              {
                label: 'Gastritis Protocol',
                items: [
                  { medicine: 'Pantoprazole', dosage: '40mg', frequency: 'od', durationDays: 7, instructions: 'Before food, morning' },
                  { medicine: 'Domperidone', dosage: '10mg', frequency: 'bd', durationDays: 5, instructions: '30 mins before meals' },
                ],
              },
              {
                label: 'Hypertension Kit',
                items: [
                  { medicine: 'Amlodipine', dosage: '5mg', frequency: 'od', durationDays: 30, instructions: 'After breakfast' },
                  { medicine: 'Telmisartan', dosage: '40mg', frequency: 'od', durationDays: 30, instructions: 'Morning' },
                ],
              },
            ].map((kit) => (
              <button
                key={kit.label}
                type="button"
                onClick={() => applyKit(kit)}
                className="rounded-full border border-primary/30 bg-canvas px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary hover:text-white"
              >
                + {kit.label}
              </button>
            ))}
          </div>
        </div>

        {kitConfirm && (
          <div className="mb-3 rounded-lg border border-amber/30 bg-amber/5 p-3" role="alertdialog" aria-label="Confirm treatment kit">
            <p className="text-sm font-medium text-ink">
              You have an active prescription draft. Applying &quot;{kitConfirm.label}&quot; will replace it.
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={confirmAdd} className="rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-secondary">
                Add to current
              </button>
              <button type="button" onClick={confirmReplace} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary/90">
                Replace current prescription
              </button>
              <button type="button" onClick={() => setKitConfirm(null)} className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-ink">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          {rows.map((row, i) => (
            <div key={i} className="rounded-lg border border-border bg-canvas/40 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1.4fr_0.8fr_1fr]">
                <input className={inputClass} placeholder="Medicine (e.g. Paracetamol)" value={row.medicine} onChange={(e) => setRow(i, { medicine: e.target.value })} />
                <input className={inputClass} placeholder="Dosage (500mg)" value={row.dosage} onChange={(e) => setRow(i, { dosage: e.target.value })} />
                <AppSelect value={row.frequency ?? ''} onChange={(v) => setRow(i, { frequency: v })} placeholder="Frequency" options={FREQ_OPTIONS} />
              </div>

              {/* Quick Dosage Shortcut Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-muted-foreground font-medium">Quick Frequency:</span>
                {[
                  { label: '1-0-1 (BD)', val: 'bd' },
                  { label: '1-1-1 (TDS)', val: 'tds' },
                  { label: '1-0-0 (OD)', val: 'od' },
                  { label: 'SOS (As needed)', val: 'sos' },
                ].map((chip) => (
                  <button
                    key={chip.val}
                    type="button"
                    onClick={() => setRow(i, { frequency: chip.val })}
                    className={`rounded px-2 py-0.5 font-medium transition-colors ${
                      row.frequency === chip.val
                        ? 'bg-primary text-white'
                        : 'bg-muted text-muted-foreground hover:bg-secondary hover:text-primary'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[0.8fr_1.6fr_auto]">
                <input className={inputClass} inputMode="numeric" placeholder="Days" value={row.durationDays ?? ''} onChange={(e) => setRow(i, { durationDays: e.target.value === '' ? undefined : Number(e.target.value) })} />
                <input className={inputClass} placeholder="Instructions (e.g. After meals)" value={row.instructions} onChange={(e) => setRow(i, { instructions: e.target.value })} />
                <button type="button" onClick={() => removeRow(i)} className="flex h-10 items-center justify-center rounded-md border border-border px-3 text-muted-foreground transition-colors hover:border-red/40 hover:text-red disabled:opacity-40" disabled={rows.length === 1} title="Remove">
                  <IconX size={15} />
                </button>
              </div>
              {row.frequency === 'other' && (
                <input className={`${inputClass} mt-2`} placeholder="Describe frequency" value={row.frequencyNote ?? ''} onChange={(e) => setRow(i, { frequencyNote: e.target.value })} />
              )}
            </div>
          ))}
          <button type="button" onClick={addRow} className="flex w-fit items-center gap-1.5 text-[13px] font-medium text-primary hover:underline">
            <IconPlus size={14} /> Add medicine
          </button>
        </div>
      </Section>

      <Section n={4} title="Follow-up">
        <div className="max-w-xs">
          <Field label="Follow-up date (optional)"><DatePicker value={followUp} onChange={setFollowUp} /></Field>
        </div>
      </Section>

      <div className="flex items-center justify-between gap-3 bg-canvas/60 px-6 py-4">
        {error ? <p className="text-sm text-red" role="alert">{error}</p> : <span />}
        <button type="button" className={btnPrimary} disabled={pending} onClick={submit}>
          {pending && <Spinner />}
          {pending ? 'Saving…' : 'Save visit'}
        </button>
      </div>
      </Card>
    </div>
  )
}
