# JeevanCare — Data Retention & Archival Policy Specification

> [!IMPORTANT]
> **ENGINEERING READINESS DOCUMENT:**
> This document details the technical data retention mechanisms, soft-delete rules, and automated cleanup tasks implemented in the JeevanCare platform. It is prepared for system administration and engineering evaluation and does not constitute a legal conclusion.

---

## 1. Overview & Retention Principles

In **JeevanCare**, **clinical records represent longitudinal health history and are protected against hard deletion.**

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            DATA RETENTION & LIFECYCLE MODEL                              │
├─────────────────┬───────────────────┬─────────────────────┬──────────────────────────────┤
│ Collection      │ Delete Policy     │ Lifecycle Status    │ Archival Strategy            │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────────────────┤
│ `patients`      │ `delete: denyAll` │ Active              │ Hard deletion denied         │
│ `visits`        │ `delete: denyAll` │ Completed Consult   │ Immutably preserved          │
│ `appointments`  │ `delete: denyAll` │ Scheduled/Cancelled │ Retained for audit history   │
│ `invoices`      │ `delete: denyAll` │ Active / Voided     │ Voided frozen, retained      │
│ `documents`     │ `delete: denyAll` │ Active / Archived   │ Soft-delete (`archived`)     │
│ `auditLogs`     │ `delete: denyAll` │ Append-Only         │ Permanent audit trail        │
└─────────────────┴───────────────────┴─────────────────────┴──────────────────────────────┘
```

---

## 2. Technical Retention Controls

### A. Clinical Record Preservation (`delete: denyAll`)
- **Patients, Visits & Appointments:** Hard-deletion policies are denied (`delete: denyAll`) across all clinical collections.
- **Cancelled Appointments:** When an appointment is cancelled, its status updates to `cancelled` with a mandatory `cancellationReason`. The appointment slot is freed for re-booking, while the appointment record is permanently retained in the patient's audit timeline.

### B. Medical Document Archival
- **Soft-Delete via Status (`status: 'archived'`)**:
  - Medical documents are archived by updating `status` to `'archived'`.
  - Archived documents are hidden from patient portal views (`GET /api/medical-documents/[id]` returns 404 for patient roles).
  - Physical file artifacts remain on disk in `media/` to satisfy medical record retention requirements for staff audits.

### C. Automated Unverified Signup Cleanup Cron Task
- **`purgeExpiredUnverifiedSignups` (`src/app/api/cron/daily-digest/route.ts`)**:
  - Automatically identifies and purges clinic self-serve signup requests where `emailVerified === false` and creation timestamp exceeds 24 hours.
  - Prevents database clutter from unverified or abandoned clinic signups.

### D. Audit Log Permanent Preservation
- **Append-Only Immutability (`src/collections/AuditLogs.ts`)**:
  - `create`, `update`, and `delete` operations are denied to all API roles (`denyAll`), including `superAdmin`.
  - Audit logs provide a permanent, non-tamperable record of system events (`appointment.created`, `visit.created`, `invoice.voided`, `export.generated`).
