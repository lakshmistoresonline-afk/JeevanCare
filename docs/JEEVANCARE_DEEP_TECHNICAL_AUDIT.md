# JeevanCare — Comprehensive Deep Technical & Architectural Audit

**Document Version:** 1.0
**Audit Target:** Repository Main Branch (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)
**Scope:** Full-stack Architecture, Security, Multi-Tenancy, EMR Workflows, India Localization, Data Integrity, Tests, and Deployment.

---

> [!CAUTION]
> **PRODUCTION READINESS STATEMENT:**
> **JeevanCare is NOT currently production-ready.**
> While the application demonstrates strong architectural foundation (Next.js 16 App Router, Payload CMS 3, and MongoDB replica set transactions), critical gaps exist in tenant read-scoping for patient profiles, hardcoded regional defaults (`PKR`/`Asia/Karachi`), document access authorization, and document-level PII controls that must be remediated prior to clinical deployment.

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
│ Charts & Visualization │ Recharts 3.8.0 (Vitals Trend Analysis)                                          │
│ Icons & Media    │ Lucide React 1.17.0, Sharp 0.34.2 (Image Processing)                                 │
│ Notifications    │ Sonner 2.0.7 (Toast Feedback), Web Speech API (Voice Callouts & Voice Dictation)      │
│ Deployment       │ Docker (`mongo:7` single-node `rs0`) / Vercel Serverless                             │
└──────────────────┴──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Critical Workflow Tracing (UI ➔ Server Action / API ➔ Payload ➔ MongoDB)

### 2.1 Staff & Patient Authentication Workflow
1. **Staff Login (`/login`)**:
   - `LoginForm` submits `loginAction(formData)`.
   - `loginAction` calls `payload.login({ collection: 'users', data: { email, password } })`.
   - `beforeLogin` hook in `Users.ts` verifies `user.active !== false`, `user.emailVerified !== false`, and checks tenant status (`status !== 'suspended'` & `status !== 'pending'`).
   - On success, sets HTTP-only cookie `payload-token` (`sameSite: 'lax'`, `secure: NODE_ENV === 'production'`).
2. **Patient Login (`/patient/login`)**:
   - `PatientLoginPage` submits `patientLoginAction(formData)`.
   - Authenticates against `users` collection filtered by `role: 'patient'`.
   - `requirePatientSession()` resolves `user`, linked `patientProfile` (`patients` collection), and `tenant`.

### 2.2 Appointment Booking & Concurrency Guard Workflow
1. **Patient/Staff Slot Selection (`/patient/appointments/book` & `/dashboard/appointments/new`)**:
   - Calls `getAvailableSlots(doctorId, date)`.
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
     - Unique index prevents double visit for single appointment.
   - `afterChange` hook automatically updates linked appointment status to `completed`.

### 2.4 Invoicing, Payments & UPI Integration
1. **Invoice Creation & Payment (`/dashboard/invoices/[id]`)**:
   - `Invoices.ts` `beforeValidate` hook automatically calculates:
     - `totalAmount = sum(lineItems)`
     - `amountPaid = sum(payments)`
     - `balanceDue = totalAmount - amountPaid`
     - `paymentStatus = balanceDue === 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'unpaid'`
   - `recordPayment` action validates `amount <= balanceDue` and rejects payments on voided invoices.
   - Dynamic UPI QR Code generated via `UpiQrCode.tsx` rendering `upi://pay?pa={phone}@upi&am={balanceDue}`.

---

## 3. Comprehensive Finding Classifications

---

### Finding 1: Default Regional & Timezone Configuration Mismatch (Pakistani Defaults)

* **Classification:** **HIGH**
* **File/Path:** `src/lib/constants.ts` (lines 78–79, 122), `src/collections/Tenants.ts` (line 67)
* **Current Implementation:**
  ```ts
  export const DEFAULT_CURRENCY = 'PKR'
  export const DEFAULT_TIMEZONE = 'Asia/Karachi'
  export const DEFAULT_COUNTRY = 'Pakistan'
  ```
* **Why it is a problem:**
  The project is branded as **JeevanCare** and documented as an **India-first** system (Kerala / Thrissur City dataset, INR, Asia/Kolkata). Defaulting unconfigured clinics to `PKR` and `Asia/Karachi` causes a 30-minute timezone calculation skew (`Asia/Kolkata` is UTC+5:30, `Asia/Karachi` is UTC+5:00) for slot calculations and financial formatting (`Rs` vs `₹`).
* **Security/Business Impact:**
  Incorrect appointment slot times displayed to Indian patients and incorrect currency symbols rendered on bills for newly created clinics.
* **Recommended Fix:**
  Change defaults in `src/lib/constants.ts` and `src/collections/Tenants.ts`:
  ```ts
  export const DEFAULT_CURRENCY = 'INR'
  export const DEFAULT_TIMEZONE = 'Asia/Kolkata'
  export const DEFAULT_COUNTRY = 'India'
  ```
* **Test Required:** Integration test verifying new tenant defaults initialize as `INR` / `Asia/Kolkata`.
* **Dependencies:** None.

---

### Finding 2: Patient Portal Tenant Read-Overbreadth (Data Exposure Hazard)

* **Classification:** **CRITICAL**
* **File/Path:** `src/access/index.ts` (lines 35–41), `src/collections/Appointments.ts` (line 28), `src/collections/Visits.ts` (line 23)
* **Current Implementation:**
  ```ts
  export const tenantScoped: Access = ({ req: { user } }) => {
    if (!user) return false
    if (isSuperAdmin(user)) return true
    const tenantID = getTenantID(user)
    if (!tenantID) return false
    return { tenant: { equals: tenantID } }
  }
  export const patientTenantScoped = tenantScoped
  ```
* **Why it is a problem:**
  `patientTenantScoped` is assigned to `tenantScoped`. When a patient user accesses Payload REST API or GraphQL endpoints (`/api/appointments` or `/api/visits`), the access policy permits reading ALL appointments and visits belonging to that clinic (`tenant`), rather than restricting reads to the patient's own record (`patient: { equals: patientID }`).
* **Security/Business Impact:**
  Severe Privacy Violation / HIPAA/DISHA Non-compliance. A logged-in patient could query the REST API and view medical records, diagnoses, and appointment histories of all other patients in the same clinic.
* **Recommended Fix:**
  Implement a dedicated `patientSelfAccess` rule in `src/access/index.ts`:
  ```ts
  export const patientSelfAccess: Access = ({ req: { user } }) => {
    if (!user) return false
    if (isSuperAdmin(user)) return true
    const tenantID = getTenantID(user)
    if (!tenantID) return false
    if ((user as any).role === 'patient') {
      const patientID = getPatientID(user)
      return patientID ? { tenant: { equals: tenantID }, patient: { equals: patientID } } : false
    }
    return { tenant: { equals: tenantID } }
  }
  ```
  And apply `patientSelfAccess` to `Appointments.ts`, `Visits.ts`, `Invoices.ts`, and `MedicalDocuments.ts`.
* **Test Required:** Integration test verifying patient token cannot fetch another patient's appointments or visits via Payload API.
* **Dependencies:** Finding 1.

---

### Finding 3: Medical Documents Download Route Authorization Defect

* **Classification:** **HIGH**
* **File/Path:** `src/app/api/medical-documents/[id]/route.ts` (lines 30–38)
* **Current Implementation:**
  ```ts
  if (!isSuperAdmin(user)) {
    const tenantID = getTenantID(user)
    const docTenantID = typeof doc.tenant === 'object' ? String(doc.tenant.id) : String(doc.tenant)
    if (!tenantID || docTenantID !== tenantID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  ```
* **Why it is a problem:**
  The route checks if the requesting user belongs to the document's `tenantID`, but fails to verify if a patient user owns the specific document (`doc.patient === patientID`).
* **Security/Business Impact:**
  Any patient in a clinic can download any other patient's uploaded lab reports, X-rays, or medical certificates if they know or iterate the document ID (`/api/medical-documents/[id]`).
* **Recommended Fix:**
  Add patient ownership verification:
  ```ts
  if ((user as any).role === 'patient') {
    const patientID = getPatientID(user)
    const docPatientID = typeof doc.patient === 'object' ? String(doc.patient.id) : String(doc.patient)
    if (!patientID || docPatientID !== patientID) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  ```
* **Test Required:** API test verifying patient cannot download a document belonging to another patient in the same tenant.
* **Dependencies:** Finding 2.

---

### Finding 4: Concurrency Slot Overlap Boundary Limit in Partial Unique Index

* **Classification:** **HIGH**
* **File/Path:** `src/payload.config.ts` (lines 48–66), `src/lib/booking.ts` (lines 40–70)
* **Current Implementation:**
  `uniq_active_slot` partial unique index is defined on `{ tenant: 1, doctor: 1, start: 1 }`.
* **Why it is a problem:**
  The database unique index only blocks concurrent bookings with the **exact same start time** (e.g. two bookings for 10:00 AM). If two concurrent booking requests attempt overlapping slots (e.g. 10:00–10:30 AM vs 10:15–10:45 AM), the unique index does NOT trigger.
  On standalone MongoDB setups without replica sets (where transactions are a no-op), `findConflict()` does not guarantee atomicity under high concurrency.
* **Security/Business Impact:**
  Double-booking race conditions can occur under heavy concurrent booking loads on non-replica set deployments.
* **Recommended Fix:**
  Document clearly that MongoDB Replica Set (`rs0`) is **mandatory** for production, and ensure transactional isolation level is enforced in `bookAppointment`.
* **Test Required:** Concurrent load test (`vitest`) firing simultaneous overlapping slot booking requests.
* **Dependencies:** None.

---

### Finding 5: Documentation Branding & Legacy Defaults Contradictions

* **Classification:** **MEDIUM**
* **File/Path:** `README.md` (lines 1, 15, 30), `docs/JEEVANCARE_TEST_CREDENTIALS.md`, `src/seed.ts`
* **Current Implementation:**
  `README.md` still refers to `# matab — Clinic Management` and describes Pakistani clinic seeds (`city-care-clinic`, PKR, Lahore), while project UI, branding, and UAT docs describe **JeevanCare** and Thrissur City, Kerala.
* **Why it is a problem:**
  Creates severe developer confusion, deployment misconfigurations, and documentation-vs-code drift.
* **Security/Business Impact:**
  Brand inconsistency and developer onboarding friction.
* **Recommended Fix:**
  Update `README.md` to reflect **JeevanCare**, Indian regional defaults (`INR` / `Asia/Kolkata`), and reference `src/seedTest.ts` for UAT seeding.
* **Test Required:** Documentation review.
* **Dependencies:** Finding 1.

---

### Finding 6: CSV Export API PII Audit Logging & Unmasked Export

* **Classification:** **MEDIUM**
* **File/Path:** `src/app/api/export/[type]/route.ts` (lines 50–75)
* **Current Implementation:**
  Exports patient CSV containing unmasked phone numbers, MRN, names, and registration dates.
* **Why it is a problem:**
  Exporting unmasked patient phone numbers without secondary confirmation or field-level permissions risks bulk PII exfiltration if an owner's credentials are compromised.
* **Security/Business Impact:**
  Potential data protection compliance violation under Indian DPDP Act (Digital Personal Data Protection Act).
* **Recommended Fix:**
  Add optional phone number masking or explicit export authorization prompts for staff roles.
* **Test Required:** API test verifying `export.generated` audit event is logged on every CSV download.
* **Dependencies:** None.

---

### Finding 7: Unverified Self-Serve Signup Cleanup Purge Failure Handling

* **Classification:** **LOW**
* **File/Path:** `src/app/api/cron/daily-digest/route.ts` (lines 20–28)
* **Current Implementation:**
  Purging unverified signups runs inside the hourly cron endpoint:
  ```ts
  try {
    purged = (await purgeExpiredUnverifiedSignups(payload)).purged
  } catch (err) { ... }
  ```
* **Why it is a problem:**
  If the hourly cron job fails to trigger (e.g. missing `CRON_SECRET` or Vercel cron misconfiguration), expired unverified clinic signup records linger in the database indefinitely.
* **Security/Business Impact:**
  Database clutter over time.
* **Recommended Fix:**
  Add a scheduled background worker task or manual cleanup trigger in the Super Admin console.
* **Test Required:** Integration test for `purgeExpiredUnverifiedSignups`.
* **Dependencies:** None.

---

### Finding 8: Playwright & Vitest Test Coverage Gaps

* **Classification:** **ENHANCEMENT**
* **File/Path:** `playwright.config.ts`, `vitest.config.mts`, `tests/int/*`
* **Current Implementation:**
  Existing vitest integration tests cover daily digest and audit logs (`digest.int.spec.ts`, `audit.int.spec.ts`), but lack end-to-end Playwright UI test automation for patient login, appointment booking, and prescription rendering.
* **Why it is a problem:**
  Regression risk during UI or schema updates.
* **Security/Business Impact:**
  Potential UI regressions in critical booking or login flows.
* **Recommended Fix:**
  Expand Playwright test suite to cover full clinical workflow: Patient Login ➔ Book Slot ➔ Reception Check-in ➔ Doctor Record Visit ➔ Print Rx.
* **Test Required:** Playwright E2E test suite execution.
* **Dependencies:** None.

---

## 4. Prioritized Implementation Roadmap

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                               PRIORITIZED IMPLEMENTATION ROADMAP                                 │
├────┬─────────────────────────────┬───────────────────────────────────────────────────────────────┤
│ P0 │ Security & Data Integrity   │ • Remediate `patientSelfAccess` rule in `src/access/index.ts` │
│    │                             │ • Fix Patient ownership check in `/api/medical-documents/[id]`│
│    │                             │ • Enforce strict MongoDB Replica Set (`rs0`) transactions     │
├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ P1 │ Clinical & Business         │ • Fix double-booking race condition edge cases               │
│    │ Correctness                 │ • Validate invoice lock on partial payments                   │
│    │                             │ • Lock voided invoice state immutability                      │
├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ P2 │ India Readiness             │ • Update `DEFAULT_CURRENCY = 'INR'` & `Asia/Kolkata`          │
│    │                             │ • Update default country to `India` in Tenants schema         │
│    │                             │ • Align `README.md` and `src/seed.ts` with JeevanCare India   │
├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ P3 │ User Experience             │ • Add toast notifications for patient booking & cancellation  │
│    │                             │ • Enhance mobile responsiveness on Day Rail                   │
├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ P4 │ Optimization                │ • Optimize React `cache()` session resolution                 │
│    │                             │ • Centralize `relId` relationship parsing                     │
├────┼─────────────────────────────┼───────────────────────────────────────────────────────────────┤
│ P5 │ Future Interoperability     │ • ABDM (Ayushman Bharat Digital Mission) Health ID readiness  │
│    │                             │ • FHIR R4 medical record export schema support                │
└────┴─────────────────────────────┴───────────────────────────────────────────────────────────────┘
```

---

## 5. Formal Conclusion & Non-Production Readiness Declaration

**JeevanCare** displays high software craftsmanship, modular architecture, and modern full-stack engineering practices. However, because of the **P0 security items** (patient-level read overbreadth in Payload access rules and medical document download authorization missing patient ownership checks), **the system cannot be declared production-ready for real-world healthcare deployment until P0 and P1 items are remediated.**
