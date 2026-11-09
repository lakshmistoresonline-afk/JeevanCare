import { describe, it, expect, vi } from 'vitest'
import {
  initializeAppointmentIndexes,
  REQUIRED_ACTIVE_SLOT_INDEX,
  areKeysOrderedEqual,
  haveSameFieldSet,
  isIndexExactMatch,
  type CollectionIndexInfo,
  type MongoCollectionInterface,
} from '@/lib/appointmentIndex'

describe('Appointment Index Real Fail-Closed Initializer & Verification Suite', () => {
  const validIndex: CollectionIndexInfo = {
    name: 'uniq_active_slot',
    key: { tenant: 1, doctor: 1, start: 1 },
    unique: true,
    partialFilterExpression: { status: { $in: ['scheduled', 'checked-in', 'in-consultation', 'post-consultation'] } },
  }

  const legacyIndex: CollectionIndexInfo = {
    name: 'tenant_1_doctor_1_start_1',
    key: { tenant: 1, doctor: 1, start: 1 },
    unique: false,
  }

  const staleFilterIndex: CollectionIndexInfo = {
    name: 'uniq_active_slot',
    key: { tenant: 1, doctor: 1, start: 1 },
    unique: true,
    partialFilterExpression: { status: { $in: ['scheduled', 'checked-in'] } },
  }

  it('1. Correct existing index — untouched', async () => {
    const list = [validIndex]
    const mockColl: MongoCollectionInterface = {
      indexes: vi.fn(async () => list),
      createIndex: vi.fn(async () => 'uniq_active_slot'),
      dropIndex: vi.fn(async () => ({ ok: 1 })),
    }

    const res = await initializeAppointmentIndexes(mockColl, true)

    expect(res.ok).toBe(true)
    expect(res.action).toBe('UNTOUCHED')
    expect(mockColl.indexes).toHaveBeenCalledTimes(1)
    expect(mockColl.dropIndex).not.toHaveBeenCalled()
    expect(mockColl.createIndex).not.toHaveBeenCalled()
  })

  it('2. Missing index — created and verified', async () => {
    let callCount = 0
    const mockColl: MongoCollectionInterface = {
      indexes: vi.fn(async () => {
        callCount++
        return callCount === 1 ? [] : [validIndex]
      }),
      createIndex: vi.fn(async () => 'uniq_active_slot'),
      dropIndex: vi.fn(async () => ({ ok: 1 })),
    }

    const res = await initializeAppointmentIndexes(mockColl, true)

    expect(res.ok).toBe(true)
    expect(res.action).toBe('CREATED')
    expect(mockColl.dropIndex).not.toHaveBeenCalled()
    expect(mockColl.createIndex).toHaveBeenCalledWith(
      REQUIRED_ACTIVE_SLOT_INDEX.key,
      expect.objectContaining({
        unique: true,
        name: 'uniq_active_slot',
        partialFilterExpression: { status: { $in: REQUIRED_ACTIVE_SLOT_INDEX.partialStatuses } },
      }),
    )
    expect(mockColl.indexes).toHaveBeenCalledTimes(2)
  })

  it('3. Incorrect compound-key field order — detected as conflict and not auto-dropped if non-legacy', async () => {
    const reversedKeysIndex: CollectionIndexInfo = {
      name: 'custom_reversed_keys_index',
      key: { doctor: 1, tenant: 1, start: 1 },
      unique: true,
      partialFilterExpression: { status: { $in: ['scheduled'] } },
    }
    const mockColl: MongoCollectionInterface = {
      indexes: vi.fn(async () => [reversedKeysIndex]),
      createIndex: vi.fn(async () => 'uniq_active_slot'),
      dropIndex: vi.fn(async () => ({ ok: 1 })),
    }

    expect(areKeysOrderedEqual(reversedKeysIndex.key!, REQUIRED_ACTIVE_SLOT_INDEX.key)).toBe(false)
    expect(haveSameFieldSet(reversedKeysIndex.key!, REQUIRED_ACTIVE_SLOT_INDEX.key)).toBe(true)

    await expect(initializeAppointmentIndexes(mockColl, true)).rejects.toThrow('Conflicting index \'custom_reversed_keys_index\'')
    expect(mockColl.dropIndex).not.toHaveBeenCalled()
  })

  it('4. Stale uniq_active_slot index — throws diagnostic error and does NOT automatically drop index', async () => {
    const mockColl: MongoCollectionInterface = {
      indexes: vi.fn(async () => [staleFilterIndex]),
      createIndex: vi.fn(async () => 'uniq_active_slot'),
      dropIndex: vi.fn(async () => ({ ok: 1 })),
    }

    await expect(initializeAppointmentIndexes(mockColl, true)).rejects.toThrow('Conflicting index \'uniq_active_slot\'')
    expect(mockColl.dropIndex).not.toHaveBeenCalled()
  })

  it('5. Legacy tenant_1_doctor_1_start_1 index — throws diagnostic error and does NOT automatically drop index', async () => {
    const mockColl: MongoCollectionInterface = {
      indexes: vi.fn(async () => [legacyIndex]),
      createIndex: vi.fn(async () => 'uniq_active_slot'),
      dropIndex: vi.fn(async () => ({ ok: 1 })),
    }

    await expect(initializeAppointmentIndexes(mockColl, true)).rejects.toThrow('Conflicting index \'tenant_1_doctor_1_start_1\'')
    expect(mockColl.dropIndex).not.toHaveBeenCalled()
  })

  it('6. Index inspection failure — rejects initialization without suppression', async () => {
    const mockColl: MongoCollectionInterface = {
      indexes: vi.fn(async () => {
        throw new Error('Database inspection connection timeout')
      }),
      createIndex: vi.fn(async () => 'uniq_active_slot'),
      dropIndex: vi.fn(async () => ({ ok: 1 })),
    }

    await expect(initializeAppointmentIndexes(mockColl, true)).rejects.toThrow('Database inspection connection timeout')
  })

  it('7. Index creation failure — rejects initialization without suppression', async () => {
    const mockColl: MongoCollectionInterface = {
      indexes: vi.fn(async () => []),
      createIndex: vi.fn(async () => {
        throw new Error('MongoServerError: Index creation aborted by admin')
      }),
      dropIndex: vi.fn(async () => ({ ok: 1 })),
    }

    await expect(initializeAppointmentIndexes(mockColl, true)).rejects.toThrow('Index creation aborted')
  })

  it('8. Post-creation verification failure in production/staging — throws critical error', async () => {
    const mockColl: MongoCollectionInterface = {
      indexes: vi.fn(async () => []), // Returns empty list both before and after
      createIndex: vi.fn(async () => 'uniq_active_slot'),
      dropIndex: vi.fn(async () => ({ ok: 1 })),
    }

    await expect(initializeAppointmentIndexes(mockColl, true)).rejects.toThrow(
      'CRITICAL DATABASE INTEGRITY ERROR: Required \'uniq_active_slot\' index verification failed.',
    )
  })

  it('9. Missing appointments collection — fails startup in staging / production', async () => {
    await expect(initializeAppointmentIndexes(null as any, true)).rejects.toThrow(
      'Appointments collection is unavailable for index initialization.',
    )
  })

  it('10. Idempotency: repeated initialization on valid index is a no-op', async () => {
    const mockIndexes = [validIndex]
    const mockColl: MongoCollectionInterface = {
      indexes: vi.fn(async () => mockIndexes),
      createIndex: vi.fn(async () => 'uniq_active_slot'),
      dropIndex: vi.fn(async () => ({ ok: 1 })),
    }

    const run1 = await initializeAppointmentIndexes(mockColl, true)
    const run2 = await initializeAppointmentIndexes(mockColl, true)

    expect(run1.action).toBe('UNTOUCHED')
    expect(run2.action).toBe('UNTOUCHED')
    expect(mockColl.createIndex).not.toHaveBeenCalled()
    expect(mockColl.dropIndex).not.toHaveBeenCalled()
  })
})
