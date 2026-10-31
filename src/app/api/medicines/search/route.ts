import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/auth'
import { searchMedicines } from '@/lib/medicineDirectory'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    try {
      const payload = await getPayloadClient()
      const where: any = q
        ? {
            or: [
              { brandName: { like: q } },
              { genericName: { like: q } },
              { category: { like: q } },
            ],
          }
        : {}

      const res = await payload.find({
        collection: 'medicines' as any,
        where,
        limit: 30,
        overrideAccess: true,
      })

      if (res.docs.length > 0) {
        const meds = res.docs.map((m: any) => ({
          id: String(m.id),
          genericName: m.genericName,
          brandName: m.brandName,
          category: m.category || 'General',
          formulation: m.formulation || 'Tablet',
          strength: m.strength || '',
          defaultFrequency: m.defaultFrequency || 'bd',
          defaultDurationDays: m.defaultDurationDays || 5,
        }))
        return NextResponse.json({ ok: true, medicines: meds })
      }
    } catch (_) {
      // Fallback to static directory if db is unseeded or offline
    }

    const fallbackMeds = searchMedicines(q)
    return NextResponse.json({ ok: true, medicines: fallbackMeds })
  } catch (err) {
    return NextResponse.json({ ok: false, medicines: [] }, { status: 500 })
  }
}
