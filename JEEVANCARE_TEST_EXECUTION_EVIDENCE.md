# JeevanCare — Test Execution Evidence Log

**Audit Date:** November 2026
**Execution Environment:** `jeevancare_test`

---

## 1. Summary of Command Output & Exit Codes

| Command | Exit Code | Execution Time | Output Summary |
| :--- | :---: | :---: | :--- |
| `npx vitest run tests/unit/indexFailClosed.spec.ts` | **0** | `776 ms` | **10/10 Unit Tests Passed (100%)** |
| `npx tsc --noEmit` | **0** | `~2 seconds` | **Passed Cleanly (0 TypeScript Errors)** |
| `npx vitest run tests/int/backupRestore.int.spec.ts` | **0** | `13.90 seconds` | **4/4 Integration Tests Passed (100%)** |
| `npx vitest run` | **0** | `424.67 seconds` | **42/42 Test Files Passed (100%)** \| **286/286 Individual Tests Passed (100%)** |
| `npm run build` | **0** | `53 seconds` | **Passed Cleanly (30/30 Static & Dynamic Routes Compiled)** |

---

## 2. Test File Pass Breakdown

- `tests/unit/indexFailClosed.spec.ts` — **10/10 Passed**
- `tests/int/backupRestore.int.spec.ts` — **4/4 Passed**
- `tests/int/medicalDocuments.int.spec.ts` — **30/30 Passed**
- `tests/int/patientRegistration.int.spec.ts` — **18/18 Passed**
- `tests/int/billing.int.spec.ts` — **20/20 Passed**
- `tests/int/clinicalRecordIntegrity.int.spec.ts` — **22/22 Passed**
- `tests/int/bookingEngine.int.spec.ts` — **11/11 Passed**
- `tests/int/isolation.int.spec.ts` — **10/10 Passed**
- All 11 Unit Specs (`tests/unit/`) — **100% Passed**
