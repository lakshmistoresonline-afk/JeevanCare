# JeevanCare — Comprehensive UAT Test Scenarios & Verification Report

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## 1. Overview & Verification Summary

This document specifies the user acceptance test (UAT) scenarios pre-seeded in the JeevanCare test environment (`npm run seed:test`) and provides a clear breakdown of **Seed Verification**, **Automated Testing**, and **Manual UAT Steps**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             THREE-TIER VERIFICATION SUMMARY                              │
├─────────────────┬───────────────────────────────────┬────────────────────────────────────┤
│ Tier            │ Component / Script                │ Scope & Proof                      │
├─────────────────┼───────────────────────────────────┼────────────────────────────────────┤
│ 1. Seed         │ `npm run seed:test`               │ Idempotent dataset creation        │
│    Verification │                                   │ (Verified clean double execution)  │
├─────────────────┼───────────────────────────────────┼────────────────────────────────────┤
│ 2. Automated    │ `tests/int/uatEnvironment.int.spec`│ Tenant isolation, IDOR prevention, │
│    Testing      │ `tests/int/security.int.spec`     │ Document & Invoice protection      │
├─────────────────┼───────────────────────────────────┼────────────────────────────────────┤
│ 3. Manual UAT   │ Patient Portal (`/patient/login`) │ Full 18-step patient & clinic UX   │
│    Scenarios    │ Staff Dashboard (`/login`)        │ consultation & billing journey     │
└─────────────────┴───────────────────────────────────┴────────────────────────────────────┘
```

---

## 2. Pre-Seeded UAT Test Scenarios

### Scenario 1: NEW PATIENT (`patient5@test.com`)
- **Setup:** Patient 5 has no prior consultation history. Has one `scheduled` appointment for tomorrow at 10:00 am.
- **Testing Focus:** First-time booking flow, slot selection, and appointment confirmation.

### Scenario 2: RETURNING PATIENT WITH HISTORY & PAID BILL (`patient1@test.com`)
- **Setup:** Patient 1 has a completed consultation visit with Dr. Sabitha Krishnamoorthy, vitals (BP 120/80), diagnosis ("Acute Viral Fever"), prescription (`Paracetamol 650mg`), follow-up date, and a fully paid receipt (`INV-0001` ₹1100).
- **Testing Focus:** Viewing medical history, printing A5 prescription, downloading paid receipt.

### Scenario 3: PATIENT WITH MEDICAL DOCUMENTS & UNPAID BILL (`patient2@test.com`)
- **Setup:** Patient 2 has a checked-in appointment (Token `#T-01`), uploaded lab report PDF (`blood_report.pdf`, SHA-256 checksum), and an unpaid invoice (`INV-0002` ₹600).
- **Testing Focus:** Lab report PDF viewing, dynamic UPI QR Code payment (`upi://pay?pa=...`).

### Scenario 4: PATIENT WITH PRESCRIPTION & FOLLOW-UP (`patient3@test.com`)
- **Setup:** Patient 3 has a consultation visit with diagnosis ("Essential Hypertension"), prescription (`Amlodipine 5mg`, `Telmisartan 40mg`), and follow-up date set for 14 days out.
- **Testing Focus:** Prescription view, 1-tap WhatsApp sharing, follow-up calendar reminder.

### Scenario 5: PATIENT WITH CANCELLED & NO-SHOW APPOINTMENTS (`patient4@test.com`)
- **Setup:** Patient 4 has one `cancelled` appointment (reason: "Patient personal emergency") and one `no-show` appointment.
- **Testing Focus:** Verifying cancelled appointments free up doctor slots while remaining in audit timeline.

### Scenario 6: CROSS-TENANT ISOLATION (`patient7@test.com` to `patient10@test.com`)
- **Setup:** Patients 7 to 10 are distributed across Swaraj Medical Centre, Mission Quarters Health Clinic, and Ayyanthole Family Practice.
- **Testing Focus:** Verifying strict multi-tenant data boundaries (Patient in Clinic A cannot view Clinic B records).

---

## 3. Tier 1: Seed Verification Report

- **Script:** `src/seedTest.ts` (`npm run seed:test`)
- **Idempotency Proof:** `seedTest.ts` executes cleanly on consecutive invocations without throwing duplicate key errors or leaving duplicate records.

---

## 4. Tier 2: Automated Testing Matrix (`tests/int/uatEnvironment.int.spec.ts`)

| Test Suite | Scenario Covered | Assertion Result |
| :--- | :--- | :--- |
| **Tenant Isolation** | Owner A querying Clinic B patients | **Passed** (0 Clinic B records returned) |
| **Patient Ownership** | Patient A querying appointments | **Passed** (Only Patient A records returned) |
| **Duplicate Portal Block** | Registering second user for same patient profile | **Passed** (Rejected with 409 Duplicate) |
| **Document Protection** | Patient B accessing Patient A lab report | **Passed** (Denied with 403 Forbidden) |

---

## 5. Tier 3: Manual UAT Step-by-Step Guide

1. **Staff Sign In:**
   - URL: `/login`
   - Email: `staff1@test.com` | Password: `Test@123`
   - Verify front-desk dashboard loads Swaraj Medical Centre.
2. **Patient Sign In:**
   - URL: `/patient/login`
   - Email: `patient1@test.com` | Password: `Test@123`
   - Verify live queue tracker, active prescriptions, and paid invoices appear.
3. **Book Appointment:**
   - URL: `/patient/appointments/book`
   - Select Dr. Sabitha Krishnamoorthy ➔ Choose date ➔ Click available slot ➔ Confirm.
4. **UPI Bill Settlement:**
   - URL: `/patient/billing`
   - View unpaid invoice ➔ Scan UPI QR code ➔ Verify receipt printing in A5 format.
