# JeevanCare — India-First Defaults & Business Consistency Audit

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## 1. Executive Summary & Default Re-alignment

**JeevanCare** is standardized around **India** as the primary default market while preserving the multi-currency, multi-timezone architecture for future global extensibility.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            HARDENED INDIA DEFAULTS SUMMARY                               │
├─────────────────────┬────────────────────────────────┬───────────────────────────────────┤
│ Domain Touchpoint   │ Legacy Default                 │ Hardened India Standard           │
├─────────────────────┼────────────────────────────────┼───────────────────────────────────┤
│ Country             │ `Pakistan`                     │ `India`                           │
│ Currency            │ `PKR`                          │ `INR` / `₹` (`en-IN` formatting)  │
│ Timezone            │ `Asia/Karachi`                 │ `Asia/Kolkata` (IST, UTC+5:30)    │
│ Phone Prefix        │ `+92`                          │ `+91`                             │
│ Date Format         │ `MM/DD/YYYY`                   │ `DD/MM/YYYY`                      │
│ PIN Code            │ Unvalidated                    │ 6-digit Indian PIN (`680001`)     │
│ States / UTs        │ Unstructured                   │ 36 Official Indian States & UTs   │
└─────────────────────┴────────────────────────────────┴───────────────────────────────────┘
```

---

## 2. Audit Results Across 18 Touchpoints

1. **Tenant Creation (`src/collections/Tenants.ts`)**:
   - Default `country: 'India'`, `state: 'Kerala'`, `district: 'Thrissur'`, `currency: 'INR'`, `timezone: 'Asia/Kolkata'`.
2. **Signup Onboarding (`src/app/(frontend)/signup/actions.ts`)**:
   - Primary country selection defaults to India (`INR` & `Asia/Kolkata`).
3. **Clinic Settings (`src/lib/constants.ts`)**:
   - Defaults: `DEFAULT_CURRENCY = 'INR'`, `DEFAULT_TIMEZONE = 'Asia/Kolkata'`, `DEFAULT_COUNTRY = 'India'`.
4. **Invoices & Billing (`src/collections/Invoices.ts`)**:
   - Currency snapshotted as `INR` at creation. Derived totals computed in `₹ INR`.
5. **Receipts (`/print/receipt/[id]`)**:
   - Renders ₹ INR totals and dynamic UPI payment QR code (`upi://pay?pa=...`).
6. **Prescriptions (`/print/prescription/[id]`)**:
   - A5 print layout featuring doctor qualifications (`MBBS, MD`), medical council registration number, state medical council, and clinic letterhead.
7. **Appointment UI (`PatientAppointmentBooker.tsx`)**:
   - Clickable slots displayed in Indian local time (`9:00 am`, `9:15 am`) and dates formatted as `DD/MM/YYYY`.
8. **Patient Registration (`/patient/register`)**:
   - Inputs for `+91` mobile, state selection from official 36 Indian States/UTs, and 6-digit PIN code validation.
9. **Patient Profile (`/patient/profile`)**:
   - Displays patient MRN (`P-0001`), mobile (`+91`), blood group, and allergy banner.
10. **Reports & Financial Dashboards (`src/lib/reports.ts`)**:
    - Revenue calculations grouped by IST day (`Asia/Kolkata`) and summed in `INR`.
11. **CSV Data Exports (`/api/export/[type]`)**:
    - Generates UTF-8 CSV exports with `jeevancare-` prefix and logs `export.generated` audit event.
12. **Emails (`src/lib/email.ts`)**:
    - Transactional emails sent via Resend branded for JeevanCare Clinics.
13. **WhatsApp Deep Links (`src/lib/whatsapp.ts`)**:
    - Pre-filled WhatsApp message strings formatted in `₹ INR` and Indian date/time style.
14. **Seed Data (`src/seedTest.ts` & `src/seed.ts`)**:
    - Pre-seeds 10 Thrissur City, Kerala clinics, 7 specialist doctors, and 10 patient portal accounts with password `Test@123`.
15. **Test Fixtures (`tests/int/fixtures.ts`)**:
    - Synthetic test data using `0300...` test mobile numbers and password `password123`.
16. **Public Homepage (`src/app/(frontend)/page.tsx`)**:
    - Showcases real Indian clinic workflows featuring Dr. Kavya Nair, JeevanCare Thrissur Clinic, Token `#T-01`, and `₹500` consultation fee.
17. **Documentation (`README.md` & `docs/`)**:
    - All documentation reconciled to JeevanCare India-First branding.

---

## 3. Final Repository Search & Legacy Reference Classification

A full-text repository audit for legacy template strings (`PKR`, `Asia/Karachi`, `Pakistan`, `matab`, `clinic-management`) yields the following classification:

- **Source Code (`src/lib/constants.ts`)**: Retained in `CURRENCIES`, `TIMEZONES`, and `COUNTRY_DEFAULTS` option lists as **Intentional Configurable Options** to preserve multi-country platform extensibility.
- **Payload Schema Types (`src/payload-types.ts`)**: Retained in generated TypeScript union types (`INR | PKR | USD | GBP | AED | SAR`) for backward schema compatibility.
- **MIT License Attribution (`LICENSE` & `README.md`)**: Retained as required open-source copyright attribution to original foundation.
- **User-Facing Product UI & Documentation:** **100% Reconciled to JeevanCare India-First Platform.**
