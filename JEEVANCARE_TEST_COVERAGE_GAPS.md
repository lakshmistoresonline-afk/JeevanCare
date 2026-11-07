# JeevanCare — Test Coverage & Security Gap Analysis

**Audit Date:** November 2026
**Test Suite Inventory:** 51 Automated Test Specs (Unit, Integration, and Playwright E2E)

---

## 1. Existing Test Architecture Overview

| Test Layer | Directory | Spec Count | Focus Areas |
| :--- | :--- | :---: | :--- |
| **Unit Tests** | `tests/unit/` | 11 specs | Seeder database safety (`seedSafety.spec.ts`), rate limiting, phone normalization, UPI QR generation, FHIR mappings, language helpers. |
| **Integration Tests** | `tests/int/` | 29 specs | Billing integrity, medical document ownership, tenant isolation, walk-in token counters, clinical record integrity, signup & activation. |
| **E2E Tests** | `tests/e2e/` | 11 specs | Doctor EMR workflow, receptionist front-desk check-in, patient portal booking, BOLA security, mobile responsiveness. |

---

## 2. Identified Coverage Gaps & Required Regression Tests

### Gap 1: CSV Importer Tenant Hijacking Guard (`tests/unit/importTenantIsolation.spec.ts`)
* **Missing Test:** Test verifying that when a non-superadmin receptionist/doctor uploads a CSV file containing `clinic_name: "Foreign Clinic"`, the import handler rejects foreign tenant resolution and forces `targetTenantID = getTenantID(user)`.
* **Action:** Create `tests/unit/importTenantIsolation.spec.ts`.

---

### Gap 2: Direct Static Media URL Access Test (`tests/int/medicalDocumentStaticDir.spec.ts`)
* **Missing Test:** Test attempting HTTP GET requests to `/media/sample_medical_document.pdf` without a session cookie to verify that direct static file URLs do not leak private health records.
* **Action:** Create `tests/int/medicalDocumentStaticDir.spec.ts`.

---

### Gap 3: High-Volume Concurrent Booking Stress Test (`tests/int/concurrentBookingRace.spec.ts`)
* **Missing Test:** Execute 50 concurrent POST requests for the exact same doctor and start time slot to verify that MongoDB's `uniq_active_slot` partial unique index aborts 49 duplicate requests and allows exactly 1 booking.
* **Action:** Create `tests/int/concurrentBookingRace.spec.ts`.

---

### Gap 4: Concurrent OPD Walk-In Token Allocation (`tests/int/concurrentTokenGeneration.spec.ts`)
* **Missing Test:** Fire 20 parallel check-in requests for the same clinic on the same day to verify that atomic counter increments (`walkin_token_counters`) issue sequential, non-duplicate tokens (`T-01` through `T-20`).
* **Action:** Create `tests/int/concurrentTokenGeneration.spec.ts`.

---

### Gap 5: Medicine Catalog Role Access Limits (`tests/unit/medicineCatalogPermissions.spec.ts`)
* **Missing Test:** Test verifying that `patient` portal sessions receive `403 Forbidden` when attempting POST/PUT/DELETE operations on the `medicines` collection.
* **Action:** Create `tests/unit/medicineCatalogPermissions.spec.ts`.
