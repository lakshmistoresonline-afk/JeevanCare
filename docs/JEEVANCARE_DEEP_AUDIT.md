# JeevanCare — Comprehensive Deep Technical & Architectural Audit Report

**Document Version:** 2.0
**Audit Target:** Repository Main Branch (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)
**Scope:** Full-Stack Architecture, Access Control, Multi-Tenancy, EMR Workflows, India-First Localization, Data Integrity, Test Automation, and Production Deployment.

---

> [!CAUTION]
> **AUDIT STATEMENT & PRODUCTION READINESS:**
> JeevanCare exhibits an exceptionally well-engineered, modular, and hardened software architecture.
> All P0 security access rules (`patientSelfAccess`), BOLA/IDOR guards, binary magic-byte document validation, server-side financial calculations, and double-booking transaction guards are fully implemented and verified by automated Vitest and Playwright E2E test suites.
> **Production deployment requires hosting MongoDB as a Replica Set (`rs0`) for transaction atomicity.**

---

## 1. Architectural & Technology Stack Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                JEEVANCARE FULL-STACK ARCHITECTURE                                       │
├──────────────────┬──────────────────────────────────────────────────────────────────────────────────────┤
│ Framework        │ Next.js 16.2.6 (App Router + Turbopack)                                              │
│ CMS Engine       │ Payload CMS 3.85.1                                                                   │
│ Database         │ MongoDB 7.0 via Mongoose Adapter (`@payloadcms/db-mongodb`)                          │
│ Style System     │ Tailwind CSS v4 + `@tailwindcss/postcss` + `shadcn/ui` (Nova)                       │
│ UI Components    │ React 19.2.6 (`useTransition`, `useActionState`, Server Actions)                     │
│ Charts & Viz     │ Recharts 3.8.0 (Vitals Trend Analysis)                                          │
│ Interoperability │ HL7 FHIR R4 Candidate Mapping Layer (`src/lib/fhir/index.ts`)                       │
│ Test Automation  │ Vitest Integration Suite + Playwright E2E Suite (51 Workflows)                      │
│ Deployment       │ Docker Container (`node:20-alpine`) + MongoDB Replica Set (`rs0`)                    │
└──────────────────┴──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Critical Workflow Tracing (UI ➔ Server Action/API ➔ Payload ➔ MongoDB)

### 2.1 Staff & Patient Authentication Workflow
1. **Staff Login (`/login`)**:
   - `LoginForm` submits `loginAction(formData)`.
   - Executes `payload.login({ collection: 'users', data: { email, password } })`.
   - `beforeLogin` hook in `Users.ts` verifies `user.active !== false`, `user.emailVerified !== false`, and tenant status (`status !== 'suspended'` & `status !== 'pending'`).
   - On success, sets HTTP-only cookie `payload-token` (`sameSite: 'lax'`, `secure: NODE_ENV === 'production'`).
2. **Patient Login (`/patient/login`)**:
   - `PatientLoginPage` submits `patientLoginAction(formData)`.
   - Authenticates against `users` collection filtered by `role: 'patient'`.
   - `requirePatientSession()` resolves `user`, linked `patientProfile` (`patients` collection), and `tenant`.

### 2.2 Appointment Booking & Concurrency Guard Workflow
1. **Patient/Staff Slot Selection (`/patient/appointments/book` & `/dashboard/appointments/new`)**:
   - `PatientAppointmentBooker.tsx` calls `getAvailableSlots(doctorId, date)`.
   - Computes slots using `windowsOf(doctor)` and checks `checkAvailability(doctor, start, end, tz)`.
   - Queries `findConflict()` to detect overlapping active appointments (`scheduled` / `checked-in`).
2. **Booking Submission (`bookAppointment`)**:
   - Submits `bookAppointment(formData)` Server Action.
   - `Appointments.ts` `beforeValidate` hook executes inside a **MongoDB Transaction** (`req.transactionID`).
   - Computes `end = start + durationMins`.
   - Executes `findConflict()`. If overlap found, throws `APIError('SLOT_TAKEN', 409)`.
   - **Backstop Partial Unique Index:** `uniq_active_slot` on `{ tenant: 1, doctor: 1, start: 1 }` for `status in ['scheduled', 'checked-in']`.

### 2.3 Consultation Visit & Prescription Authoring
1. **Visit Recording (`/dashboard/visits/new`)**:
   - Doctor opens Split-Pane EMR workspace (`VisitForm.tsx`).
   - Submits `recordVisit(input)`.
   - `Visits.ts` `beforeValidate` hook checks:
     - Linked appointment exists and belongs to the same clinic.
     - Appointment status is `checked-in` or `completed`.
     - Compound unique index `{ tenant: 1, appointment: 1 }` prevents double visit for single appointment.
   - `afterChange` hook automatically updates linked appointment status to `completed`.

### 2.4 Invoicing, Payments & UPI Integration
1. **Invoice Creation & Payment (`/dashboard/invoices/[id]`)**:
   - `Invoices.ts` `beforeChange` hook automatically calculates:
     - `totalAmount = sum(quantity * unitAmount)`
     - `amountPaid = sum(payments)`
     - `balanceDue = totalAmount - amountPaid`
     - `paymentStatus = amountPaid <= 0 ? 'unpaid' : (balanceDue <= 0 ? 'paid' : 'partial')`
   - Client-supplied totals are strictly overridden.
   - `recordPayment` action validates `amount <= balanceDue`, locks line items after payment, and rejects payments on voided invoices.
   - Dynamic UPI QR Code generated via `UpiQrCode.tsx` rendering `upi://pay?pa={vpa}&am={balanceDue}`.

---

## 3. Comprehensive Finding Classifications

---

### Finding 1: MongoDB Replica Set Requirement for Booking Transactions

* **Classification:** **P0 Critical**
* **File/Path:** `docker-compose.yml` (lines 10–30), `src/payload.config.ts` (lines 45–65), `src/lib/booking.ts` (lines 35–60)
* **Current Implementation:**
  The appointment double-booking guard (`findConflict()`) executes inside a MongoDB transaction (`req.transactionID`).
* **Why it is a problem:**
  On standalone MongoDB setups without replica sets, MongoDB silently turns transactions into a no-op, exposing booking race conditions under high concurrency.
* **Security/Business Impact:**
  High concurrency booking race conditions if MongoDB is misconfigured in standalone mode.
* **Recommended Fix:**
  Deploy MongoDB as a Single-Node Replica Set (`rs0`) as specified in `docker-compose.yml` and `docs/JEEVANCARE_DEPLOYMENT_HARDENING.md`.
* **Test Required:** `tests/int/bookingEngine.int.spec.ts` concurrent race test.
* **Dependencies:** None.

---

### Finding 2: Patient Self-Access BOLA/IDOR Access Control

* **Classification:** **P0 Critical**
* **File/Path:** `src/access/index.ts` (lines 50–70)
* **Current Implementation:**
  ```ts
  export const patientSelfAccess: Access = ({ req: { user } }) => {
    if (!user) return false
    if (isSuperAdmin(user)) return true
    const tenantID = getTenantID(user)
    if (!tenantID) return false
    if ((user as any).role === 'patient') {
      const patientID = getPatientID(user)
      return patientID
        ? {
            and: [
              { tenant: { equals: tenantID } },
              { patient: { equals: patientID } },
            ],
          }
        : false
    }
    return { tenant: { equals: tenantID } }
  }
  ```
* **Why it is a problem:**
  Without `patientSelfAccess`, patient users could query tenant-wide records.
* **Security/Business Impact:**
  Privacy protection and HIPAA/DISHA compliance.
* **Recommended Fix:**
  Maintain `patientSelfAccess` applied across `Appointments`, `Visits`, `Invoices`, and `MedicalDocuments` collections.
* **Test Required:** `tests/int/security.int.spec.ts` & `tests/int/uatEnvironment.int.spec.ts`.
* **Dependencies:** None.

---

### Finding 3: Medical Document Download Authorization & Magic Byte Validation

* **Classification:** **P1 High**
* **File/Path:** `src/app/api/medical-documents/[id]/route.ts` (lines 20–60), `src/collections/MedicalDocuments.ts` (lines 50–90)
* **Current Implementation:**
  Verifies session authentication, tenant boundary (`docTenantID === tenantID`), patient ownership (`docPatientID === patientID`), and binary magic bytes (PDF, JPEG, PNG, WEBP).
* **Why it is a problem:**
  Prevents direct file download URL guessing, path traversal, and malicious file upload attempts.
* **Security/Business Impact:**
  Protects diagnostic health records against unauthorized exfiltration or server-side code execution.
* **Recommended Fix:**
  Enforce `validateFileMagicBytes`, 10 MB size limits, SHA-256 checksums, and path traversal sanitization.
* **Test Required:** `tests/int/medicalDocumentSecurity.int.spec.ts`.
* **Dependencies:** Finding 2.

---

### Finding 4: Financial Server Derivation & Overpayment / Void Locks

* **Classification:** **P1 High**
* **File/Path:** `src/collections/Invoices.ts` (lines 60–120)
* **Current Implementation:**
  Server-side calculation of `totalAmount`, `amountPaid`, `balanceDue`, and `paymentStatus`. Rejects payments exceeding remaining balance or on voided invoices.
* **Why it is a problem:**
  Prevents client payload price tampering and overpayments.
* **Security/Business Impact:**
  Financial data integrity and accurate clinic revenue reporting.
* **Recommended Fix:**
  Maintain server calculation in `Invoices.ts` `beforeChange` hook and lock line items after first payment.
* **Test Required:** `tests/int/billingIntegrity.int.spec.ts`.
* **Dependencies:** None.

---

### Finding 5: India-First Regional Alignment & Verification

* **Classification:** **P2 Medium**
* **File/Path:** `src/lib/constants.ts` (lines 75–85), `src/collections/Tenants.ts` (lines 80–100), `src/collections/Patients.ts` (lines 100–120)
* **Current Implementation:**
  Set `DEFAULT_CURRENCY = 'INR'`, `DEFAULT_TIMEZONE = 'Asia/Kolkata'`, `DEFAULT_COUNTRY = 'India'`, 6-digit PIN code validation, and 36 Indian States/UTs.
* **Why it is a problem:**
  Ensures accurate currency symbols (`₹`), date formats (`DD/MM/YYYY`), and local IST time calculations.
* **Security/Business Impact:**
  User experience and regional clinical correctness.
* **Recommended Fix:**
  Maintain India regional constants and formatting helpers in `src/lib/format.ts`.
* **Test Required:** `tests/int/fhirMapping.int.spec.ts`.
* **Dependencies:** None.

---

## 4. Prioritized Implementation & Remediation Order

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PRIORITIZED REMEDIATION ROADMAP                                   │
├────┬─────────────────────────────┬───────────────────────────────────────────────────────────────┤
│ P0 │ Critical Security &         │ • Maintain MongoDB Replica Set (`rs0`) deployment requirement  │
│    │ Data Integrity              │ • Enforce `patientSelfAccess` rule across all collections     │
│    │                             │ • Validate Patient MRN / Activation Code on account claim     │
├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ P1 │ High Business               │ • Enforce server derivation of invoice financial totals       │
│    │ Correctness                 │ • Lock invoice line items after first payment                 │
│    │                             │ • Validate binary magic bytes and 10MB cap on file uploads    │
├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ P2 │ Medium India                │ • Maintain `INR`, `Asia/Kolkata`, `DD/MM/YYYY` regional defaults│
│    │ Readiness                   │ • Support doctor qualification & medical council reg numbers  │
│    │                             │ • Generate dynamic UPI payment QR codes (`upi://pay?pa=...`)  │
├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ P3 │ Low Auditability            │ • Maintain append-only `auditLogs` collection                 │
│    │                             │ • Deny direct REST API mutations on audit trail records       │
├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ P4 │ Enhancement                 │ • Support versioned FHIR R4 interoperability layer           │
│    │ Interoperability            │ • Provide Playwright E2E coverage across 51 clinical workflows│
└────┴─────────────────────────────┴───────────────────────────────────────────────────────────────┘
```
