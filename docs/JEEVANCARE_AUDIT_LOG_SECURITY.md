# JeevanCare — Append-Only Audit Log Security & Completeness Specification

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)
**Compliance Standard:** ISO/IEC 27001 (Audit Trail Integrity) & OWASP ASVS v4.0 (V8 Audit Logging).

---

## 1. Executive Summary & Immutability Principle

In **JeevanCare**, **audit log immutability IS the primary security feature.**

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            APPEND-ONLY AUDIT LOG ARCHITECTURE                            │
├─────────────────┬───────────────────┬─────────────────────┬──────────────────────────────┤
│ 1. Immutability │ 2. Internal Writer│ 3. Data Minimization│ 4. Access Control            │
│ REST REST API   │ Server-side hooks │ Human summaries     │ Clinic Owner: Tenant logs    │
│ `create/update/ │ via `logAudit`    │ No passwords, tokens│ SuperAdmin: Platform-wide    │
│ delete: denyAll`│ (`overrideAccess`)│ or raw medical files│ Doctors/Patients: Denied     │
└─────────────────┴───────────────────┴─────────────────────┴──────────────────────────────┘
```

---

## 2. Implemented Audit Security Controls

### A. Non-Tamperable Collection Access Policies (`src/collections/AuditLogs.ts`)
- **Direct REST/API Mutation Denial:**
  `create: denyAll`, `update: denyAll`, `delete: denyAll`
- **Single Server-Side Writer (`logAudit`)**:
  Audit log entries can ONLY be inserted by internal server-side hooks via `logAudit({ payload, user }, ...)` using `overrideAccess: true`. Direct API calls to create, modify, or delete audit logs are rejected with `403 Forbidden` for all user roles, including `superAdmin`.

### B. Audit Coverage of Sensitive Operational Events

| Action Event | Triggering Operation | Target Collection | Logged Metadata Context |
| :--- | :--- | :--- | :--- |
| `appointment.created` | Booking appointment | `appointments` | Patient name, Doctor name, Slot time |
| `appointment.cancelled` | Cancelling appointment | `appointments` | Cancellation reason, previous status |
| `appointment.status-changed` | Status update (`checked-in`, `completed`) | `appointments` | Previous & new status transition |
| `visit.created` | Recording clinical consultation | `visits` | Patient name, Diagnosis string |
| `visit.updated` | Modifying clinical consultation | `visits` | Patient name |
| `document.uploaded` | Uploading lab PDF / X-ray | `medical-documents` | Document type, Filename |
| `document.updated` | Updating metadata / Archiving | `medical-documents` | Title, Status change (`archived`) |
| `export.generated` | Downloading medical file / CSV export | `medical-documents` | Filename, Export type |
| `invoice.voided` | Voiding billing invoice | `invoices` | Invoice number, Void reason |
| `payment.recorded` | Recording payment receipt | `invoices` | Amount, Payment method (`cash`, `upi`) |
| `user.created` | Adding clinic staff / doctor | `users` | Staff name, Role |
| `user.deactivated` | Deactivating staff account | `users` | Staff name |
| `user.role-changed` | Promoting / changing staff role | `users` | Previous & new role |
| `settings.updated` | Updating clinic working hours/currency | `tenants` | Clinic name |
| `tenant.suspended` | SuperAdmin suspending clinic | `tenants` | Clinic name |
| `tenant.reactivated` | SuperAdmin reactivating clinic | `tenants` | Clinic name |

### C. Data Minimization & PII Safeguards
- **Concise Summaries:** Logs store human-readable event summaries (e.g. `Recorded ₹500 payment on invoice INV-0001`).
- **Zero Sensitive Credential Exposure:** Passwords, JWT tokens, credit card numbers, and full medical document contents are **never** written to audit logs.

---

## 3. Automated Integration Test Coverage (`tests/int/clinicalRecordIntegrity.int.spec.ts`)

- **Direct REST/API Mutation Denial:** Verifies direct `create`, `update`, or `delete` attempts on `auditLogs` over REST API are rejected with `403 Forbidden` even for `superAdmin` user sessions.
- **Hook Trigger Verification:** Verifies creating appointments, visits, invoices, and medical document uploads automatically generate corresponding audit entries.
