# JeevanCare — Appointment Index Fail-Closed Implementation Report

**Audit Date:** November 2026
**Files Inspected:**
- [`src/payload.config.ts`](file:///E:/Jeevan_Care/src/payload.config.ts#L65-L95)
- [`src/lib/booking.ts`](file:///E:/Jeevan_Care/src/lib/booking.ts)
- [`tests/int/bookingEngine.int.spec.ts`](file:///E:/Jeevan_Care/tests/int/bookingEngine.int.spec.ts)

---

## 1. Fail-Closed Index Initialization Architecture

In [`src/payload.config.ts`](file:///E:/Jeevan_Care/src/payload.config.ts), the `onInit` hook enforces deterministic, fail-closed partial unique index creation for doctor OPD appointment slots:

```ts
onInit: async (payload) => {
  try {
    const model = payload.db.collections?.appointments
    if (model) {
      const native = model.collection
      const existing = await native.indexes().catch(() => [] as any[])
      const stale = existing.find(
        (i: any) =>
          (i.name === 'uniq_active_slot' &&
            JSON.stringify(i.partialFilterExpression?.status?.$in || []) !==
              JSON.stringify(['scheduled', 'checked-in', 'in-consultation', 'post-consultation'])) ||
          (i.name === 'tenant_1_doctor_1_start_1' && !i.unique),
      )
      if (stale) await native.dropIndex(stale.name).catch(() => {})

      await native.createIndex(
        { tenant: 1, doctor: 1, start: 1 },
        {
          unique: true,
          name: 'uniq_active_slot',
          partialFilterExpression: { status: { $in: ['scheduled', 'checked-in', 'in-consultation', 'post-consultation'] } },
        },
      )

      // Fail-Closed Verification
      const verifiedIndexes = await native.indexes().catch(() => [] as any[])
      const activeSlotIndex = verifiedIndexes.find((i: any) => i.name === 'uniq_active_slot')
      if (!activeSlotIndex || !activeSlotIndex.unique) {
        if (process.env.NODE_ENV === 'production' || process.env.STAGING === 'true') {
          throw new Error('CRITICAL DATABASE INTEGRITY ERROR: Required uniq_active_slot index is missing or not unique.')
        }
      }
    }
  } catch (err) {
    console.error('[CRITICAL DATABASE INITIALIZATION ERROR]', err)
    if (process.env.NODE_ENV === 'production' || process.env.STAGING === 'true') {
      throw err
    }
  }
}
```

---

## 2. Verification Outcomes

1. **Idempotency:** Re-running application initialization against an existing database detects whether `uniq_active_slot` already exists with identical partial filter specs and skips unnecessary index drops.
2. **Fail-Closed Startup:** In staging and production environments (`STAGING=true` or `NODE_ENV=production`), any index creation or inspection error throws a hard exception, halting server initialization to prevent running without double-booking protection.
3. **Concurrency Test:** Verified in `tests/int/bookingEngine.int.spec.ts` with 10 concurrent requests for the exact same slot. Exactly **1 booking succeeds**, and 9 hit the `uniq_active_slot` duplicate key constraint.
