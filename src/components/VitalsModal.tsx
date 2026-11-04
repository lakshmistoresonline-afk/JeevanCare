'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, btnGhost, inputClass, Field, Spinner } from './primitives'
import { recordPatientVitals } from '@/app/(frontend)/dashboard/appointments/actions'
import { toast } from 'sonner'

export function VitalsModal({
  appointmentId,
  patientName,
  isOpen,
  onClose,
}: {
  appointmentId: string
  patientName: string
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [bpS, setBpS] = useState('')
  const [bpD, setBpD] = useState('')
  const [temp, setTemp] = useState('')
  const [weight, setWeight] = useState('')
  const [pulse, setPulse] = useState('')

  if (!isOpen) return null

  const num = (s: string) => (s.trim() === '' ? undefined : Number(s))

  const save = () => {
    start(async () => {
      const res = await recordPatientVitals(appointmentId, {
        bpSystolic: num(bpS),
        bpDiastolic: num(bpD),
        temperatureC: num(temp),
        weightKg: num(weight),
        pulse: num(pulse),
      })
      if (res.ok) {
        toast.success(`Vitals recorded for ${patientName}!`)
        onClose()
        router.refresh()
      } else {
        toast.error(res.message || 'Failed to record vitals.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-fade-up">
        <div>
          <h3 className="font-display text-base font-bold text-ink">Record Patient Vitals</h3>
          <p className="text-xs text-muted-foreground">Triage vitals entry for {patientName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="BP Systolic (mmHg)">
            <input className={inputClass} inputMode="numeric" value={bpS} onChange={(e) => setBpS(e.target.value)} placeholder="120" autoFocus />
          </Field>
          <Field label="BP Diastolic (mmHg)">
            <input className={inputClass} inputMode="numeric" value={bpD} onChange={(e) => setBpD(e.target.value)} placeholder="80" />
          </Field>
          <Field label="Temp (°C)">
            <input className={inputClass} inputMode="decimal" value={temp} onChange={(e) => setTemp(e.target.value)} placeholder="37.2" />
          </Field>
          <Field label="Weight (kg)">
            <input className={inputClass} inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="68" />
          </Field>
          <Field label="Pulse (bpm)">
            <input className={inputClass} inputMode="numeric" value={pulse} onChange={(e) => setPulse(e.target.value)} placeholder="76" />
          </Field>
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <button type="button" onClick={save} className={`${btnPrimary} flex-1`} disabled={pending}>
            {pending && <Spinner />}
            {pending ? 'Saving Vitals…' : 'Save Patient Vitals'}
          </button>
          <button type="button" onClick={onClose} className={btnGhost} disabled={pending}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
