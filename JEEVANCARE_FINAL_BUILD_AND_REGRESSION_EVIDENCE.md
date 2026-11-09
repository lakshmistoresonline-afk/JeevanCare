# JeevanCare — Final Build & Test Regression Evidence Log

**Date:** November 2026
**Execution Environment:** Local Test Harness (`jeevancare_test`)

---

## 1. Fresh Execution Log Evidence

### A. TypeScript Type Check (`npx tsc --noEmit`)
* **Command:** `npx tsc --noEmit`
* **Exit Code:** `0`
* **Duration:** `~2 seconds`
* **Output Log:** `(empty / 0 errors)`

---

### B. Automated Test Suite (`npx vitest run`)
* **Command:** `npx vitest run`
* **Exit Code:** `0`
* **Duration:** `549.10 seconds`
* **Test Summary:**
  - **Test Files:** **40 passed (40 total)**
  - **Individual Tests:** **265 passed (265 total)**
  - **Failures / Skips:** **0**

---

### C. Production Build (`npm run build`)
* **Command:** `npm run build`
* **Exit Code:** `0`
* **Duration:** `2.2 minutes`
* **Build Summary:**
  - **App Router Compilation:** **30 static & dynamic routes compiled cleanly**
  - **Turbopack Status:** `✓ Compiled successfully in 2.2min`
  - **Page Optimization:** `✓ Finalizing page optimization in 17ms`

---

## 2. Test Suite Breakdown

- `tests/int/medicalDocuments.int.spec.ts` — 30/30 Passed
- `tests/int/patientRegistration.int.spec.ts` — 18/18 Passed
- `tests/int/billing.int.spec.ts` — 20/20 Passed
- `tests/int/clinicalRecordIntegrity.int.spec.ts` — 22/22 Passed
- `tests/int/bookingEngine.int.spec.ts` — 11/11 Passed
- `tests/int/isolation.int.spec.ts` — 10/10 Passed
- `tests/int/signup.int.spec.ts` — 6/6 Passed
- `tests/int/passwordReset.int.spec.ts` — 4/4 Passed
- `tests/int/export.int.spec.ts` — 7/7 Passed
- `tests/int/approvalEmail.int.spec.ts` — 4/4 Passed
- `tests/int/monthlyReport.int.spec.ts` — 3/3 Passed
- `tests/int/walkin.int.spec.ts` — 3/3 Passed
- `tests/int/patientPortal.int.spec.ts` — 3/3 Passed
- All 11 Unit Specs (`tests/unit/`) — 100% Passed
