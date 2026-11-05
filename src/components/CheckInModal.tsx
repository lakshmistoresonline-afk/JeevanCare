'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, btnGhost, inputClass, Spinner } from './primitives'
import { AppSelect } from './AppSelect'
import { PAYMENT_METHODS } from '@/lib/constants'
import { checkInAndCollectPayment } from '@/app/(frontend)/dashboard/appointments/actions'
import { toast } from 'sonner'

const METHOD_OPTIONS = PAYMENT_METHODS.map((m) => ({ value: m.value, label: m.label }))

export function CheckInModal({
  appointmentId,
  patientName,
  doctorName,
  consultationFee = 800,
  isOpen,
  onClose,
}: {
  appointmentId: string
  patientName: string
  doctorName?: string
  consultationFee?: number
  isOpen: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [amount, setAmount] = useState(String(consultationFee || 800))
  const [method, setMethod] = useState('cash')

  if (!isOpen) return null

  const handleCheckInWithPayment = (collectFee: boolean) => {
    start(async () => {
      const payAmount = collectFee ? Number(amount) : 0
      const res = await checkInAndCollectPayment({
        appointmentId,
        amount: payAmount,
        paymentMethod: method,
      })
      if (res.ok) {
        toast.success(
          collectFee
            ? `Checked in ${patientName}! Token ${res.data.token || 'assigned'} & Paid Receipt Generated.`
            : `Checked in ${patientName}! Token ${res.data.token || 'assigned'}.`
        )
        onClose()
        router.refresh()
      } else {
        toast.error(res.message || 'Failed to check in patient.')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-fade-up">
        <div>
          <h3 className="font-display text-base font-bold text-ink">Front-Desk OPD Check-In &amp; Billing</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Check in <strong className="text-ink">{patientName}</strong> for <strong className="text-ink">{doctorName || 'Doctor'}</strong>
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-canvas p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Doctor Consultation Fee:</span>
            <span className="font-bold text-ink text-sm">₹{consultationFee || 800}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-border/60">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Amount (₹)</label>
              <input
                className={inputClass}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">Payment Method</label>
              <AppSelect value={method} onChange={setMethod} options={METHOD_OPTIONS} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => handleCheckInWithPayment(true)}
            className={`${btnPrimary} w-full`}
            disabled={pending}
          >
            {pending && <Spinner />}
            {pending ? 'Processing Check-In…' : `💳 Collect ₹${amount} & Check In`}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleCheckInWithPayment(false)}
              className={`${btnGhost} flex-1 text-xs`}
              disabled={pending}
            >
              Check In Only (Unpaid)
            </button>
            <button type="button" onClick={onClose} className={btnGhost} disabled={pending}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
