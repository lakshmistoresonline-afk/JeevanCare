# JeevanCare — Appointment Index Migration & Concurrency Review

**Audit Date:** November 2026
**Files Inspected:**
- [`src/payload.config.ts`](file:///E:/Jeevan_Care/src/payload.config.ts#L60-L90)
- [`src/lib/booking.ts`](file:///E:/Jeevan_Care/src/lib/booking.ts)
- [`src/collections/Appointments.ts`](file:///E:/Jeevan_Care/src/collections/Appointments.ts)

---

## 1. Index Migration Analysis (MongoDB Error 86)

### A. Root Cause Analysis
During initial index creation, MongoDB threw Error 86 (`IndexKeySpecsConflict`) because `native.createIndex` attempted to create `uniq_active_slot` with a new partial filter expression (`['scheduled', 'checked-in', 'in-consultation', 'post-consultation']`) while an index named `uniq_active_slot` with an older expression (`['scheduled', 'checked-in']`) was already present in the database.

---

### B. Idempotent Migration Implementation
In `src/payload.config.ts`, the `onInit` hook now inspects existing Mongoose collection indexes and drops stale definitions prior to index creation:

```ts
onInit: async (payload) => {
  try {
    const model = payload.db.collections?.appointments
    if (model) {
      const native = model.collection
      const existing = await native.indexes().catch(() => [] as any[])
      const stale = existing.find(
        (i: any) => i.name === 'uniq_active_slot' || (i.name === 'tenant_1_doctor_1_start_1' && !i.unique),
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
    }
  } catch (err) {
    console.error('Failed to create database indexes:', err)
  }
}
```

---

## 2. Concurrency & Race Condition Safeguards

* **Same Doctor, Same Time Slot:** Tested in `tests/int/bookingEngine.int.spec.ts` with 10 parallel booking requests for the exact same start time. Exactly **1 booking succeeds**, while the remaining 9 hit the `uniq_active_slot` duplicate key constraint and abort cleanly.
* **Different Doctors, Same Time Slot:** Permitted (no index conflict).
* **Cancelled Slot Rebooking:** When an appointment is cancelled (`status: 'cancelled'`), it is excluded from the `uniq_active_slot` partial filter expression, freeing the slot for immediate rebooking.
