# JeevanCare — Final Pending Issues Register

**Audit Date:** November 2026
**Status:** All Critical & High Priority Issues Remediated.

---

## 1. Consolidated Issue Register

| Issue ID | Priority | Finding / Defect | Remediation Applied | Test Verification | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **ISS-001** | **P0** | CSV Import Tenant Override | Forced `targetTenantID = getTenantID(actor)` for non-superadmin roles. | `tests/unit/importSecurity.spec.ts` | **FIXED** |
| **ISS-002** | **P0** | Public Web Root File Access | Changed `staticDir` to `private_media/` and enforced `/api/medical-documents/[id]`. | `tests/int/medicalDocuments.int.spec.ts` | **FIXED** |
| **ISS-003** | **P0** | Doctor-PC Local Storage Requirement | Built Windows companion agent service (`desktop/doctor-agent/`) and integration library (`src/lib/localDocAgent.ts`). | `tests/unit/localDocAgent.spec.ts` | **FIXED** |
| **ISS-004** | **P1** | Backup Truncation & Unencrypted Restore | Implemented paginated un-truncated backups, AES-256-GCM encryption, and `runTenantRestore()`. | `tests/int/backupRestore.int.spec.ts` | **FIXED** |
| **ISS-005** | **P1** | Medicines RBAC | Restricted `create`, `update`, `delete` access to `superAdmin` and `owner` roles. | `tests/unit/patientSecurity.spec.ts` | **FIXED** |
| **ISS-006** | **P2** | Index Fail-Closed Startup | Extracted `initializeAppointmentIndexes` with zero automatic drops and fail-closed startup. | `tests/unit/indexFailClosed.spec.ts` | **FIXED** |
| **ISS-007** | **P2** | Patient Activation Mongo Query | Converted string IDs to `new ObjectId(id)` for native MongoDB collection updates. | `tests/int/patientRegistration.int.spec.ts` | **FIXED** |
| **ISS-008** | **P2** | CSV Formula Injection | Sanitized leading `=`, `+`, `-`, `@`, `\t` characters with single quote prefix (`'`). | `tests/int/export.int.spec.ts` | **FIXED** |
