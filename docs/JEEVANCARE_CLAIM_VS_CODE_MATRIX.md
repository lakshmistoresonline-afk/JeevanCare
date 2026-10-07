# JeevanCare — Documentation Claims vs. Actual Code Evidence Matrix

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## Claims Verification Matrix

| # | Claim | Documentation Source | Actual Code Evidence | Status | Gap | Required Action |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **India-first implementation with default INR currency & Asia/Kolkata timezone** | `docs/JEEVANCARE_THRISSUR_CITY_UAT_DATASET.md`, `docs/JEEVANCARE_TEST_CREDENTIALS.md` | `src/lib/constants.ts` (lines 78–79) defines `DEFAULT_CURRENCY = 'PKR'` and `DEFAULT_TIMEZONE = 'Asia/Karachi'`. `src/collections/Tenants.ts` defaults to `country: 'Pakistan'`. | **CONTRADICTION** | Code defaults to Pakistan (`PKR`, `Asia/Karachi`), while documentation claims India-first (`INR`, `Asia/Kolkata`). | Update `src/lib/constants.ts` and `src/collections/Tenants.ts` defaults to `INR` and `Asia/Kolkata`. |
| **2** | **Project Branding is JeevanCare** | `DEPLOYMENT_GUIDE.md`, App UI header | `README.md` header states `# matab — Clinic Management`. `package.json` names project `"clinic-management"`. | **PARTIAL MATCH** | UI displays "JeevanCare", but `README.md` and `package.json` refer to the legacy template name "matab". | Update `README.md` title and text to "JeevanCare". |
| **3** | **Zero-cost WhatsApp appointment reminders via wa.me deep links** | `README.md` (v3 features), `demo-videos/reminders-flow.gif` | `src/lib/whatsapp.ts` provides `waReminderLink()` and `buildWhatsAppRxMessage()`. `PatientAppointmentBooker.tsx` and `PrescriptionPrintPage` render WhatsApp share buttons. | **VERIFIED IN CODE** | None. | None. |
| **4** | **Atomic double-booking guard that rejects overlapping slots** | `README.md`, `docker-compose.yml` | `src/lib/booking.ts` implements `findConflict()`, and `Appointments.ts` runs `findConflict()` inside a MongoDB transaction. `payload.config.ts` creates partial unique index `uniq_active_slot` on `{ tenant, doctor, start }`. | **VERIFIED IN CODE** | Requires MongoDB Replica Set (`rs0`). On standalone MongoDB, transactions act as no-op. Overlapping slots with different start times rely on transaction atomicity. | Enforce MongoDB Replica Set requirement in production deployment documentation and runtime checks. |
| **5** | **Tenant isolation: A clinic can never see or touch another clinic's data** | `README.md`, `DEPLOYMENT_GUIDE.md` | `src/access/index.ts` defines `tenantScoped` for staff. `src/hooks/tenant.ts` enforces `forceTenant`. However, `patientTenantScoped` assigns `tenantScoped` to patients, allowing patient users to query ALL appointments/visits in their clinic via API. | **PARTIAL / SECURITY HAZARD** | Tenant isolation works between clinics (Tenant A cannot see Tenant B), but patient users within Tenant A can read other patients' records in Tenant A via Payload API. | Implement `patientSelfAccess` rule in `src/access/index.ts` restricting patient reads to `patient: { equals: patientID }`. |
| **6** | **Medical Documents PDF/Image viewing for patients** | `README.md`, Patient Portal | `/api/medical-documents/[id]` serves files from `media/` directory. | **VERIFIED IN CODE (Requires Guard Fix)** | `/api/medical-documents/[id]` checks `tenantID` but fails to check patient ownership (`doc.patient === patientID`). | Add patient ownership check to `/api/medical-documents/[id]/route.ts`. |
| **7** | **Self-serve signup creates clinic + owner + sample data atomically in one transaction** | `README.md`, `src/app/(frontend)/signup/actions.ts` | `signupAction` creates tenant, owner user, sample doctor, patients, and initial appointments. | **VERIFIED IN CODE** | None. | None. |
| **8** | **Thrissur City UAT Test Dataset with pre-configured accounts** | `docs/JEEVANCARE_TEST_CREDENTIALS.md`, `docs/JEEVANCARE_THRISSUR_CITY_UAT_DATASET.md` | `src/seedTest.ts` seeds 10 Thrissur City clinics, 26 specialist doctors, 10 patient accounts, and `admin@test.com` with password `Test@123`. | **VERIFIED IN CODE** | `npm run seed` runs Pakistani seed (`src/seed.ts`), whereas `npm run seed:test` runs Thrissur City seed (`src/seedTest.ts`). | Document clearly that `npm run seed:test` is the primary dataset for JeevanCare India UAT testing. |
| **9** | **Printable A5 Prescriptions and Receipts via `@media print`** | `README.md`, `DEPLOYMENT_GUIDE.md` | `src/app/(frontend)/print/prescription/[id]/page.tsx` and `receipt/[id]/page.tsx` render A5 CSS print layouts with `window.print()` triggers. | **VERIFIED IN CODE** | None. | None. |
| **10** | **Dynamic UPI Payment QR Codes for instant billing** | `src/components/UpiQrCode.tsx` | `UpiQrCode.tsx` renders `upi://pay?pa=...` QR codes on printable receipts and invoices. | **VERIFIED IN CODE** | None. | None. |

---

## Key Contradictions Summary

### 1. Currency & Timezone Contradiction
- **Documentation Claims:** India-first platform built for Kerala / Thrissur City clinics (`INR`, `Asia/Kolkata`).
- **Code Default:** `src/lib/constants.ts` specifies `DEFAULT_CURRENCY = 'PKR'`, `DEFAULT_TIMEZONE = 'Asia/Karachi'`, `DEFAULT_COUNTRY = 'Pakistan'`.

### 2. Branding Contradiction
- **Documentation Claims:** `# matab — Clinic Management` in `README.md`.
- **Code UI:** Displays **JeevanCare** ("Your Trusted Healthcare Companion") across all headers, patient portal screens, and login pages.

### 3. Patient Access Control Scope Contradiction
- **Documentation Claims:** Strict data isolation and privacy.
- **Code Policy:** `patientTenantScoped` allows a patient user to fetch tenant-wide appointments and visits via Payload API endpoints unless scoped at the application level.
