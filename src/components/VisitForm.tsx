'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { btnPrimary, btnGhost, inputClass, textareaClass, Card, Field, Avatar, AllergyBanner, Spinner } from './primitives'
import { AppSelect } from './AppSelect'
import { DatePicker } from './DatePicker'
import { VoiceDictationBar } from './VoiceDictationBar'
import { IconPlus, IconX, IconCheck, IconArrowRight, IconChevronLeft } from './icons'
import { PRESCRIPTION_FREQUENCIES } from '@/lib/constants'
import { recordVisit, type PrescriptionRowInput } from '@/app/(frontend)/dashboard/visits/actions'
import { MedicineDirectorySearch } from './MedicineDirectorySearch'
import { saveDraftVisit, getDraftVisit, clearDraftVisit } from '@/lib/offlineDb'
import { checkClinicalConflicts, type DrugConflictWarning } from '@/lib/drugInteractions'
import { evalBpSystolic, evalBpDiastolic, evalTemp, evalPulse } from '@/lib/vitalsThresholds'

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
  initialVitals,
  initialPaymentInfo,
  initialSymptoms = '',
  initialDiagnosis = '',
  initialNotes = '',
  initialPrescription = [],
  initialFollowUpDate = '',
  doctorId,
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
  initialVitals?: {
    bpSystolic?: number | null
    bpDiastolic?: number | null
    temperatureC?: number | null
    weightKg?: number | null
    pulse?: number | null
  }
  initialPaymentInfo?: {
    isPaid: boolean
    amountPaid: number
    paymentMethod: string
  }
  initialSymptoms?: string
  initialDiagnosis?: string
  initialNotes?: string
  initialPrescription?: PrescriptionRowInput[]
  initialFollowUpDate?: string
  doctorId?: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Distraction-free Focus Mode toggle
  const [focusMode, setFocusMode] = useState(false)
  // 1-Screen Compact EMR Speed Mode toggle
  const [speedMode, setSpeedMode] = useState(false)
  // Split-Screen Past Visit Compare toggle
  const [compareVisitId, setCompareVisitId] = useState<string | null>(null)
  // AI Clinical Suggester panel
  const [showAiSuggester, setShowAiSuggester] = useState(false)

  // 5-Step EMR Tab Navigation
  const [activeStep, setActiveStep] = useState<'vitals' | 'diagnosis' | 'prescriptions' | 'history' | 'billing'>('vitals')

  // Vitals initialized from staff-entered triage vitals
  const [bpS, setBpS] = useState(initialVitals?.bpSystolic != null ? String(initialVitals.bpSystolic) : '')
  const [bpD, setBpD] = useState(initialVitals?.bpDiastolic != null ? String(initialVitals.bpDiastolic) : '')
  const [temp, setTemp] = useState(initialVitals?.temperatureC != null ? String(initialVitals.temperatureC) : '')
  const [weight, setWeight] = useState(initialVitals?.weightKg != null ? String(initialVitals.weightKg) : '')
  const [pulse, setPulse] = useState(initialVitals?.pulse != null ? String(initialVitals.pulse) : '')

  const [symptoms, setSymptoms] = useState(initialSymptoms || '')
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis || '')
  const [notes, setNotes] = useState(initialNotes || '')
  const [followUp, setFollowUp] = useState(initialFollowUpDate || '')
  const [consultationFee, setConsultationFee] = useState(initialPaymentInfo?.isPaid ? '0' : '800')
  const [rows, setRows] = useState<PrescriptionRowInput[]>(
    initialPrescription && initialPrescription.length > 0 ? initialPrescription : [blankRow()]
  )
  const [kitConfirm, setKitConfirm] = useState<{ label: string; items: PrescriptionRowInput[] } | null>(null)

  // Real-time Drug-Drug Interaction & Allergy Conflicts
  const clinicalWarnings = checkClinicalConflicts(
    rows.map((r) => r.medicine),
    patientAllergies
  )

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
      if (res.ok) {
        await clearDraftVisit(appointmentId)
        toast.success('Consultation record saved successfully!')
        if ((res.data as any)?.invoiceId) {
          router.push(`/dashboard/invoices/${(res.data as any).invoiceId}`)
        } else {
          router.push('/dashboard/appointments')
        }
      } else setError(res.message)
    })
  }

  // Restore draft consultation from IndexedDB on load
  useEffect(() => {
    getDraftVisit(appointmentId).then((draft) => {
      if (draft) {
        if (draft.symptoms) setSymptoms(draft.symptoms)
        if (draft.diagnosis) setDiagnosis(draft.diagnosis)
        if (draft.notes) setNotes(draft.notes)
        if (draft.followUpDate) setFollowUp(draft.followUpDate)
        if (draft.prescription && draft.prescription.length > 0) setRows(draft.prescription)
        if (draft.vitals) {
          if (draft.vitals.bpSystolic) setBpS(String(draft.vitals.bpSystolic))
          if (draft.vitals.bpDiastolic) setBpD(String(draft.vitals.bpDiastolic))
          if (draft.vitals.temperatureC) setTemp(String(draft.vitals.temperatureC))
          if (draft.vitals.weightKg) setWeight(String(draft.vitals.weightKg))
          if (draft.vitals.pulse) setPulse(String(draft.vitals.pulse))
        }
        toast.info('Restored offline consultation draft from IndexedDB buffer.')
      }
    })
  }, [appointmentId])

  // Auto-buffer draft consultation to IndexedDB on every edit
  useEffect(() => {
    const hasData = symptoms || diagnosis || notes || rows.some((r) => r.medicine.trim()) || bpS || bpD || temp || weight || pulse
    if (hasData) {
      saveDraftVisit({
        appointmentId,
        patientName,
        symptoms,
        diagnosis,
        notes,
        vitals: { bpSystolic: num(bpS), bpDiastolic: num(bpD), temperatureC: num(temp), weightKg: num(weight), pulse: num(pulse) },
        prescription: rows,
        followUpDate: followUp || undefined,
        updatedAt: new Date().toISOString(),
      })
    }
  }, [appointmentId, patientName, symptoms, diagnosis, notes, bpS, bpD, temp, weight, pulse, rows, followUp])

  // Doctor Keyboard Shortcuts (Alt+N = Add Rx, Alt+S = Save, Alt+V = Vitals, Alt+D = Diagnosis, Alt+P = Rx Tab)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.metaKey) {
        const key = e.key.toLowerCase()
        if (key === 'n') {
          e.preventDefault()
          addRow()
          toast.info('Added new prescription line (Alt+N)')
        } else if (key === 's') {
          e.preventDefault()
          submit()
        } else if (key === 'v') {
          e.preventDefault()
          setActiveStep('vitals')
          toast.info('Switched to Vitals (Alt+V)')
        } else if (key === 'd') {
          e.preventDefault()
          setActiveStep('diagnosis')
          toast.info('Switched to Diagnosis (Alt+D)')
        } else if (key === 'p') {
          e.preventDefault()
          setActiveStep('prescriptions')
          toast.info('Switched to Prescriptions (Alt+P)')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [rows, bpS, bpD, temp, weight, pulse, symptoms, diagnosis, notes, followUp])

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
          {pastVisits.length > 0 && (
            <button
              type="button"
              onClick={() => setCompareVisitId(compareVisitId ? null : pastVisits[0]?.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                compareVisitId
                  ? 'border-indigo-500 bg-indigo-500 text-white shadow-2xs'
                  : 'border-border bg-card text-ink hover:border-indigo-500/50'
              }`}
              title="Compare current visit side-by-side with previous EMR notes"
            >
              {compareVisitId ? '📑 Comparing Past Visit' : '📑 Compare Past Visit'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setSpeedMode(!speedMode)}
            className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
              speedMode
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-2xs'
                : 'border-border bg-card text-ink hover:border-emerald-500/50'
            }`}
            title="Toggle 1-Screen Compact EMR Speed Mode for 50% faster consultation"
          >
            {speedMode ? '⚡ Speed Mode: ON' : '⚡ Speed Mode (1-Screen)'}
          </button>
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
            {focusMode ? '🎯 Focus Mode: ON' : '🎯 Focus Mode'}
          </button>
          <button type="button" onClick={submit} className={btnPrimary} disabled={pending}>
            {pending ? <Spinner /> : <IconCheck size={16} />}
            {pending ? 'Saving…' : 'Complete Consultation'}
            <kbd className="ms-1 rounded bg-white/20 px-1 py-0.5 text-[9px] font-mono font-normal">Alt+S</kbd>
          </button>
        </div>
      </Card>

      {/* Real-Time Drug-Drug Interaction & Allergy Warnings */}
      {clinicalWarnings.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {clinicalWarnings.map((warn, wIdx) => (
            <div
              key={wIdx}
              className={`rounded-2xl border p-4 text-xs font-medium shadow-xs flex items-start gap-3 ${
                warn.severity === 'high'
                  ? 'border-red/40 bg-red-soft/80 text-red'
                  : 'border-amber/40 bg-amber-soft/80 text-amber-foreground'
              }`}
            >
              <span className="text-lg">⚠️</span>
              <div className="flex-1">
                <div className="font-bold text-sm">{warn.title}</div>
                <div className="mt-0.5 text-xs opacity-90">{warn.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Split-Screen Past Visit Compare Drawer */}
      {compareVisitId && pastVisits.length > 0 && (
        <Card className="p-5 border-indigo-500/40 bg-indigo-500/5 space-y-3 animate-fade-down">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Split-Screen EMR Compare</span>
              <h3 className="font-display text-sm font-bold text-ink">
                Previous Consultation on {pastVisits.find((v) => v.id === compareVisitId)?.date}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <select
                className={`${inputClass} text-xs py-1 h-8 bg-card`}
                value={compareVisitId}
                onChange={(e) => setCompareVisitId(e.target.value)}
              >
                {pastVisits.map((v) => (
                  <option key={v.id} value={v.id}>
                    Visit on {v.date} ({v.diagnosis || 'Consultation'})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setCompareVisitId(null)}
                className="text-muted-foreground hover:text-ink font-bold text-xs"
              >
                ✕ Close Split
              </button>
            </div>
          </div>

          {(() => {
            const pastV = pastVisits.find((v) => v.id === compareVisitId)
            if (!pastV) return null
            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-card p-4 rounded-xl border border-border/80">
                <div>
                  <span className="font-bold text-muted-foreground block mb-1">Past Symptoms &amp; Notes:</span>
                  <p className="text-ink text-xs">{pastV.symptoms || pastV.notes || 'No symptoms recorded'}</p>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground block mb-1">Past Diagnosis:</span>
                  <span className="font-bold text-primary text-xs">{pastV.diagnosis || 'General Consultation'}</span>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground block mb-1">Past Prescribed Medicines:</span>
                  {pastV.prescription && pastV.prescription.length > 0 ? (
                    <ul className="list-disc list-inside space-y-0.5 text-xs text-ink">
                      {pastV.prescription.map((m: any, idx: number) => (
                        <li key={idx}>
                          <strong>{m.medicine}</strong> ({m.dosage})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">No medicines on record</span>
                  )}
                </div>
              </div>
            )
          })()}
        </Card>
      )}

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
        {speedMode ? (
          /* ⚡ 1-Screen Compact EMR Speed Mode Layout */
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-3 bg-emerald-500/10 -mx-6 -mt-6 p-4 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-xs">⚡</span>
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">1-Screen EMR Speed Mode Active</h3>
                  <p className="text-[11px] text-muted-foreground">All vitals, diagnosis, and prescription rows editable on 1 screen</p>
                </div>
              </div>
              <button type="button" onClick={submit} className={btnPrimary} disabled={pending}>
                {pending ? <Spinner /> : <IconCheck size={15} />}
                {pending ? 'Saving…' : 'Complete & Save Consultation ✓'}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Vitals, Symptoms, Diagnosis */}
              <div className="space-y-5">
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Patient Vitals</h4>
                  <div className="grid grid-cols-5 gap-2">
                    <Field label="BP Sys"><input className={inputClass} inputMode="numeric" value={bpS} onChange={(e) => setBpS(e.target.value)} placeholder="120" /></Field>
                    <Field label="BP Dia"><input className={inputClass} inputMode="numeric" value={bpD} onChange={(e) => setBpD(e.target.value)} placeholder="80" /></Field>
                    <Field label="Temp °C"><input className={inputClass} inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="37.2" /></Field>
                    <Field label="Wt (kg)"><input className={inputClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="68" /></Field>
                    <Field label="Pulse"><input className={inputClass} inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="76" /></Field>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Symptoms</h4>
                    <VoiceDictationBar label="Dictate" onTranscript={(text) => setSymptoms((prev) => (prev ? `${prev} ${text}` : text))} />
                  </div>
                  <textarea className={textareaClass} rows={2} value={symptoms} onChange={(e) => setSymptoms(e.target.value)} placeholder="Symptoms & complaints..." />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Diagnosis &amp; Clinical Notes</h4>
                    <VoiceDictationBar label="Dictate" onTranscript={(text) => setDiagnosis((prev) => (prev ? `${prev} ${text}` : text))} />
                  </div>
                  <input className={inputClass} value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Primary diagnosis e.g. Acute Bronchitis..." />
                  <textarea className={textareaClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Clinical assessment &amp; treatment plan notes..." />
                </div>
              </div>

              {/* Right Column: Prescriptions & Medicines */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Rx Prescription Lines ({rows.length})</h4>
                  <button type="button" onClick={addRow} className="text-xs font-bold text-primary hover:underline">
                    + Add Medicine
                  </button>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {rows.map((row, i) => (
                    <div key={i} className="space-y-2 p-3 rounded-xl border border-border bg-canvas/60">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-primary">#{i + 1}</span>
                        <input
                          className={inputClass}
                          value={row.medicine}
                          onChange={(e) => setRow(i, { medicine: e.target.value })}
                          placeholder="Medicine name &amp; brand (e.g. Paracetamol 650mg)"
                        />
                        {rows.length > 1 && (
                          <button type="button" onClick={() => removeRow(i)} className="p-1 text-muted-foreground hover:text-red">
                            <IconX size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input className={inputClass} value={row.dosage || ''} onChange={(e) => setRow(i, { dosage: e.target.value })} placeholder="Dosage e.g. 1 tab" />
                        <AppSelect value={row.frequency || ''} onChange={(v) => setRow(i, { frequency: v })} options={FREQ_OPTIONS} placeholder="Freq" />
                        <input className={inputClass} inputMode="numeric" value={row.durationDays ?? ''} onChange={(e) => setRow(i, { durationDays: e.target.value ? Number(e.target.value) : undefined })} placeholder="Days" />
                      </div>
                    </div>
                  ))}

                  {/* Medicine Directory Search with Presets enabled in Speed Mode */}
                  <div className="pt-4 mt-4 border-t border-border/60">
                    <MedicineDirectorySearch
                      onSelectMedicine={(item) => {
                        const emptyIdx = rows.findIndex((r) => !r.medicine)
                        if (emptyIdx >= 0) setRow(emptyIdx, item)
                        else setRows((r) => [...r, item])
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeStep === 'vitals' && (
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
                <div>
                  <Field label="BP Systolic (mmHg)">
                    <input className={`${inputClass} transition-all ${evalBpSystolic(bpS).inputClass}`} inputMode="numeric" value={bpS} onChange={(e) => setBpS(e.target.value)} placeholder="120" />
                  </Field>
                  {evalBpSystolic(bpS).label && <span className="mt-1 text-[10px] font-bold block truncate">{evalBpSystolic(bpS).label}</span>}
                </div>
                <div>
                  <Field label="BP Diastolic (mmHg)">
                    <input className={`${inputClass} transition-all ${evalBpDiastolic(bpD).inputClass}`} inputMode="numeric" value={bpD} onChange={(e) => setBpD(e.target.value)} placeholder="80" />
                  </Field>
                  {evalBpDiastolic(bpD).label && <span className="mt-1 text-[10px] font-bold block truncate">{evalBpDiastolic(bpD).label}</span>}
                </div>
                <div>
                  <Field label="Temp (°C)">
                    <input className={`${inputClass} transition-all ${evalTemp(temp).inputClass}`} inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="37.2" />
                  </Field>
                  {evalTemp(temp).label && <span className="mt-1 text-[10px] font-bold block truncate">{evalTemp(temp).label}</span>}
                </div>
                <div>
                  <Field label="Weight (kg)">
                    <input className={inputClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="68" />
                  </Field>
                </div>
                <div>
                  <Field label="Pulse (bpm)">
                    <input className={`${inputClass} transition-all ${evalPulse(pulse).inputClass}`} inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="76" />
                  </Field>
                  {evalPulse(pulse).label && <span className="mt-1 text-[10px] font-bold block truncate">{evalPulse(pulse).label}</span>}
                </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAiSuggester(!showAiSuggester)}
                      className="rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 px-2.5 py-1 text-[11px] font-bold transition-colors flex items-center gap-1 border border-indigo-500/30"
                    >
                      💡 AI Differential &amp; Labs
                    </button>
                    <VoiceDictationBar
                      label="Dictate"
                      onTranscript={(text) => setDiagnosis((prev) => (prev ? `${prev} ${text}` : text))}
                    />
                  </div>
                </div>

                {showAiSuggester && (
                  <div className="mb-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-4 text-xs space-y-3 animate-fade-down">
                    <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                      <span className="font-bold text-indigo-600">💡 AI Clinical Suggester (ICD-10 &amp; Labs)</span>
                      <button type="button" onClick={() => setShowAiSuggester(false)} className="text-muted-foreground hover:text-ink font-bold">✕</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="font-bold text-muted-foreground block mb-1">Suggested ICD-10 Diagnoses:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { label: 'J06.9 Acute URI', text: 'Acute Upper Respiratory Infection (J06.9)' },
                            { label: 'I10 Hypertension', text: 'Essential Hypertension (I10)' },
                            { label: 'E11.9 T2DM', text: 'Type 2 Diabetes Mellitus (E11.9)' },
                            { label: 'J45.9 Asthma', text: 'Bronchial Asthma (J45.9)' },
                          ].map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                setDiagnosis(item.text)
                                toast.success(`Selected diagnosis: ${item.text}`)
                              }}
                              className="rounded-md bg-card border border-border px-2 py-1 text-[11px] font-semibold hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                            >
                              + {item.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="font-bold text-muted-foreground block mb-1">Recommended Lab Investigations:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['CBC & ESR', 'HbA1c & Fasting Glucose', 'Lipid Profile', 'Serum Creatinine & LFT'].map((lab) => (
                            <button
                              key={lab}
                              type="button"
                              onClick={() => {
                                setNotes((prev) => (prev ? `${prev}\nRecommended Labs: ${lab}` : `Recommended Labs: ${lab}`))
                                toast.success(`Added ${lab} to clinical notes.`)
                              }}
                              className="rounded-md bg-card border border-border px-2 py-1 text-[11px] font-semibold hover:border-indigo-500 hover:text-indigo-600 transition-colors"
                            >
                              + {lab}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

                {initialPaymentInfo?.isPaid ? (
                  <div className="rounded-xl border border-green-strong/30 bg-green-soft/60 p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-green-strong">
                      <span>✓</span> Consultation Fee Paid at Reception
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Collected ₹{initialPaymentInfo.amountPaid} via {initialPaymentInfo.paymentMethod.toUpperCase()} during front-desk check-in. Patient does not owe any additional fee.
                    </p>
                    <div className="border-t border-green-strong/20 pt-1.5 flex justify-between text-xs font-bold text-ink">
                      <span>Balance Due:</span>
                      <span className="text-green-strong">₹ 0 (Paid)</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Consultation Fee:</span>
                      <span className="font-semibold text-ink">₹ {consultationFee}</span>
                    </div>
                    <div className="border-t border-border pt-2 flex justify-between text-sm font-bold text-ink">
                      <span>Total Due:</span>
                      <span className="text-primary">₹ {consultationFee}</span>
                    </div>
                  </>
                )}
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

        {/* Doctor Keyboard Hotkey Legend Bar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-bold text-primary">
            <span>⌨️ Keyboard Shortcuts:</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
            <span className="inline-flex items-center gap-1 rounded bg-card px-2 py-0.5 border border-border">
              <kbd className="font-mono font-bold text-ink">Alt + N</kbd> Add Medicine
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-card px-2 py-0.5 border border-border">
              <kbd className="font-mono font-bold text-ink">Alt + S</kbd> Complete &amp; Save
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-card px-2 py-0.5 border border-border">
              <kbd className="font-mono font-bold text-ink">Alt + V</kbd> Vitals
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-card px-2 py-0.5 border border-border">
              <kbd className="font-mono font-bold text-ink">Alt + D</kbd> Diagnosis
            </span>
            <span className="inline-flex items-center gap-1 rounded bg-card px-2 py-0.5 border border-border">
              <kbd className="font-mono font-bold text-ink">Alt + P</kbd> Rx Prescriptions
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
