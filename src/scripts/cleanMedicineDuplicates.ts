import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'
import config from '../payload.config'

export async function cleanMedicineDuplicates() {
  console.log('--- Starting Medicine Deduplication Task ---')

  // 1. Deduplicate CSV Catalog File
  const csvPath = path.join(process.cwd(), 'docs', 'Indian_Essential_Medicines_Catalog.csv')
  if (fs.existsSync(csvPath)) {
    const text = fs.readFileSync(csvPath, 'utf8')
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const header = lines[0]
    const seen = new Set<string>()
    const cleanLines = [header]

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^"|"$/g, ''))
      const brandName = parts[0]?.toLowerCase()
      if (brandName && !seen.has(brandName)) {
        seen.add(brandName)
        cleanLines.push(lines[i])
      }
    }

    fs.writeFileSync(csvPath, cleanLines.join('\n'), 'utf8')
    console.log(`[CSV Cleaned] Original: ${lines.length} lines -> Deduplicated: ${cleanLines.length} lines (Removed ${lines.length - cleanLines.length} duplicate CSV rows).`)
  }

  // 2. Deduplicate MongoDB Database Collection
  try {
    const payload = await getPayload({ config: await config })
    const db = (payload.db as any)?.connection?.db || (payload.db as any)?.collections?.medicines?.collection?.db

    if (db) {
      console.log('Querying MongoDB for duplicate medicine documents...')
      const duplicates = await db
        .collection('medicines')
        .aggregate([
          {
            $group: {
              _id: { brandName: '$brandName', strength: '$strength' },
              ids: { $push: '$_id' },
              count: { $sum: 1 },
            },
          },
          { $match: { count: { $gt: 1 } } },
        ])
        .toArray()

      let totalDeleted = 0
      for (const group of duplicates) {
        const idsToDelete = group.ids.slice(1)
        if (idsToDelete.length > 0) {
          const res = await db.collection('medicines').deleteMany({ _id: { $in: idsToDelete } })
          totalDeleted += res.deletedCount || idsToDelete.length
        }
      }

      const remainingCount = await db.collection('medicines').countDocuments()
      console.log(`[MongoDB Cleaned] Deleted ${totalDeleted} duplicate documents from 'medicines' collection. Remaining unique medicines in DB: ${remainingCount}.`)
    } else {
      console.log('MongoDB connection unavailable or no medicines collection found.')
    }
  } catch (err) {
    console.error('Error during MongoDB deduplication:', err)
  }

  console.log('--- Deduplication Task Finished ---')
}

// Execute if run directly via CLI
if (require.main === module) {
  cleanMedicineDuplicates()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
