'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, inputClass, Spinner, Card } from '@/components/primitives'
import { formatDoctorName } from '@/lib/utils'
import { getPatientAvailableSlots, patientBookAppointment } from '@/app/(frontend)/patient/appointments/actions'
import { IconCheck, IconArrowRight, IconChevronLeft } from '@/components/icons'

function todayInIST(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value ?? ''
  const m = parts.find((p) => p.type === 'month')?.value ?? ''
  const d = parts.find((p) => p.type === 'day')?.value ?? ''
  return `${y}-${m}-${d}`
}

export function PatientAppointmentBooker({
  doctors,
  patientId: _patientId,
  initialDoctorId = '',
}: {
  doctors: { id: string; name: string; specialty?: string | null; clinicName?: string | null }[]
  patientId: string
  initialDoctorId?: string
}) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [doctorId, setDoctorId] = useState(initialDoctorId)
  const [date, setDate] = useState(() => todayInIST())
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState('')
  const [reason, setReason] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const handleFetchSlots = async (docId: string, selectedDate: string) => {
    if (!docId || !selectedDate) return
    setLoadingSlots(true)
    setError(null)
    setSlots([])
    setSelectedSlot('')
    try {
      const res = await getPatientAvailableSlots(docId, selectedDate)
      if (res.ok && res.slots) {
        setSlots(res.slots)
        if (res.slots.length === 0) {
          setError('No appointments available for this doctor on this date.')
        }
      } else {
        setError(res.message || 'Could not load slots.')
      }
    } catch {
      setError('Failed to fetch availability.')
    } finally {
      setLoadingSlots(false)
    }
  }

  useEffect(() => {
    if (doctorId && date) {
      handleFetchSlots(doctorId, date)
    }
  }, [doctorId, date])

  const handleBook = () => {
    if (!doctorId || !date || !selectedSlot) {
      setError('Please select a doctor, date, and available time slot.')
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await patientBookAppointment(doctorId, date, selectedSlot, reason)
      if (res.ok) {
        router.push('/patient/appointments')
      } else {
        setError(res.message || 'This appointment slot is no longer available. Please select another time.')
      }
    })
  }

  const selectedDoctorObj = doctors.find((d) => d.id === doctorId)

  return (
    <div className="space-y-6">
      {/* 3-Step Visual Stepper Header */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { num: 1, title: 'Doctor & Date', desc: 'Choose physician & day' },
          { num: 2, title: 'Time Slot', desc: 'Select consultation time' },
          { num: 3, title: 'Confirm & Visit', desc: 'Symptoms & booking' },
        ].map((s) => {
          const isDone = step > s.num
          const isCurrent = step === s.num
          return (
            <div
              key={s.num}
              onClick={() => {
                if (s.num < step || (s.num === 2 && doctorId && date) || (s.num === 3 && selectedSlot)) {
                  setStep(s.num as any)
                }
              }}
              className={`flex flex-col p-3 rounded-2xl border transition-all cursor-pointer ${
                isCurrent
                  ? 'border-primary bg-primary-soft/40 shadow-xs'
                  : isDone
                    ? 'border-primary/40 bg-card'
                    : 'border-border/80 bg-card opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${isDone || isCurrent ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                  {isDone ? <IconCheck size={12} strokeWidth={3} /> : s.num}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Step {s.num}</span>
              </div>
              <div className="mt-2">
                <div className="text-xs font-bold text-ink">{s.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">{s.desc}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Stepper Content Card */}
      <Card className="p-6 space-y-5">
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Step 1: Choose Doctor &amp; Date</h3>
              <p className="text-xs text-muted-foreground">Select your preferred medical specialist and consultation date</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Doctor / Specialist</label>
              <select
                value={doctorId}
                onChange={(e) => setDoctorId(e.target.value)}
                className={inputClass}
                aria-label="Choose doctor"
              >
                <option value="" disabled>Choose doctor</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {formatDoctorName(d.name)} {d.specialty ? `— ${d.specialty}` : ''} {d.clinicName ? `(${d.clinicName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Appointment Date</label>
              <input
                type="date"
                value={date}
                min={todayInIST()}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
                aria-label="Select appointment date"
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-border/80">
              <button
                type="button"
                disabled={!doctorId || !date}
                onClick={() => setStep(2)}
                className={btnPrimary}
              >
                Next: Select Time Slot <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Step 2: Select Time Slot</h3>
              <p className="text-xs text-muted-foreground">Available slots for {selectedDoctorObj ? formatDoctorName(selectedDoctorObj.name) : 'Doctor'} on {date}</p>
            </div>

            {loadingSlots && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Spinner /> Checking doctor availability...
              </div>
            )}

            {!loadingSlots && slots.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                No available time slots found for this date. Please pick another date or doctor.
              </div>
            )}

            {!loadingSlots && slots.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">Available Times (IST)</label>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4" role="group" aria-label="Available time slots">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      aria-pressed={selectedSlot === slot}
                      className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                        selectedSlot === slot
                          ? 'border-primary bg-primary text-white shadow-sm ring-2 ring-primary/20'
                          : 'border-border bg-canvas hover:border-primary/50 hover:bg-secondary/50'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-border/80">
              <button type="button" onClick={() => setStep(1)} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-border hover:bg-secondary">
                <IconChevronLeft size={14} /> Back
              </button>
              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
                className={btnPrimary}
              >
                Next: Reason &amp; Confirm <IconArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h3 className="font-display text-base font-bold text-ink">Step 3: Reason &amp; Confirm Booking</h3>
              <p className="text-xs text-muted-foreground">Add brief symptoms or reason for visit and finalize booking</p>
            </div>

            <div className="rounded-2xl border border-border bg-canvas p-4 space-y-2 text-xs">
              <div className="font-bold text-primary uppercase">Appointment Summary</div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Doctor:</span>
                <span className="font-semibold text-ink">{selectedDoctorObj ? formatDoctorName(selectedDoctorObj.name) : 'Doctor'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date &amp; Time:</span>
                <span className="font-semibold text-ink">{date} at {selectedSlot}</span>
              </div>
              {selectedDoctorObj?.specialty && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Specialty:</span>
                  <span className="font-semibold text-ink">{selectedDoctorObj.specialty}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Reason for Visit / Symptoms (Optional)</label>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason for visit (e.g. Fever, cough, follow-up)…"
                className={inputClass}
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-xs text-red" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-border/80">
              <button type="button" onClick={() => setStep(2)} className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-border hover:bg-secondary">
                <IconChevronLeft size={14} /> Back
              </button>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/patient/dashboard')}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-medium hover:bg-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBook}
                  disabled={pending || !selectedSlot}
                  className={btnPrimary}
                >
                  {pending && <Spinner />}
                  {pending ? 'Booking Appointment…' : 'Confirm & Book Appointment ✓'}
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
