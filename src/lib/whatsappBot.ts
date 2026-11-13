// WhatsApp Automated Bot Engine for Patient Token Lookup, Rx PDF, & Reminders
export type BotResponse = {
  reply: string
  actionUrl?: string
  mediaType?: 'pdf' | 'location' | 'text'
}

export function processWhatsAppBotMessage(
  incomingText: string,
  context?: {
    patientName?: string
    tokenNumber?: string
    doctorName?: string
    waitTimeMins?: number
    prescriptionUrl?: string
    clinicName?: string
  }
): BotResponse {
  const text = incomingText.trim().toUpperCase()
  const pName = context?.patientName || 'Patient'
  const cName = context?.clinicName || 'JeevanCare Swaraj Centre'

  if (text.includes('TOKEN') || text.includes('QUEUE') || text.includes('STATUS')) {
    const token = context?.tokenNumber || 'T-04'
    const doc = context?.doctorName || 'Dr. Sabitha Krishnamoorthy'
    const wait = context?.waitTimeMins ?? 12
    return {
      reply: `🏥 *${cName} OPD Queue Update*\n\nHello *${pName}*,\nYour active OPD Token Number is *#${token}*.\n👨‍⚕️ Doctor: ${doc}\n⏳ Estimated wait time: *${wait} minutes*.\n\nPlease remain seated in the waiting lobby. We will notify you when your room is ready!`,
      mediaType: 'text',
    }
  }

  if (text.includes('RX') || text.includes('PRESCRIPTION') || text.includes('MEDICINE')) {
    const rxUrl = context?.prescriptionUrl || 'https://jeevan-care-sooty.vercel.app/print/prescription/visit-01'
    return {
      reply: `📄 *${cName} Digital Prescription (Rx)*\n\nHello *${pName}*,\nYour latest verified digital prescription is ready.\n\nClick below to download or print your A5/A4 prescription PDF:`,
      actionUrl: rxUrl,
      mediaType: 'pdf',
    }
  }

  if (text.includes('BOOK') || text.includes('APPOINTMENT')) {
    return {
      reply: `📅 *Online Slot Booking Portal*\n\nHello *${pName}*,\nBook your next consultation slot online in 1 tap:`,
      actionUrl: 'https://jeevan-care-sooty.vercel.app/patient/appointments/book',
      mediaType: 'text',
    }
  }

  return {
    reply: `👋 *Welcome to ${cName} WhatsApp Assistant*\n\nReply with one of the options below:\n• *TOKEN* — Check your live OPD queue token & wait time\n• *RX* — Download your latest digital prescription PDF\n• *BOOK* — Book a new consultation slot`,
  }
}
