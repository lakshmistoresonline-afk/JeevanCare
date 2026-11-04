'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, btnGhost, inputClass, textareaClass, Card, Field, Avatar, AllergyBanner, Spinner } from './primitives'
import { AppSelect } from './AppSelect'
import { DatePicker } from './DatePicker'
import { VoiceDictationBar } from './VoiceDictationBar'
import { IconPlus, IconX, IconCheck, IconArrowRight, IconChevronLeft } from './icons'
import { PRESCRIPTION_FREQUENCIES } from '@/lib/constants'
import { recordVisit, type PrescriptionRowInput } from '@/app/(frontend)/dashboard/visits/actions'
import { MedicineDirectorySearch } from './MedicineDirectorySearch'

const FREQ_OPTIONS = PRESCRIPTION_FREQUENCIES.map((f) => ({ value: f.value, label: f.label }))
const blankRow = (): PrescriptionRowInput => ({ medicine: '', dosage: '', frequency: '', durationDays: undefined, instructions: '' })

export function VisitForm({
  appointmentId,
  patientName,
  patientMrn,
  patientAge,
  patientGender,
  patientAllergies,
  doctorName,
  pastVisits = [],
}: {
  appointmentId: string
  patientName: string
  patientMrn?: string | null
  patientAge?: string | null
  patientGender?: string | null
  patientAllergies?: string | null
  doctorName: string
  pastVisits?: {
    id: string
    date: string
    diagnosis?: string | null
    symptoms?: string | null
    notes?: string | null
    prescription?: any[]
    vitals?: Record<string, any>
  }[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Distraction-free Focus Mode toggle
  const [focusMode, setFocusMode] = useState(false)

  // 5-Step EMR Tab Navigation
  const [activeStep, setActiveStep] = useState<'vitals' | 'diagnosis' | 'prescriptions' | 'history' | 'billing'>('vitals')

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
  const [consultationFee, setConsultationFee] = useState('500')
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
      if (res.ok) router.refresh()
      else setError(res.message)
    })
  }

  return (
    <div className={focusMode ? 'fixed inset-0 z-50 bg-background overflow-y-auto p-6 md:p-10 space-y-6 shadow-2xl' : 'space-y-5'}>
      {/* Top Patient Header Bar */}
      <Card className="flex flex-wrap items-center justify-between gap-4 p-5 bg-card border-border/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <Avatar name={patientName} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-ink">{patientName}</h2>
              <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary">
                ID: {patientMrn || 'N/A'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {patientAge || 'Age unknown'} | {patientGender || 'Not recorded'} · Attending Physician: <span className="font-semibold text-ink">{doctorName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              focusMode
                ? 'border-primary bg-primary text-white'
                : 'border-border bg-card text-ink hover:border-primary/50'
            }`}
            title="Toggle Distraction-Free Focus Mode"
          >
            {focusMode ? '⚡ Focus Mode: ON' : '⚡ Focus Mode'}
          </button>
          <button type="button" onClick={submit} className={btnGhost} disabled={pending}>
            Save Draft
          </button>
          <button type="button" onClick={submit} className={btnPrimary} disabled={pending}>
            {pending ? <Spinner /> : <IconCheck size={16} />}
            {pending ? 'Saving…' : 'Complete Consultation'}
          </button>
        </div>
      </Card>

      {/* 45-Second Rapid Prescription Tabbed Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {[
          { id: 'vitals', title: '1. Vitals & Symptoms', icon: '📊', desc: 'BP, Pulse, Chief Complaint' },
          { id: 'diagnosis', title: '2. Diagnosis', icon: '🩺', desc: 'Assessment & Notes' },
          { id: 'prescriptions', title: '3. Prescriptions', icon: '💊', desc: 'Protocol Kits & Meds' },
          { id: 'history', title: '4. Prior Medical History', icon: '📜', desc: `${pastVisits.length} Past Visits & Rx` },
          { id: 'billing', title: '5. Billing & Follow-up', icon: '💳', desc: 'Invoice & Completion' },
        ].map((tab, idx) => {
          const isActive = activeStep === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveStep(tab.id as any)}
              className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                isActive
                  ? 'border-primary bg-primary-soft/50 ring-2 ring-primary/20 shadow-sm'
                  : 'border-border/80 bg-card hover:border-primary/40'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-sm font-bold text-ink flex items-center gap-2">
                  <span>{tab.icon}</span> {tab.title}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'}`}>
                  Step {idx + 1}
                </span>
              </div>
              <span className="text-xs text-muted-foreground mt-1 truncate">{tab.desc}</span>
            </button>
          )
        })}
      </div>

      {patientAllergies && (
        <AllergyBanner allergies={patientAllergies} />
      )}

      {/* Active Step Workspace */}
      <Card className="p-6">
        {activeStep === 'vitals' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-ink">Step 1: Vitals &amp; Symptoms</h3>
                <p className="text-xs text-muted-foreground">Record patient vitals and presenting chief complaints in IST</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep('diagnosis')}
                className={btnPrimary}
              >
                Next: Diagnosis <IconArrowRight size={14} />
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Patient Vitals</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Field label="BP Systolic"><input className={inputClass} inputMode="numeric" value={bpS} onChange={(e) => setBpS(e.target.value)} placeholder="120" /></Field>
                <Field label="BP Diastolic"><input className={inputClass} inputMode="numeric" value={bpD} onChange={(e) => setBpD(e.target.value)} placeholder="80" /></Field>
                <Field label="Temp (°C)"><input className={inputClass} inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="37.2" /></Field>
                <Field label="Weight (kg)"><input className={inputClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="68" /></Field>
                <Field label="Pulse (bpm)"><input className={inputClass} inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="76" /></Field>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border/80">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Chief Complaint &amp; Symptoms</h4>
                <VoiceDictationBar
                  label="Voice Dictate"
                  onTranscript={(text) => setSymptoms((prev) => (prev ? `${prev} ${text}` : text))}
                />
              </div>
              <textarea
                className={textareaClass}
                rows={4}
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Presenting symptoms, duration, and history of present illness…"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-border/80">
              <button
                type="button"
                onClick={() => setActiveStep('diagnosis')}
                className={btnPrimary}
              >
                Next: Diagnosis <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeStep === 'diagnosis' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-ink">Step 2: Diagnosis &amp; Clinical Notes</h3>
                <p className="text-xs text-muted-foreground">Enter primary diagnosis and clinical examination notes</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setActiveStep('vitals')} className={btnGhost}>
                  <IconChevronLeft size={14} /> Back
                </button>
                <button type="button" onClick={() => setActiveStep('prescriptions')} className={btnPrimary}>
                  Next: Prescriptions <IconArrowRight size={14} />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">Primary Diagnosis</label>
                  <VoiceDictationBar
                    label="Dictate"
                    onTranscript={(text) => setDiagnosis((prev) => (prev ? `${prev} ${text}` : text))}
                  />
                </div>
                <input
                  className={inputClass}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Upper Respiratory Infection / Type 2 Diabetes Mellitus"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold text-ink">Clinical Notes &amp; Observations</label>
                  <VoiceDictationBar
                    label="Dictate"
                    onTranscript={(text) => setNotes((prev) => (prev ? `${prev} ${text}` : text))}
                  />
                </div>
                <textarea
                  className={textareaClass}
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Physical examination findings, test orders, or special recommendations…"
                />
              </div>
            </div>

            {pastVisits.length > 0 && (
              <div className="rounded-2xl border border-border bg-canvas p-4 space-y-2">
                <div className="text-xs font-bold text-primary uppercase">Past Visit Summary ({pastVisits.length})</div>
                <div className="space-y-2 text-xs">
                  {pastVisits.slice(0, 2).map((v) => (
                    <div key={v.id} className="flex justify-between border-b border-border/50 pb-1 last:border-none">
                      <span className="font-semibold text-ink">{v.diagnosis || 'Visit'} ({v.date})</span>
                      <span className="text-muted-foreground truncate max-w-xs">{v.symptoms}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border/80">
              <button type="button" onClick={() => setActiveStep('vitals')} className={btnGhost}>
                <IconChevronLeft size={14} /> Back
              </button>
              <button type="button" onClick={() => setActiveStep('prescriptions')} className={btnPrimary}>
                Next: Prescriptions <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeStep === 'prescriptions' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-ink">Step 3: Prescriptions (45-Sec Express Writer)</h3>
                <p className="text-xs text-muted-foreground">Select protocol kits or search national medicine directory for instant prescription writing</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setActiveStep('diagnosis')} className={btnGhost}>
                  <IconChevronLeft size={14} /> Back
                </button>
                <button type="button" onClick={() => setActiveStep('billing')} className={btnPrimary}>
                  Next: Billing <IconArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Quick Treatment Protocol Kits */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-primary">⚡ 1-Click Protocol Kits:</span>
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
                  className="rounded-full border border-primary/30 bg-secondary px-3 py-1 text-xs font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  + {kit.label}
                </button>
              ))}
            </div>

            {/* Medicine Directory Search */}
            <MedicineDirectorySearch
              onSelectMedicine={(item) => setRows((r) => [...r, item])}
            />

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

            {/* Prescription Rows */}
            <div className="space-y-3">
              {rows.map((row, i) => (
                <div key={i} className="rounded-2xl border border-border/80 bg-canvas/60 p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1.5fr_0.8fr_1fr]">
                    <input className={inputClass} placeholder="Medicine Name (e.g. Paracetamol 500 mg)" value={row.medicine} onChange={(e) => setRow(i, { medicine: e.target.value })} />
                    <input className={inputClass} placeholder="Dosage (e.g. 1 tablet)" value={row.dosage} onChange={(e) => setRow(i, { dosage: e.target.value })} />
                    <AppSelect value={row.frequency ?? ''} onChange={(v) => setRow(i, { frequency: v })} placeholder="Frequency" options={FREQ_OPTIONS} />
                  </div>

                  {/* Interactive 1-Click Dosage Preset Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-muted-foreground font-semibold">⚡ 1-Click Dosage Presets:</span>
                    {[
                      { label: '1-0-1 BD', dosage: '1 tablet', freq: 'bd' },
                      { label: '1-0-0 OD', dosage: '1 tablet', freq: 'od' },
                      { label: '1-1-1 TDS', dosage: '1 tablet', freq: 'tds' },
                      { label: 'SOS', dosage: '1 tablet', freq: 'sos' },
                      { label: '1 Tab', dosage: '1 tablet', freq: '' },
                      { label: '2 Tabs', dosage: '2 tablets', freq: '' },
                      { label: '5 ml', dosage: '5 ml', freq: '' },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => setRow(i, { dosage: chip.dosage, ...(chip.freq ? { frequency: chip.freq } : {}) })}
                        className={`rounded-md px-2.5 py-1 font-bold transition-colors ${
                          row.dosage === chip.dosage && (!chip.freq || row.frequency === chip.freq)
                            ? 'bg-primary text-white shadow-xs'
                            : 'bg-secondary text-primary hover:bg-primary/20'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[0.8fr_1.6fr_auto]">
                    <input className={inputClass} inputMode="numeric" placeholder="Duration (Days)" value={row.durationDays ?? ''} onChange={(e) => setRow(i, { durationDays: e.target.value === '' ? undefined : Number(e.target.value) })} />
                    <input className={inputClass} placeholder="Instructions (e.g. Take after food)" value={row.instructions} onChange={(e) => setRow(i, { instructions: e.target.value })} />
                    <button type="button" onClick={() => removeRow(i)} className="flex h-10 size-10 items-center justify-center rounded-xl border border-border text-muted-foreground hover:border-red hover:text-red transition-colors" disabled={rows.length === 1} title="Remove">
                      <IconX size={15} />
                    </button>
                  </div>
                </div>
              ))}

              <button type="button" onClick={addRow} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                <IconPlus size={14} /> Add Another Medicine Row
              </button>
            </div>

            <div className="flex justify-between pt-4 border-t border-border/80">
              <button type="button" onClick={() => setActiveStep('diagnosis')} className={btnGhost}>
                <IconChevronLeft size={14} /> Back
              </button>
              <button type="button" onClick={() => setActiveStep('history')} className={btnPrimary}>
                Next: Prior History <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeStep === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-ink">Prior Medical History &amp; Consultations ({pastVisits.length})</h3>
                <p className="text-xs text-muted-foreground">Previous consultation records, diagnoses, and prescriptions for {patientName}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep('billing')}
                className={btnPrimary}
              >
                Next: Billing <IconArrowRight size={14} />
              </button>
            </div>

            {pastVisits.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
                No prior completed visits found for this patient in this clinic.
              </div>
            ) : (
              <div className="space-y-4">
                {pastVisits.map((v, idx) => (
                  <div key={v.id || idx} className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary font-bold text-xs">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-ink text-sm">{v.diagnosis || 'Consultation Visit'}</span>
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold tabular">{v.date}</span>
                    </div>

                    {v.symptoms && (
                      <p className="text-xs text-ink/80">
                        <strong className="text-muted-foreground">Symptoms:</strong> {v.symptoms}
                      </p>
                    )}

                    {v.notes && (
                      <p className="text-xs text-ink/80">
                        <strong className="text-muted-foreground">Clinical Notes:</strong> {v.notes}
                      </p>
                    )}

                    {v.vitals && Object.keys(v.vitals).length > 0 && (
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-primary bg-primary-soft/30 p-2 rounded-lg">
                        {v.vitals.bpSystolic && <span>BP: {v.vitals.bpSystolic}/{v.vitals.bpDiastolic} mmHg</span>}
                        {v.vitals.temperatureC && <span>Temp: {v.vitals.temperatureC}°C</span>}
                        {v.vitals.pulse && <span>Pulse: {v.vitals.pulse} bpm</span>}
                        {v.vitals.weightKg && <span>Weight: {v.vitals.weightKg} kg</span>}
                      </div>
                    )}

                    {v.prescription && v.prescription.length > 0 && (
                      <div className="pt-2 border-t border-border/40">
                        <span className="text-xs font-bold text-muted-foreground uppercase block mb-1">Prescribed Medicines ({v.prescription.length}):</span>
                        <ul className="space-y-1 text-xs">
                          {v.prescription.map((rx: any, rIdx: number) => (
                            <li key={rIdx} className="flex items-center justify-between bg-card p-2 rounded-lg border border-border/60">
                              <span className="font-semibold text-ink">{rx.medicine} — {rx.dosage || ''}</span>
                              <span className="text-[11px] text-muted-foreground">{rx.frequency || ''} · {rx.durationDays ? `${rx.durationDays} days` : ''}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border/80">
              <button type="button" onClick={() => setActiveStep('prescriptions')} className={btnGhost}>
                <IconChevronLeft size={14} /> Back
              </button>
              <button type="button" onClick={() => setActiveStep('billing')} className={btnPrimary}>
                Next: Billing <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeStep === 'billing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/80 pb-4">
              <div>
                <h3 className="font-display text-base font-bold text-ink">Step 4: Billing, Follow-up &amp; Completion</h3>
                <p className="text-xs text-muted-foreground">Set follow-up date, consultation charges, and finalize visit</p>
              </div>
              <button type="button" onClick={() => setActiveStep('prescriptions')} className={btnGhost}>
                <IconChevronLeft size={14} /> Back
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <Field label="Follow Up Date (Optional)">
                  <DatePicker value={followUp} onChange={setFollowUp} />
                </Field>

                <Field label="Consultation &amp; Service Fee (₹ INR)">
                  <input
                    className={inputClass}
                    inputMode="numeric"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    placeholder="500"
                  />
                </Field>
              </div>

              <div className="rounded-2xl border border-border bg-canvas p-5 space-y-3">
                <div className="text-xs font-bold text-primary uppercase">Consultation Summary</div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Patient:</span>
                  <span className="font-semibold text-ink">{patientName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Prescribed Medicines:</span>
                  <span className="font-semibold text-ink">{rows.filter((r) => r.medicine.trim()).length} items</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Consultation Fee:</span>
                  <span className="font-semibold text-ink">₹ {consultationFee}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-ink">
                  <span>Total Due:</span>
                  <span className="text-primary">₹ {consultationFee}</span>
                </div>
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-xs text-red" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border/80">
              <button type="button" onClick={() => setActiveStep('prescriptions')} className={btnGhost}>
                <IconChevronLeft size={14} /> Back
              </button>
              <button type="button" className={btnPrimary} disabled={pending} onClick={submit}>
                {pending && <Spinner />}
                {pending ? 'Completing Consultation…' : 'Complete & Save Consultation ✓'}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
