# JeevanCare — Final Test Execution Evidence Report

**Audit Date:** November 2026
**Execution Environment:** `jeevancare_test`

---

## 1. Verified Command Execution Summary

| Command | Exit Code | Duration | Verification Result |
| :--- | :---: | :---: | :--- |
| `npx vitest run tests/unit/indexFailClosed.spec.ts` | **0** | `776 ms` | **10/10 Unit Tests Passed (100%)** |
| `node desktop/doctor-agent/index.js --test` | **0** | `~1 second` | **Passed Cleanly (Windows Agent Test CLI)** |
| `npx vitest run tests/unit/localDocAgent.spec.ts` | **0** | `632 ms` | **4/4 Unit Tests Passed (100%)** |
| `npx vitest run tests/unit` | **0** | `59.87 s` | **14/14 Unit Test Files Passed (100%)** \| **75/75 Specs Passed** |
| `npx vitest run tests/int/backupRestore.int.spec.ts` | **0** | `13.90 s` | **4/4 Integration Tests Passed (100%)** |
| `npx tsc --noEmit` | **0** | `~2 seconds` | **Passed Cleanly (0 TypeScript Errors)** |
| `npx vitest run` | **0** | `424.67 s` | **42/42 Test Files Passed (100%)** \| **286/286 Tests Passed (100%)** |
| `npm run build` | **0** | `2.8 min` | **Passed Cleanly (30/30 Static & Dynamic Routes Compiled)** |
