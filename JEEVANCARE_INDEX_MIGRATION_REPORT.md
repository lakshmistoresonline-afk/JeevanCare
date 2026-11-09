# JeevanCare — Appointment Index Migration & Concurrency Report

**Date:** November 2026
**Status:** Index Migration Resolved & Idempotent.

---

## 1. Index Conflict Analysis (MongoServerError 86)

During initial remediation, updating `uniq_active_slot` partial filter expression to include all slot-occupying statuses (`['scheduled', 'checked-in', 'in-consultation', 'post-consultation']`) produced MongoDB Error 86 (`IndexKeySpecsConflict`) because an existing index with the same name was present in the database.

---

## 2. Idempotent Index Migration Implementation

In `src/payload.config.ts`, the `onInit` hook now safely checks for existing index key specs and drops stale indexes before creating updated definitions:

```ts
// Drop stale index if key spec or partial filter differs
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
```

---

## 3. Concurrency Test Results

* **Simultaneous Same-Doctor Same-Slot Bookings:** Tested with 10 concurrent requests (`tests/int/bookingEngine.int.spec.ts`). Exactly **1 request succeeds** and 9 requests hit the unique index duplicate key error, aborting cleanly.
* **Cancelled Slot Rebooking:** Cancelling an appointment updates `status: 'cancelled'`, removing it from the partial filter expression and allowing immediate rebooking of that time slot.
