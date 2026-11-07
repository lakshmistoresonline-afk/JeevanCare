# JeevanCare — Comprehensive Role Authorization Matrix

**Audit Date:** November 2026
**Scope:** Permission Matrix Across All System Features and User Roles (`superAdmin`, `owner`, `doctor`, `receptionist`, `patient`).

---

## 1. System Role Definitions

* **`superAdmin`:** SaaS Platform Operator (Global access across all tenants).
* **`owner`:** Clinic / Hospital Group Administrator (Full control over their clinic tenant).
* **`doctor`:** Licensed Attending Physician (EMR consultation, prescriptions, and assigned patient care).
* **`receptionist`:** Front-Desk Staff & Triage (Patient check-in, token callouts, vitals, billing receipts).
* **`patient`:** Healthcare Consumer (Self-service portal, medical history, booking, Rx downloads).

---

## 2. Granular Feature Authorization Matrix

| Feature / Workspace Action | `superAdmin` | `owner` | `doctor` | `receptionist` | `patient` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **SaaS Console (`/super`)** | ✅ Full | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |
| **Onboard New Clinic Tenant** | ✅ Full | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied |
| **Manage Clinic Staff (`/dashboard/staff`)** | ✅ Full | ✅ Full | ❌ Denied | ❌ Denied | ❌ Denied |
| **View Revenue Reports (`/dashboard/reports`)** | ✅ Full | ✅ Full | ❌ Denied | ❌ Denied | ❌ Denied |
| **OPD Queue & Day Rail (`/dashboard/appointments`)** | ✅ Read | ✅ Full | ✅ Full | ✅ Full | ❌ Denied |
| **Front-Desk Check-In & Token Allocation** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ Denied |
| **Record Triage Patient Vitals** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ Denied |
| **OPD Waiting Room TV Callout (`/dashboard/queue-display`)** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ Denied |
| **Author EMR Consultations & Rx (`/dashboard/visits/new`)** | ❌ Denied | ✅ Full | ✅ Full | ❌ Denied | ❌ Denied |
| **View Patient Medical History** | ✅ Read | ✅ Read | ✅ Full | ✅ Read | 👤 Self Only |
| **Collect Payments & Issue Receipts** | ✅ Full | ✅ Full | 👁️ Status Badge | ✅ Full | 👁️ View Receipt |
| **Upload Medical Documents / Lab Scans** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ❌ Denied |
| **Download Medical Documents** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 👤 Self Only |
| **Modify Medicine Catalog** | ✅ Full | ✅ Full | 👁️ Search | 👁️ Search | ❌ Denied |
| **Patient Portal (`/patient/dashboard`)** | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | ✅ Self |

*Legend: ✅ Full Access | 👁️ Read / Search Only | 👤 Self-Record Only | ❌ Access Denied*
