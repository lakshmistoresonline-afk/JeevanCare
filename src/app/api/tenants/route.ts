import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/auth'

export async function GET() {
  try {
    const payload = await getPayloadClient()
    const res = await payload.find({
      collection: 'tenants',
      where: { status: { equals: 'active' } },
      limit: 50,
      overrideAccess: true,
    })

    // Construct explicit public DTOs containing ONLY non-sensitive clinic directory fields
    const publicDocs = res.docs.map((t: any) => ({
      id: String(t.id),
      name: t.name,
      city: t.city || 'Thrissur',
      district: t.district || 'Thrissur',
      state: t.state || 'Kerala',
      phone: t.phone || null,
    }))

    return NextResponse.json({ docs: publicDocs })
  } catch (_err) {
    return NextResponse.json({ docs: [] }, { status: 500 })
  }
}
