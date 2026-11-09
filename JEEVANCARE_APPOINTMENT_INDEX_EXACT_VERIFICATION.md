# JeevanCare — Appointment Index Exact Verification & Fail-Closed Report

**Audit Date:** November 2026
**Files Inspected:**
- [`src/lib/appointmentIndex.ts`](file:///E:/Jeevan_Care/src/lib/appointmentIndex.ts)
- [`src/payload.config.ts`](file:///E:/Jeevan_Care/src/payload.config.ts#L65-L75)
- [`tests/unit/indexFailClosed.spec.ts`](file:///E:/Jeevan_Care/tests/unit/indexFailClosed.spec.ts)

---

## 1. Exact Index Specification

The `uniq_active_slot` index in MongoDB enforces atomic double-booking protection:

```ts
{
  name: 'uniq_active_slot',
  key: { tenant: 1, doctor: 1, start: 1 },
  unique: true,
  partialFilterExpression: { status: { $in: ['scheduled', 'checked-in', 'in-consultation', 'post-consultation'] } }
}
```

---

## 2. Real Production Initializer & Verification Engine

Extracted into [`src/lib/appointmentIndex.ts`](file:///E:/Jeevan_Care/src/lib/appointmentIndex.ts) and invoked by `src/payload.config.ts`:

1. **Inspection without Suppression:** `nativeCollection.indexes()` errors are rethrown immediately.
2. **Exact Spec Comparison (`isIndexExactMatch`):** Compares index name, `unique: true`, key structure `{ tenant: 1, doctor: 1, start: 1 }`, and all 4 partial statuses. Untouched if already exact match!
3. **Safe Stale Index Dropping:** If a stale index with matching name or key exists with different specs, drops stale definition before calling `createIndex`.
4. **Post-Creation Verification:** Re-reads `nativeCollection.indexes()` from MongoDB and verifies all 4 properties. Throws a hard startup error in staging/production (`STAGING=true` or `NODE_ENV=production`) if verification fails.

---

## 3. Unit Test Verification Evidence

* **Spec File:** [`tests/unit/indexFailClosed.spec.ts`](file:///E:/Jeevan_Care/tests/unit/indexFailClosed.spec.ts)
* **Test Suite Outcome:** **9/9 Unit Tests Passed (100%)**. Tests invoke the actual production `initializeAppointmentIndexes()` function using mock collection methods.
