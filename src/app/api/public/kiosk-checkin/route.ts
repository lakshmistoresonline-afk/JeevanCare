import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { tenantId, phone, mrn, name } = body

    if (!tenantId) {
      return NextResponse.json({ ok: false, message: 'Clinic selection is required.' }, { status: 400 })
    }

    const payload = await getPayloadClient()

    // 1. Search existing patient by phone or MRN
    const cleanPhone = (phone || '').replace(/[^0-9+]/g, '')
    let patient: any = null

    if (mrn) {
      const pRes = await payload.find({
        collection: 'patients',
        where: { tenant: { equals: tenantId }, mrn: { equals: mrn.trim() } },
        limit: 1,
        overrideAccess: true,
      })
      patient = pRes.docs[0]
    }

    if (!patient && cleanPhone) {
      const pRes = await payload.find({
        collection: 'patients',
        where: { tenant: { equals: tenantId }, phone: { equals: cleanPhone } },
        limit: 1,
        overrideAccess: true,
      })
      patient = pRes.docs[0]
    }

    // Auto-register patient if new
    if (!patient) {
      patient = await payload.create({
        collection: 'patients',
        overrideAccess: true,
        data: {
          tenant: tenantId,
          name: name || 'Kiosk Walk-In Patient',
          phone: cleanPhone || '+919847000000',
          gender: 'other',
          ageYears: 30,
        } as never,
      })
    }

    // 2. Assign today's walk-in appointment and token number
    const today = new Date().toISOString().slice(0, 10)
    const existingAppts = await payload.count({
      collection: 'appointments',
      where: { tenant: { equals: tenantId }, tokenDay: { equals: today } },
      overrideAccess: true,
    })

    const tokenNumber = `T-${String(existingAppts.totalDocs + 1).padStart(2, '0')}`
    const appt = await payload.create({
      collection: 'appointments',
      overrideAccess: true,
      data: {
        tenant: tenantId,
        patient: patient.id,
        doctor: (await payload.find({ collection: 'users', where: { tenant: { equals: tenantId }, role: { equals: 'doctor' } }, limit: 1, overrideAccess: true })).docs[0]?.id || patient.id,
        start: new Date().toISOString(),
        end: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        durationMins: 15,
        status: 'checked-in',
        isWalkIn: true,
        tokenNumber,
        tokenDay: today,
        reason: 'Self-Service Kiosk Check-In',
      } as never,
    })

    return NextResponse.json({
      ok: true,
      tokenNumber,
      patientName: patient.name,
      appointmentId: String(appt.id),
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, message: err.message || 'Check-in failed.' }, { status: 500 })
  }
}
