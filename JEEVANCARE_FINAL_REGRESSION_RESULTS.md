# JeevanCare — Final Regression Test & Build Evidence Report

**Audit Date:** November 2026
**Execution Database:** `jeevancare_test`

---

## 1. Complete Test & Build Execution Log

### A. TypeScript Check (`npx tsc --noEmit`)
* **Command:** `npx tsc --noEmit`
* **Exit Code:** `0`
* **Duration:** `~2 seconds`
* **Result:** **Passed cleanly (0 TypeScript errors)**

---

### B. Automated Test Suite (`npx vitest run`)
* **Command:** `npx vitest run`
* **Exit Code:** `0`
* **Duration:** `450.61 seconds`
* **Result Summary:**
  - **Total Test Files:** **40/40 Passed (100%)**
  - **Total Individual Specs:** **265/265 Passed (100%)**
  - **Failures / Skips / Errors:** **0**

---

### C. Production Build (`npm run build`)
* **Command:** `npm run build`
* **Exit Code:** `0`
* **Duration:** `2.2 minutes`
* **Result Summary:**
  - **App Router Build:** **30 static and dynamic routes compiled cleanly**
  - **Turbopack Status:** `✓ Compiled successfully in 74s`
  - **Page Optimization:** `✓ Finalizing page optimization in 18ms`

---

## 2. Test File Pass Breakdown

- `tests/int/medicalDocuments.int.spec.ts` — **30/30 Passed**
- `tests/int/patientRegistration.int.spec.ts` — **18/18 Passed**
- `tests/int/billing.int.spec.ts` — **20/20 Passed**
- `tests/int/clinicalRecordIntegrity.int.spec.ts` — **22/22 Passed**
- `tests/int/bookingEngine.int.spec.ts` — **11/11 Passed**
- `tests/int/isolation.int.spec.ts` — **10/10 Passed**
- `tests/int/signup.int.spec.ts` — **6/6 Passed**
- `tests/int/passwordReset.int.spec.ts` — **4/4 Passed**
- `tests/int/export.int.spec.ts` — **7/7 Passed**
- `tests/int/approvalEmail.int.spec.ts` — **4/4 Passed**
- `tests/int/monthlyReport.int.spec.ts` — **3/3 Passed**
- `tests/int/walkin.int.spec.ts` — **3/3 Passed**
- `tests/int/patientPortal.int.spec.ts` — **3/3 Passed**
- All 11 Unit Specs (`tests/unit/`) — **100% Passed**
