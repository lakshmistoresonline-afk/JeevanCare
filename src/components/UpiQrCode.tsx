'use client'

import { useState } from 'react'

const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/

export function UpiQrCode({
  upiId,
  name,
  amount,
  transactionNote = 'Medical Bill Payment',
  size = 140,
}: {
  upiId?: string | null
  name?: string | null
  amount?: number | null
  transactionNote?: string
  size?: number
}) {
  const [imageError, setImageError] = useState(false)
  const cleanUpi = (upiId || '').trim()

  if (!cleanUpi || !UPI_ID_REGEX.test(cleanUpi)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="mt-2 text-xs font-semibold text-ink">
          {!cleanUpi ? 'UPI not configured' : 'Invalid UPI ID format'}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {!cleanUpi
            ? 'The clinic has not set up a UPI ID. Please pay at the reception desk.'
            : 'Please verify the clinic UPI ID in settings.'}
        </div>
      </div>
    )
  }

  const cleanName = encodeURIComponent((name || 'Clinic').trim())
  const cleanNote = encodeURIComponent(transactionNote)
  const amt = amount && amount > 0 ? amount.toFixed(2) : '0.00'

  const upiUri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${amt}&cu=INR&tn=${cleanNote}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiUri)}`

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-3 text-center shadow-xs">
      {!imageError ? (
        <img
          src={qrUrl}
          alt={`Pay ₹${amt} via UPI to ${cleanUpi}`}
          width={size}
          height={size}
          className="rounded-lg object-contain"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex flex-col items-center gap-1.5 p-3 text-center">
          <div className="text-xs font-semibold text-muted-foreground">QR code offline</div>
          <div className="font-mono text-[11px] font-bold text-primary break-all">
            {cleanUpi}
          </div>
        </div>
      )}
      <div className="mt-2 text-[11px] font-semibold text-ink">
        Scan &amp; Pay via UPI
      </div>
      <div className="text-[10px] text-muted-foreground">
        GPay · PhonePe · Paytm · BHIM
      </div>
      <div className="mt-0.5 font-mono text-[10px] font-medium text-primary">
        {cleanUpi}
      </div>
    </div>
  )
}
