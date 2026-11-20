import { searchMedicines, type MedicineEntry } from './medicineDirectory'

type CacheItem = {
  data: MedicineEntry[]
  expiresAt: number
}

const cache = new Map<string, CacheItem>()
const TTL_MS = 5 * 60 * 1000 // 5-minute TTL

export function getCachedMedicineQuery(query: string): MedicineEntry[] | null {
  const key = query.toLowerCase().trim()
  const item = cache.get(key)
  if (item && item.expiresAt > Date.now()) {
    return item.data
  }
  if (item) {
    cache.delete(key)
  }
  return null
}

export function setCachedMedicineQuery(query: string, data: MedicineEntry[]): void {
  const key = query.toLowerCase().trim()
  cache.set(key, {
    data,
    expiresAt: Date.now() + TTL_MS,
  })
}
