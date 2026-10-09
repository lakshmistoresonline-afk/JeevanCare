import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/auth'
import { formatDoctorName } from '@/lib/utils'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: 'Doctor ID is required' }, { status: 400 })
  }

  try {
    const payload = await getPayloadClient()
    const doc = (await payload.findByID({
      collection: 'users',
      id,
      depth: 1,
      overrideAccess: true,
    })) as any

    if (!doc || doc.role !== 'doctor' || doc.active === false) {
      return NextResponse.json({ error: 'Doctor not found or inactive' }, { status: 404 })
    }

    const tenantObj = typeof doc.tenant === 'object' ? doc.tenant : null

    // Exclude doctors belonging to suspended or pending clinics from public visibility
    if (tenantObj && tenantObj.status && tenantObj.status !== 'active') {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
    }

    // Expose ONLY safe public fields (no email, phone, passwords, or tenant internals)
    return NextResponse.json({
      id: String(doc.id),
      name: formatDoctorName(doc.name),
      qualification: doc.qualification || null,
      specialty: doc.specialty || 'General Practitioner',
      consultationFee: doc.consultationFee ?? null,
      photoUrl: doc.photoUrl || null,
      tenant: tenantObj
        ? {
            id: String(tenantObj.id),
            name: tenantObj.name,
            city: tenantObj.city || null,
            state: tenantObj.state || null,
          }
        : null,
    })
  } catch (_err) {
    return NextResponse.json({ error: 'Doctor not found' }, { status: 404 })
  }
}
