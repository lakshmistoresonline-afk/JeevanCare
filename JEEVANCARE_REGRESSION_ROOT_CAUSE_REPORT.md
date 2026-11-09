# JeevanCare — Post-Remediation Regression Root Cause Report

**Audit Date:** November 2026
**Status:** All 13 previous failures investigated and 100% resolved.

---

## 1. Summary of All 13 Failures & Root Cause Resolution

| # | Test Suite & Scenario | Root Cause | Fix Implemented |
| :--- | :--- | :--- | :--- |
| **1** | Index Migration Conflict (Error 86) | MongoDB index `uniq_active_slot` already existed with an older partial filter expression. | Added automatic drop of stale index before creating updated index in `payload.config.ts`. |
| **2** | `billing.int.spec.ts` — Duplicate Visit Creation | `recordVisit` allowed updating existing visits without rejecting duplicate creation attempts. | Added check in `recordVisit` and `Visits.ts` hook to reject duplicate visit creation with `409` error. |
| **3** | `billing.int.spec.ts` — Appointment Status Transition | `STATUS_TRANSITIONS` missing `'completed'` outgoing transition from `'checked-in'`. | Added `'completed'` to `checked-in` transition map in `src/lib/constants.ts`. |
| **4** | `clinicalRecordIntegrity.int.spec.ts` — Duplicate Visit Prevention | `payload.count` checked string ID without `relId` normalization. | Replaced `count` with `find` using `relId(appointmentID)` in `Visits.ts`. |
| **5** | `clinicalRecordIntegrity.int.spec.ts` — Patient Timeline Chronological Order | `patientID` object vs string comparison mismatch in timeline queries. | Applied `relId(patientID)` normalization in `getPatientTimeline` (`src/lib/timeline.ts`). |
| **6** | `medicalDocuments.int.spec.ts` — Patient Complete History | `MedicalDocuments` tenant validation received object instead of string ID. | Used `relId(data.tenant)` in `MedicalDocuments.ts` `beforeValidate` hook. |
| **7** | `medicalDocuments.int.spec.ts` — Document Linked to Consultation Visit | `data.tenant` string conversion evaluated to `"[object Object]"`. | Fixed string conversion with `String(relId(data.tenant))` in `MedicalDocuments.ts`. |
| **8** | `patientRegistration.int.spec.ts` — MRN Alone Rejection & Code Linkage | Native MongoDB `updateOne` query received string `_id` instead of `ObjectId`. | Converted `queryId` to `new ObjectId(id)` in `patient/register/actions.ts`. |
| **9** | `patientRegistration.int.spec.ts` — Concurrent Token Claim | MongoDB `_id` type mismatch in atomic claim update. | Applied `new ObjectId(id)` normalization in atomic claim update. |
| **10** | `patientRegistration.int.spec.ts` — Stale Token Restoration | Token hash hash check mismatch in error recovery. | Synchronized token hash clearing in recovery fallback block. |
| **11** | `patientRegistration.int.spec.ts` — Staff Activation Code Issuance | Audit log creation passed invalid action name `'user.updated'`. | Changed audit log action to valid `'user.role-changed'` in `src/lib/bookingInternal.ts`. |
| **12** | `patientRegistration.int.spec.ts` — Super-Admin Activation Issuance | Invalid audit log action name caused server action error. | Fixed audit action enum in `src/lib/bookingInternal.ts`. |
| **13** | `prescriptionPrint.int.spec.ts` — A5 Prescription Print Visit Retrieval | React request `cache()` memoized stale session user between test logins. | Removed `cache()` wrapper from `getCurrentUser()` in `src/lib/auth.ts`. |
