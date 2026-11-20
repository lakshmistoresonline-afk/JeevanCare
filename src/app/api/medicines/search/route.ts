import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/auth'
import { searchMedicines } from '@/lib/medicineDirectory'
import { getCachedMedicineQuery, setCachedMedicineQuery } from '@/lib/medicineCache'

export const dynamic = 'force-dynamic'

const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200',
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim()

    // 1. Check in-memory fast cache first (<5ms)
    const cached = getCachedMedicineQuery(q)
    if (cached) {
      return NextResponse.json({ ok: true, medicines: cached, fromCache: true }, { headers: CACHE_HEADERS })
    }

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

      // 2. Select projection to minimize network & memory overhead
      const res = await payload.find({
        collection: 'medicines' as any,
        where,
        limit: 50,
        select: {
          brandName: true,
          genericName: true,
          category: true,
          formulation: true,
          strength: true,
          defaultFrequency: true,
          defaultDurationDays: true,
        },
        overrideAccess: true,
      })

      if (res.docs.length > 0) {
        const seen = new Set<string>()
        const meds: any[] = []

        for (const m of res.docs as any[]) {
          const key = `${(m.brandName || '').toLowerCase().trim()}|${(m.strength || '').toLowerCase().trim()}`
          if (!seen.has(key)) {
            seen.add(key)
            meds.push({
              id: String(m.id),
              genericName: m.genericName,
              brandName: m.brandName,
              category: m.category || 'General',
              formulation: m.formulation || 'Tablet',
              strength: m.strength || '',
              defaultFrequency: m.defaultFrequency || 'bd',
              defaultDurationDays: m.defaultDurationDays || 5,
            })
          }
        }
        setCachedMedicineQuery(q, meds)
        return NextResponse.json({ ok: true, medicines: meds }, { headers: CACHE_HEADERS })
      }
    } catch (_) {
      // Fallback to static directory if db is unseeded or offline
    }

    const fallbackMeds = searchMedicines(q)
    setCachedMedicineQuery(q, fallbackMeds)
    return NextResponse.json({ ok: true, medicines: fallbackMeds }, { headers: CACHE_HEADERS })
  } catch (err) {
    return NextResponse.json({ ok: false, medicines: [] }, { status: 500 })
  }
}
