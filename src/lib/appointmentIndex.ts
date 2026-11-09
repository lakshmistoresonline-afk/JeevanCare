// Appointment Index Fail-Closed Initializer & Verification Engine (v3 spec §8.4)

export const REQUIRED_ACTIVE_SLOT_INDEX = {
  name: 'uniq_active_slot',
  key: { tenant: 1, doctor: 1, start: 1 },
  unique: true,
  partialStatuses: ['scheduled', 'checked-in', 'in-consultation', 'post-consultation'],
} as const

export const KNOWN_LEGACY_INDEX_NAMES = ['uniq_active_slot', 'tenant_1_doctor_1_start_1'] as const

export type CollectionIndexInfo = {
  name?: string
  key?: Record<string, any>
  unique?: boolean
  partialFilterExpression?: Record<string, any>
}

export interface MongoCollectionInterface {
  indexes(options?: unknown): Promise<CollectionIndexInfo[]>
  createIndex(keys: Record<string, any>, options?: Record<string, unknown>): Promise<string>
  dropIndex(name: string, options?: unknown): Promise<unknown>
}

/**
 * Compares two index key specifications to verify exact ordered sequence of field names and direction (e.g. { tenant: 1, doctor: 1, start: 1 }).
 */
export function areKeysOrderedEqual(k1?: Record<string, any>, k2?: Record<string, any>): boolean {
  if (!k1 || !k2) return false
  const keys1 = Object.keys(k1)
  const keys2 = Object.keys(k2)
  if (keys1.length !== keys2.length) return false

  for (let i = 0; i < keys1.length; i++) {
    if (keys1[i] !== keys2[i]) return false
    if (k1[keys1[i]] !== k2[keys2[i]]) return false
  }
  return true
}

/**
 * Checks whether two index key specifications contain the exact same set of field names regardless of field ordering.
 * Used for conflict detection across index permutations (e.g. { doctor: 1, tenant: 1, start: 1 }).
 */
export function haveSameFieldSet(k1?: Record<string, any>, k2?: Record<string, any>): boolean {
  if (!k1 || !k2) return false
  const keys1 = Object.keys(k1)
  const keys2 = Object.keys(k2)
  if (keys1.length !== keys2.length) return false
  const set2 = new Set(keys2)
  return keys1.every((k) => set2.has(k))
}

/**
 * Strictly verifies whether a MongoDB index match fulfills the complete required active slot index specification:
 * - Exact index name `uniq_active_slot`
 * - Exact ordered key sequence `{ tenant: 1, doctor: 1, start: 1 }`
 * - `unique: true`
 * - Exact partial filter statuses `['scheduled', 'checked-in', 'in-consultation', 'post-consultation']`
 * - No additional partial filter fields or operators.
 */
export function isIndexExactMatch(idx: CollectionIndexInfo): boolean {
  if (!idx || !idx.name) return false
  if (idx.name !== REQUIRED_ACTIVE_SLOT_INDEX.name) return false
  if (idx.unique !== true) return false
  if (!idx.key || !areKeysOrderedEqual(idx.key, REQUIRED_ACTIVE_SLOT_INDEX.key)) return false

  const pfe = idx.partialFilterExpression
  if (!pfe || typeof pfe !== 'object') return false

  const pfeKeys = Object.keys(pfe)
  if (pfeKeys.length !== 1 || pfeKeys[0] !== 'status') return false

  const statusObj = pfe.status
  if (!statusObj || typeof statusObj !== 'object') return false

  const statusKeys = Object.keys(statusObj)
  if (statusKeys.length !== 1 || statusKeys[0] !== '$in') return false

  const inStatuses = statusObj.$in
  if (!Array.isArray(inStatuses)) return false

  if (inStatuses.length !== REQUIRED_ACTIVE_SLOT_INDEX.partialStatuses.length) return false

  // Reject duplicates or unapproved status values
  const uniqueSet = new Set(inStatuses)
  if (uniqueSet.size !== REQUIRED_ACTIVE_SLOT_INDEX.partialStatuses.length) return false

  return REQUIRED_ACTIVE_SLOT_INDEX.partialStatuses.every((s) => uniqueSet.has(s as any))
}

/**
 * Initializes and verifies the required `uniq_active_slot` partial unique index on appointments.
 * Throws an exception in staging/production if verification fails or index creation fails.
 * Automatic index deletion is strictly PROHIBITED to prevent destructive data operations.
 */
export async function initializeAppointmentIndexes(
  nativeCollection: MongoCollectionInterface,
  isProductionOrStaging: boolean = false,
): Promise<{ ok: boolean; action: 'UNTOUCHED' | 'CREATED' }> {
  if (!nativeCollection || typeof nativeCollection.indexes !== 'function') {
    const errorMsg = 'CRITICAL DATABASE INTEGRITY ERROR: Appointments collection is unavailable for index initialization.'
    if (isProductionOrStaging) throw new Error(errorMsg)
    return { ok: false, action: 'CREATED' }
  }

  // 1. Inspect existing indexes — Do NOT suppress inspection errors!
  const existingIndexes = await nativeCollection.indexes()

  const exactMatch = existingIndexes.find(isIndexExactMatch)
  if (exactMatch) {
    return { ok: true, action: 'UNTOUCHED' }
  }

  // Detect matching key pattern or index name conflicts
  const keyConflict = existingIndexes.find(
    (i: CollectionIndexInfo) => i.key && haveSameFieldSet(i.key, REQUIRED_ACTIVE_SLOT_INDEX.key) && !isIndexExactMatch(i),
  )

  const nameMatch = existingIndexes.find((i: CollectionIndexInfo) => i.name === REQUIRED_ACTIVE_SLOT_INDEX.name && !isIndexExactMatch(i))

  const conflictingIndex = nameMatch || keyConflict

  if (conflictingIndex) {
    const indexName = conflictingIndex.name || 'unnamed'
    const indexKey = JSON.stringify(conflictingIndex.key || {})
    const isUnique = Boolean(conflictingIndex.unique)
    const pfe = JSON.stringify(conflictingIndex.partialFilterExpression || {})

    const diagnosticMessage =
      `[Index Conflict Error] Conflicting index '${indexName}' found on appointments collection.\n` +
      `  - Existing Index Specs: Name: '${indexName}', Key: ${indexKey}, Unique: ${isUnique}, PartialFilter: ${pfe}\n` +
      `  - Required Specs: Name: '${REQUIRED_ACTIVE_SLOT_INDEX.name}', Key: ${JSON.stringify(REQUIRED_ACTIVE_SLOT_INDEX.key)}, Unique: true, PartialFilter: { status: { $in: ${JSON.stringify(REQUIRED_ACTIVE_SLOT_INDEX.partialStatuses)} } }\n` +
      `  - Migration Action Required: Automatic index deletion is strictly disabled. Please execute a manual migration command to safely drop '${indexName}' before restarting application:\n` +
      `    db.collection('appointments').dropIndex('${indexName}')`

    throw new Error(diagnosticMessage)
  }

  // 2. Create the required unique index
  await nativeCollection.createIndex(
    REQUIRED_ACTIVE_SLOT_INDEX.key,
    {
      unique: true,
      name: REQUIRED_ACTIVE_SLOT_INDEX.name,
      partialFilterExpression: { status: { $in: [...REQUIRED_ACTIVE_SLOT_INDEX.partialStatuses] } },
    },
  )

  // 3. Post-creation verification — Re-read index list from database!
  const verifiedIndexes = await nativeCollection.indexes()
  const activeSlotIndex = verifiedIndexes.find(isIndexExactMatch)

  if (!activeSlotIndex) {
    const errorMsg = `CRITICAL DATABASE INTEGRITY ERROR: Required '${REQUIRED_ACTIVE_SLOT_INDEX.name}' index verification failed.`
    if (isProductionOrStaging) {
      throw new Error(errorMsg)
    }
    return { ok: false, action: 'CREATED' }
  }

  return { ok: true, action: 'CREATED' }
}
