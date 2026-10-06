export function waReminderLink({
  phone,
  currency,
  doctorName,
  clinicName,
  dateLabel,
  timeLabel,
}: {
  phone?: string | null
  currency?: string | null
  doctorName: string
  clinicName: string
  dateLabel: string
  timeLabel: string
}): string | undefined {
  if (!phone) return undefined
  const cleanPhone = phone.replace(/[^0-9]/g, '')
  const text = `Hi, reminder for your appointment at ${clinicName} with ${doctorName} on ${dateLabel} at ${timeLabel}.`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
}

export function buildWhatsAppRxMessage({
  patientName,
  doctorName,
  clinicName,
  diagnosis,
  rxUrl,
}: {
  patientName: string
  doctorName?: string | null
  clinicName?: string | null
  diagnosis?: string | null
  rxUrl: string
}): string {
  const text = `Hello ${patientName},\n\nYour prescription from ${doctorName || 'Doctor'} at ${clinicName || 'JeevanCare Clinic'}${diagnosis ? ` for ${diagnosis}` : ''} is ready.\n\n📄 View / Download Prescription:\n${rxUrl}\n\nGet well soon!`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function buildWhatsAppInvoiceMessage({
  patientName,
  invoiceNo,
  amount,
  balanceDue,
  clinicName,
  receiptUrl,
}: {
  patientName: string
  invoiceNo: string
  amount: number
  balanceDue: number
  clinicName?: string | null
  receiptUrl: string
}): string {
  const text = `Hello ${patientName},\n\nYour bill receipt ${invoiceNo} from ${clinicName || 'JeevanCare Clinic'} for ₹${amount.toFixed(2)} is available.${balanceDue > 0 ? ` Outstanding balance: ₹${balanceDue.toFixed(2)}.` : ' Status: Fully Paid.'}\n\n🧾 View / Print Receipt:\n${receiptUrl}`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function buildWhatsAppReminderMessage({
  patientName,
  doctorName,
  clinicName,
  date,
  time,
}: {
  patientName: string
  doctorName?: string | null
  clinicName?: string | null
  date: string
  time: string
}): string {
  const text = `Hello ${patientName},\n\nReminder: You have an upcoming appointment with ${doctorName || 'Doctor'} at ${clinicName || 'JeevanCare Clinic'} on ${date} at ${time}.\n\nPlease arrive 10 minutes prior. Thank you!`
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}
