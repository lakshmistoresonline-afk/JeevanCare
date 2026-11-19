// Comprehensive Indian Medicine Bulk Seeder & Search Utility (v3 spec §11.3)
import { getPayloadClient } from '@/lib/auth'
import fs from 'fs'
import path from 'path'

/**
 * Seeds the comprehensive catalog of 49,000+ unique Indian essential and branded medicines into MongoDB.
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

    const seenBrands = new Set<string>()
    const bulkOps: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''))
      const brandName = parts[0]
      if (brandName && !seenBrands.has(brandName)) {
        seenBrands.add(brandName)
        bulkOps.push({
          updateOne: {
            filter: { brandName },
            update: {
              $set: {
                brandName,
                genericName: parts[1] || brandName,
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
      // Deduplicate existing records in MongoDB if multiple duplicates exist
      const duplicates = await db
        .collection('medicines')
        .aggregate([
          { $group: { _id: { brandName: '$brandName' }, ids: { $push: '$_id' }, count: { $sum: 1 } } },
          { $match: { count: { $gt: 1 } } },
        ])
        .toArray()
        .catch(() => [])

      for (const d of duplicates) {
        const idsToDelete = d.ids.slice(1)
        if (idsToDelete.length > 0) {
          await db
            .collection('medicines')
            .deleteMany({ _id: { $in: idsToDelete } })
            .catch(() => {})
        }
      }

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
