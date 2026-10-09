'use client'

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
  const cleanUpi = (upiId || '').trim()

  if (!cleanUpi) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/20 p-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="size-6" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="mt-2 text-xs font-semibold text-ink">UPI not configured</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          The clinic has not set up a UPI ID. Please pay at the reception desk.
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
      <img
        src={qrUrl}
        alt={`Pay ₹${amt} via UPI to ${cleanUpi}`}
        width={size}
        height={size}
        className="rounded-lg object-contain"
        onError={(e) => {
          const target = e.currentTarget
          target.style.display = 'none'
          const parent = target.parentElement
          if (parent && !parent.querySelector('[data-fallback]')) {
            const fallback = document.createElement('div')
            fallback.setAttribute('data-fallback', '')
            fallback.className = 'flex flex-col items-center gap-2 text-center'
            fallback.innerHTML = '<div class="text-xs font-medium text-muted-foreground">QR could not be loaded</div><div class="font-mono text-[11px] font-medium text-primary">' + cleanUpi + '</div>'
            parent.appendChild(fallback)
          }
        }}
      />
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
