// Comprehensive Indian Medicine Bulk Seeder & Search Utility (v3 spec §11.3)
import { getPayloadClient } from '@/lib/auth'
import { COMPREHENSIVE_INDIAN_MEDICINES } from './allIndianMedicines'

/**
 * Seeds the comprehensive catalog of Indian essential and branded medicines into MongoDB.
 */
export async function seedFullIndianMedicineCatalog(): Promise<{ ok: boolean; totalSeeded: number; error?: string }> {
  try {
    const payload = await getPayloadClient()
    let count = 0

    for (const med of COMPREHENSIVE_INDIAN_MEDICINES) {
      await payload.create({
        collection: 'medicines' as any,
        overrideAccess: true,
        data: {
          brandName: med.brandName,
          genericName: med.genericName,
          category: med.category,
          formulation: med.formulation,
          strength: med.strength,
          defaultFrequency: med.defaultFrequency,
          defaultDurationDays: med.defaultDurationDays,
        },
      }).catch(() => {})
      count++
    }

    const total = await payload.count({ collection: 'medicines' as any, overrideAccess: true })
    return { ok: true, totalSeeded: total.totalDocs || count }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { ok: false, totalSeeded: 0, error: errorMsg }
  }
}
