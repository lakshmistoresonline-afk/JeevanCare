# JeevanCare — Appointment Index Fail-Closed & Migration Review

**Audit Date:** November 2026
**Files Inspected:**
- [`src/payload.config.ts`](file:///E:/Jeevan_Care/src/payload.config.ts#L65-L95)
- [`src/lib/booking.ts`](file:///E:/Jeevan_Care/src/lib/booking.ts)

---

## 1. Current Index Migration Behavior Analysis

### A. Code Inspection (`src/payload.config.ts`)
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

## 2. Findings & Recommendations

### Finding IND-001 (P2): Fail-Open Error Suppression during Initialization
* **Severity:** P2 (Medium - Initialization Hardening)
* **Code Evidence:** The outer `try ... catch (err)` block in `onInit` logs errors to `console.error` without throwing. If index creation fails due to permission errors or underlying MongoDB connection issues, application startup completes while index protection is absent.
* **Recommended Staging Migration Design:**
  1. **Strict Startup Check:** Replace `console.error` in production/staging environments with a hard startup exception (`throw new Error(...)`) if `uniq_active_slot` cannot be verified.
  2. **Post-Creation Verification:** Query `native.indexes()` after creation to verify `uniq_active_slot` exists and its `partialFilterExpression` contains all 4 active statuses before completing startup.
  3. **Idempotency:** Drop stale definitions cleanly prior to index re-creation.
