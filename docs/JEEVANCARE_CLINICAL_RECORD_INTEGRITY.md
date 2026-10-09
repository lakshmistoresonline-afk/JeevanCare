# JeevanCare — Clinical Record Integrity & Immutability Specification

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)
**Compliance Standard:** ISO/IEC 27001 (Healthcare Information Integrity), OWASP ASVS & DISHA Guidelines.

---

## 1. Executive Summary & Core Principle

In **JeevanCare**, **clinical history is longitudinal and treated as a durable record, not ordinary editable application text.**

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            CLINICAL RECORD INTEGRITY ARCHITECTURE                        │
├─────────────────┬───────────────────┬─────────────────────┬──────────────────────────────┤
│ 1. Immutability │ 2. One-Visit Guard│ 3. State Check      │ 4. Audit Trail               │
│ Primary keys    │ Compound Unique   │ Only `checked-in`   │ Append-Only Audit Log        │
│ & linkages      │ Index on          │ or `completed`      │ REST Mutation Denied         │
│ are immutable   │ `(tenant, appt)`  │ appointments        │ (`visit.created`, `updated`) │
└─────────────────┴───────────────────┴─────────────────────┴──────────────────────────────┘
```

> [!IMPORTANT]
> **NO DIAGNOSTIC AI DISCLAIMER:**
> JeevanCare is strictly a **record-management system**, not an autonomous medical advisor or diagnostic AI. Treatment kits, dosage chips, and clinical templates serve solely as doctor-directed entry tools.

---

## 2. Implemented Integrity Controls

### A. One Visit Per Appointment Enforcement
- **Database Unique Index (`src/collections/Visits.ts`)**: Enforces compound unique index on `{ tenant: 1, appointment: 1 }`.
- **Pre-Validation Hook Guard**: Checks `existing.totalDocs > 0` before creation and rejects duplicate attempts with `409 VISIT_EXISTS`.

### B. State Machine Guard for Consultation Start
- **Allowed States (`VISIT_ALLOWED_APPOINTMENT_STATUSES`)**: Visits can ONLY be recorded for appointments with status `checked-in` or `completed`.
- **Cancelled / No-Show Block**: Attempting to record a visit for a `cancelled` or `no-show` appointment is rejected with `INVALID_APPOINTMENT_STATE`.

### C. Relationship Boundary Validation
- **Tenant Isolation**: Verifies appointment, patient, and doctor belong to the same clinic tenant (`tenantID`).
- **Patient Isolation**: Verifies appointment and visit belong strictly to the target patient. Attaching records across patients or clinics is rejected with `403 Forbidden` / `400 Validation Error`.

### D. Append-Only Audit Log Immutability
- **REST Mutation Prevention (`src/collections/AuditLogs.ts`)**: Direct `create`, `update`, and `delete` operations on `auditLogs` are denied to all roles (`denyAll`), including `superAdmin`. Audit entries can ONLY be written by internal server-side hooks via `logAudit`.
- **Clinical Audit Actions**:
  - `visit.created` logged when a clinical consultation is recorded.
  - `visit.updated` logged when a clinical record or prescription is updated.
  - `document.uploaded` and `document.updated` logged for diagnostic reports.

### E. Chronological Longitudinal Timeline
- **Patient Timeline Querying**: Clinical visits and diagnostic documents are queried in strict descending chronological order (`-visitDate` / `-start`), preserving the patient's longitudinal health history.

---

## 3. Automated Integration Test Coverage (`tests/int/clinicalRecordIntegrity.int.spec.ts`)

| Test Case | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **One-Visit Guard** | Second visit attempt for same appointment | Rejected with `409 VISIT_EXISTS` |
| **Audit Immutability**| Direct REST/API `create`/`update`/`delete` on audit logs | Denied with `403 Forbidden` |
| **Cancelled Appointment**| Attempting visit on `cancelled` appointment | Rejected with `INVALID_APPOINTMENT_STATE` |
| **Cross-Tenant Attach**| Clinic A doctor creating visit for Clinic B appt | Rejected with `403 Forbidden` |
| **Timeline Ordering** | Fetching patient visits | Descending order (`-visitDate`) |
