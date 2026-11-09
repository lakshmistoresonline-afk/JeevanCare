# JeevanCare — Final Regression Evidence & Command Execution Log

**Audit Date:** November 2026
**Execution Environment:** Local Test Harness (`jeevancare_test`)

---

## 1. Recorded Execution Logs & Exit Codes

### A. Real Index Fail-Closed Unit Test Suite (`npx vitest run tests/unit/indexFailClosed.spec.ts`)
* **Command:** `npx vitest run tests/unit/indexFailClosed.spec.ts`
* **Exit Code:** `0`
* **Duration:** `762 ms`
* **Result:** **9/9 Tests Passed (100%)**

---

### B. TypeScript Check (`npx tsc --noEmit`)
* **Command:** `npx tsc --noEmit`
* **Exit Code:** `0`
* **Duration:** `~2 seconds`
* **Result:** **Passed cleanly (0 TypeScript errors)**

---

### C. Full Automated Test Suite (`npx vitest run`)
* **Command:** `npx vitest run`
* **Exit Code:** `0`
* **Duration:** `517.65 seconds`
* **Summary:**
  - **Total Test Files:** **41 passed (41 total)**
  - **Total Individual Specs:** **274 passed (274 total)**
  - **Failures / Skips / Errors:** **0**

---

### D. Production Build (`npm run build`)
* **Command:** `npm run build`
* **Exit Code:** `0`
* **Duration:** `2.2 minutes`
* **Summary:**
  - **App Router Compilation:** **30 static and dynamic routes compiled cleanly**
  - **Turbopack Status:** `✓ Compiled successfully in 74s`
  - **Page Optimization:** `✓ Finalizing page optimization in 18ms`

---

## 2. Test File Breakdown (41 Spec Files)

- `tests/unit/indexFailClosed.spec.ts` — **9/9 Passed** (Real initializer unit test)
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
