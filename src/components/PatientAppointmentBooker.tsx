'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, inputClass, Spinner } from '@/components/primitives'
import { formatDoctorName } from '@/lib/utils'
import { getAvailableSlots, bookAppointment } from '@/app/(frontend)/dashboard/appointments/actions'

export function PatientAppointmentBooker({
  doctors,
  patientId,
  initialDoctorId = '',
}: {
  doctors: { id: string; name: string; specialty?: string | null; clinicName?: string | null }[]
  patientId: string
  initialDoctorId?: string
}) {
  const router = useRouter()
  const [doctorId, setDoctorId] = useState(initialDoctorId)
  const [date, setDate] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
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
      const res = await getAvailableSlots(docId, selectedDate)
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
      const formData = new FormData()
      formData.set('patient', patientId)
      formData.set('doctor', doctorId)
      formData.set('date', date)
      formData.set('time', selectedSlot)
      formData.set('reason', reason)

      const res = await bookAppointment(formData)
      if (res.ok) {
        router.push('/patient/appointments')
      } else {
        setError(res.message || 'This appointment slot is no longer available. Please select another time.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Doctor</label>
        <select
          value={doctorId}
          onChange={(e) => {
            setDoctorId(e.target.value)
          }}
          className={inputClass}
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
        <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => {
            setDate(e.target.value)
          }}
          className={inputClass}
        />
      </div>

      {loadingSlots && (
        <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          <Spinner /> Checking doctor availability...
        </div>
      )}

      {slots.length > 0 && (
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-2">Available Times</label>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                  selectedSlot === slot
                    ? 'border-primary bg-primary text-white shadow-xs'
                    : 'border-border bg-canvas hover:border-primary/50'
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Reason for Visit / Symptoms</label>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Briefly describe your symptoms or reason for visit"
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg border border-red/25 bg-red-soft px-3 py-2 text-sm text-red" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-2">
        <button
          type="button"
          onClick={() => router.push('/patient/dashboard')}
          className="flex-1 rounded-lg border border-border py-2 text-center text-sm font-medium hover:bg-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleBook}
          disabled={pending || !selectedSlot}
          className={`${btnPrimary} flex-1`}
        >
          {pending && <Spinner />}
          {pending ? 'Booking...' : 'Confirm Appointment'}
        </button>
      </div>
    </div>
  )
}
