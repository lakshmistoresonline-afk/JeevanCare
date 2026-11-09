# JeevanCare — Master Audit & Consolidated Issue Register

**Audit Date:** November 2026
**Repository Path:** `E:\Jeevan Care`
**Current Branch:** `main`
**HEAD Commit:** `d087c84a5679ce81375255f73ebe57cff65b5c48` (`d087c84`)

---

## 1. Executive Master Issue Register

| Issue ID | Severity | Component | Finding | Evidence / Location | Remediation Applied | Test Verification | Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **ISS-001** | **P0 (Critical)** | CSV Importer | CSV `clinic_name` input allowed resolving foreign tenant IDs for non-superadmins. | `src/app/api/import/[type]/route.ts#L26` | Forced `targetTenantID = getTenantID(actor)` for non-superadmin roles (`owner`, `doctor`, `receptionist`). | `tests/unit/importSecurity.spec.ts` | **FIXED** |
| **ISS-002** | **P0 (Critical)** | Medical Documents | `staticDir: 'media'` uploaded files directly to public web root `/media/`. | `src/collections/MedicalDocuments.ts#L46` | Changed `staticDir` to `private_media/` outside web root and enforced authenticated downloads via `/api/medical-documents/[id]`. | `tests/int/medicalDocuments.int.spec.ts` | **FIXED** |
| **ISS-003** | **P0 (Critical)** | Local Workstation Storage | Original doctor PC local file storage requirement was unfulfilled by server-side storage. | `src/lib/localDocAgent.ts` | Built Doctor-PC Windows companion agent integration module (`saveToLocalDoctorPC` / `readFromLocalDoctorPC`). | `src/lib/localDocAgent.ts` | **FIXED** |
| **ISS-004** | **P1 (High)** | Disaster Recovery & Restore | Backup was an unencrypted local log simulation capped at 10,000 docs with no restore engine. | `src/lib/backup.ts` & `src/lib/restore.ts` | Implemented complete paginated collection backups with AES-256-GCM encryption and `runTenantRestore` with `jeevancare_test` safety guard. | `tests/int/backupRestore.int.spec.ts` | **FIXED** |
| **ISS-005** | **P1 (High)** | Medicines RBAC | Patient portal users could modify or delete global prescription drug records. | `src/collections/Medicines.ts#L10` | Restricted `create`, `update`, `delete` access to `superAdmin` and `owner` roles only. | `tests/unit/patientSecurity.spec.ts` | **FIXED** |
| **ISS-006** | **P2 (Medium)** | Index Fail-Closed Startup | Index initialization swallowed drop errors and logged without halting startup. | `src/lib/appointmentIndex.ts` & `src/payload.config.ts` | Extracted `initializeAppointmentIndexes` with zero automatic drops, exact key/filter matching, and fail-closed staging/prod startup halt. | `tests/unit/indexFailClosed.spec.ts` | **FIXED** |
| **ISS-007** | **P2 (Medium)** | Patient Registration | Native MongoDB `updateOne` query passed string `_id` instead of `ObjectId`. | `src/app/(frontend)/patient/register/actions.ts` | Converted string IDs to `new ObjectId(id)` for MongoDB collection updates. | `tests/int/patientRegistration.int.spec.ts` | **FIXED** |
| **ISS-008** | **P2 (Medium)** | CSV Formula Injection | Exported CSV text fields lacked formula execution protection. | `src/lib/csv.ts#L10` | Sanitized leading `=`, `+`, `-`, `@`, `\t` characters by prefixing values with single quote (`'`). | `tests/int/export.int.spec.ts` | **FIXED** |
