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
    return NextResponse.json({ docs: res.docs })
  } catch (err) {
    return NextResponse.json({ docs: [] }, { status: 500 })
  }
}
