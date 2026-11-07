// Comprehensive Indian Medicine Bulk Seeder & Search Utility (v3 spec §11.3)
import { getPayloadClient } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

/**
 * Seeds the comprehensive catalog of 50,000+ Indian essential and branded medicines into MongoDB.
 */
export async function seedFullIndianMedicineCatalog(): Promise<{ ok: boolean; totalSeeded: number; error?: string }> {
  try {
    const payload = await getPayloadClient()
    const csvPath = path.join(process.cwd(), 'docs', 'Indian_Essential_Medicines_Catalog.csv')

    if (!fs.existsSync(csvPath)) {
      return { ok: false, totalSeeded: 0, error: 'Catalog file not found on server.' }
    }

    const text = fs.readFileSync(csvPath, 'utf8')
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

    const bulkOps: any[] = []
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''))
      if (parts.length >= 2 && parts[0]) {
        bulkOps.push({
          updateOne: {
            filter: { brandName: parts[0] },
            update: {
              $set: {
                brandName: parts[0],
                genericName: parts[1] || parts[0],
                category: parts[2] || 'Essential Medicine',
                formulation: parts[3] || 'Tablet',
                strength: parts[4] || 'Standard',
                defaultFrequency: parts[5] || 'od',
                defaultDurationDays: parts[6] ? Number(parts[6]) : 5,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            },
            upsert: true,
          },
        })
      }
    }

    const db = (payload.db as any)?.connection?.db || (payload.db as any)?.collections?.medicines?.collection?.db
    if (db && bulkOps.length > 0) {
      for (let b = 0; b < bulkOps.length; b += 2000) {
        const batch = bulkOps.slice(b, b + 2000)
        await db.collection('medicines').bulkWrite(batch, { ordered: false }).catch(() => {})
      }
    }

    const total = await payload.count({ collection: 'medicines' as any, overrideAccess: true })
    return { ok: true, totalSeeded: total.totalDocs || bulkOps.length }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { ok: false, totalSeeded: 0, error: errorMsg }
  }
}
