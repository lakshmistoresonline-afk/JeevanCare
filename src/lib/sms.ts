// Thin Twilio / WhatsApp Business API wrapper (v3 spec §6.2). SMS/WhatsApp is OPTIONAL
// infrastructure: with no TWILIO_ACCOUNT_SID / WHATSAPP_API_TOKEN the app runs fine
// and senders report `skipped` — graceful degradation, never a crash.

export function smsEnabled(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID || process.env.WHATSAPP_API_TOKEN)
}

export type SendSmsInput = { to: string; message: string }
export type SendSmsResult = { ok: boolean; skipped?: boolean; error?: string }
export type SendSms = (input: SendSmsInput) => Promise<SendSmsResult>

export const sendSms: SendSms = async ({ to, message }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromPhone = process.env.TWILIO_PHONE_NUMBER

  if (!accountSid || !authToken || !fromPhone) {
    return { ok: false, skipped: true }
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: to,
        From: fromPhone,
        Body: message,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      return { ok: false, error: errText || `Twilio HTTP error ${res.status}` }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
