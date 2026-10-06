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
  const cleanUpi = (upiId || 'jeevancare@upi').trim()
  const cleanName = encodeURIComponent((name || 'Clinic').trim())
  const cleanNote = encodeURIComponent(transactionNote)
  const amt = amount && amount > 0 ? amount.toFixed(2) : '0.00'

  const upiUri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${amt}&cu=INR&tn=${cleanNote}`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(upiUri)}`

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-white p-3 text-center shadow-xs">
      <img
        src={qrUrl}
        alt={`Pay ₹${amt} via UPI`}
        width={size}
        height={size}
        className="rounded-lg object-contain"
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
