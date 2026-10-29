import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/auth'
import { sendSms } from '@/lib/sms'
import { sendEmail } from '@/lib/email'
import { validateProductionSecret } from '@/lib/secretValidation'
import { escapeHtml } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    const check = validateProductionSecret('CRON_SECRET', cronSecret, 32)
    if (!check.ok || !cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: 'Unauthorized cron request' }, { status: 401 })
    }

    const payload = await getPayloadClient()
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const upcomingRes = await payload.find({
      collection: 'appointments',
      where: {
        status: { equals: 'scheduled' },
        start: {
          greater_than_equal: now.toISOString(),
          less_than_equal: tomorrow.toISOString(),
        },
      },
      limit: 50,
      depth: 1,
      overrideAccess: true,
    })

    let dispatchedCount = 0
    for (const appt of upcomingRes.docs as any[]) {
      const patient = appt.patient
      if (patient?.phone) {
        await sendSms({
          to: patient.phone,
          message: `Reminder: You have an upcoming appointment at JeevanCare on ${new Date(appt.start).toLocaleString('en-IN')}.`,
        })
        dispatchedCount++
      }
      if (patient?.email) {
        const safeName = escapeHtml(patient.name)
        await sendEmail({
          to: patient.email,
          subject: 'Appointment Reminder - JeevanCare',
          html: `<p>Dear ${safeName},</p><p>You have a scheduled appointment at JeevanCare on <strong>${new Date(appt.start).toLocaleString('en-IN')}</strong>.</p>`,
        })
      }
    }

    return NextResponse.json({ ok: true, remindersDispatched: dispatchedCount })
  } catch (err) {
    return NextResponse.json({ ok: false, error: 'Internal server error during appointment reminders execution' }, { status: 500 })
  }
}
