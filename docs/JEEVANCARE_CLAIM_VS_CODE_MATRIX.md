# JeevanCare — Documentation Claims vs. Actual Code Evidence Matrix

**Document Version:** 2.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## Claims Verification Matrix

| # | Claim | Documentation Source | Actual Code Evidence | Status | Gap | Required Action |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **India-first implementation with default INR currency & Asia/Kolkata timezone** | `README.md`, `docs/JEEVANCARE_INDIA_READINESS_AUDIT.md` | `src/lib/constants.ts` defines `DEFAULT_CURRENCY = 'INR'`, `DEFAULT_TIMEZONE = 'Asia/Kolkata'`, `DEFAULT_COUNTRY = 'India'`. `Tenants.ts` defaults to `country: 'India'`, `state: 'Kerala'`. | **VERIFIED IN CODE** | None. | None. |
| **2** | **Project Branding is JeevanCare** | `README.md`, `package.json`, App UI header | `package.json` names project `"jeevancare"`. UI header, patient portal, and public homepage render **JeevanCare**. | **VERIFIED IN CODE** | None. | None. |
| **3** | **Zero-cost WhatsApp appointment reminders via wa.me deep links** | `README.md`, `docs/JEEVANCARE_PATIENT_UX_AUDIT.md` | `src/lib/whatsapp.ts` provides `waReminderLink()` and `buildWhatsAppRxMessage()`. Rendered on prescription, invoice, and appointment screens. | **VERIFIED IN CODE** | None. | None. |
| **4** | **Atomic double-booking guard that rejects overlapping slots** | `README.md`, `docker-compose.yml`, `docs/JEEVANCARE_APPOINTMENT_ENGINE.md` | `src/lib/booking.ts` implements `findConflict()`, and `Appointments.ts` runs `findConflict()` inside a MongoDB transaction. `payload.config.ts` creates partial unique index `uniq_active_slot` on `{ tenant, doctor, start }`. | **VERIFIED IN CODE** | Requires MongoDB Replica Set (`rs0`). On standalone MongoDB, transactions act as no-op. | Enforce MongoDB Replica Set requirement in production deployment documentation and runtime checks. |
| **5** | **Tenant & Patient isolation: Patients can strictly read ONLY their own records** | `README.md`, `docs/JEEVANCARE_SECURITY_HARDENING.md` | `src/access/index.ts` defines `patientSelfAccess` restricting patient users to `patient: { equals: patientID }`. | **VERIFIED IN CODE** | None. | None. |
| **6** | **Medical Documents download authorization & binary magic byte validation** | `README.md`, `docs/JEEVANCARE_MEDICAL_DOCUMENT_SECURITY.md` | `/api/medical-documents/[id]` enforces tenant + patient ownership verification. `src/lib/fileSecurity.ts` validates binary magic bytes (PDF, JPEG, PNG, WEBP), 10 MB limit, and SHA-256 checksums. | **VERIFIED IN CODE** | None. | None. |
| **7** | **Safe Patient Registration & Account Claiming** | `README.md`, `docs/JEEVANCARE_PATIENT_IDENTITY_MODEL.md` | `src/app/(frontend)/patient/register/actions.ts` requires Patient MRN or 6-digit Activation Code to claim an existing front-desk record. `payload.config.ts` enforces `uniq_patient_profile_portal` index. | **VERIFIED IN CODE** | None. | None. |
| **8** | **Thrissur City UAT Test Dataset with pre-configured accounts** | `docs/JEEVANCARE_TEST_CREDENTIALS.md`, `docs/JEEVANCARE_UAT_TEST_SCENARIOS.md` | `src/seedTest.ts` seeds 10 Thrissur City clinics, 7 specialist doctors, 10 patient accounts, and 8 explicit clinical UAT scenarios. Idempotent execution verified. | **VERIFIED IN CODE** | None. | None. |
| **9** | **Printable A5 Prescriptions and Receipts via @media print** | `README.md`, `DEPLOYMENT_GUIDE.md` | `src/app/(frontend)/print/prescription/[id]/page.tsx` and `receipt/[id]/page.tsx` render A5 CSS print layouts with doctor qualifications, medical council reg number, and clinic letterhead. | **VERIFIED IN CODE** | None. | None. |
| **10** | **Dynamic UPI Payment QR Codes for instant billing** | `src/components/UpiQrCode.tsx` | `UpiQrCode.tsx` renders `upi://pay?pa=...` QR codes on printable receipts and invoice detail pages. | **VERIFIED IN CODE** | None. | None. |

---

## Key Verification Summary

### 1. Currency & Timezone Alignment
- **Documentation Claims:** India-first platform built for Kerala / Thrissur City clinics (`INR`, `Asia/Kolkata`).
- **Code Implementation:** `src/lib/constants.ts` specifies `DEFAULT_CURRENCY = 'INR'`, `DEFAULT_TIMEZONE = 'Asia/Kolkata'`, `DEFAULT_COUNTRY = 'India'`.

### 2. Branding Alignment
- **Documentation Claims:** **JeevanCare** platform.
- **Code Implementation:** `package.json` names project `"jeevancare"`. Displays **JeevanCare** ("Your Trusted Healthcare Companion") across all headers, patient portal screens, and login pages.

### 3. Patient Access Control Scope
- **Documentation Claims:** Strict data isolation and privacy.
- **Code Implementation:** `patientSelfAccess` restricts patient users to `patient: { equals: patientID }` across `Appointments`, `Visits`, `Invoices`, and `MedicalDocuments` collections.
