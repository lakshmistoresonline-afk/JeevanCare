# JeevanCare — India-First Business & Clinical Standardization Audit

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## 1. Executive Summary & Standardization Scope

**JeevanCare** has been transformed from its legacy defaults into a cohesive **India-First** clinical management platform, while preserving multi-currency/multi-timezone architecture for future international expansion.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             INDIA-FIRST STANDARDIZATION SUMMARY                          │
├─────────────────────┬────────────────────────────────┬───────────────────────────────────┤
│ Property            │ Legacy Neutral/Default          │ Hardened India Standard           │
├─────────────────────┼────────────────────────────────┼───────────────────────────────────┤
│ Default Currency    │ `PKR`                          │ `INR` / `₹` (Intl.NumberFormat)   │
│ Default Timezone    │ `Asia/Karachi`                 │ `Asia/Kolkata` (IST, UTC+5:30)    │
│ Default Country     │ `Pakistan`                     │ `India`                           │
│ Date Format         │ `MM/DD/YYYY`                   │ `DD/MM/YYYY` (`en-IN` standard)   │
│ Phone Format        │ Generic                        │ `+91` (7–15 digits validation)    │
│ PIN Code            │ Unvalidated                    │ 6-digit Indian PIN (`680001`)     │
│ States / UTs        │ Unstructured                   │ 36 Official Indian States & UTs   │
│ Doctor Registration │ Generic                        │ Reg No & State Medical Council    │
│ Primary UAT Seed    │ Pakistani Seed                 │ Thrissur City, Kerala UAT Dataset │
└─────────────────────┴────────────────────────────────┴───────────────────────────────────┘
```

---

## 2. Comprehensive Audit & Transformation Touchpoints

### A. Core Constants & Defaults (`src/lib/constants.ts`)
- Updated default constants: `DEFAULT_CURRENCY = 'INR'`, `DEFAULT_TIMEZONE = 'Asia/Kolkata'`, `DEFAULT_COUNTRY = 'India'`.
- First-class position for `INR` in `CURRENCIES` list and `Asia/Kolkata` in `TIMEZONES` list.
- Standardized `INDIAN_STATES` array covering all 36 States and Union Territories.

### B. Clinic Schema (`src/collections/Tenants.ts`)
- Default `country: 'India'`, `state: 'Kerala'`, `district: 'Thrissur'`.
- Clinic settings default to `Asia/Kolkata` timezone and `INR` currency.

### C. Doctor Profile & Registration Credentials (`src/collections/Users.ts`)
- Extended doctor user profiles with:
  - `qualification` (e.g. `MBBS, MD, MS, DNB`)
  - `medicalRegistrationNumber` (e.g. `KMC-2026-101`)
  - `stateMedicalCouncil` (e.g. `Travancore Cochin Medical Council`)
- Displayed on A5 printable prescriptions (`/print/prescription/[id]`) and billing receipts.

### D. Patient Address & PIN Validation (`src/collections/Patients.ts`)
- Structured address fields: `addressLine`, `city`, `district`, `state` (dropdown), and `pinCode`.
- Added 6-digit Indian PIN code validation (`/^[1-9][0-9]{5}$/`).

### E. Billing, UPI QR & Currency Formatting (`src/lib/format.ts` & `src/components/UpiQrCode.tsx`)
- `formatMoney()` uses `en-IN` locale, rendering Indian numbering format (`₹1,25,000`).
- Payment methods supported: `Cash`, `UPI`, `Card`, `Bank Transfer`.
- Dynamic UPI QR codes (`upi://pay?pa={phone}@upi&am={amount}`) rendered on printable receipts and invoice detail pages.

### F. Print Layouts & WhatsApp Messages (`src/lib/whatsapp.ts`)
- A5 Printable prescriptions include clinic letterhead, doctor qualifications, medical council registration number, and state medical council.
- WhatsApp prefilled message strings formatted in `₹` and Indian `DD/MM/YYYY` date/time style.

---

## 3. Verification & Compliance Matrix

- **`npx tsc --noEmit`**: **PASSED (0 TypeScript errors)**.
- **`npm run lint`**: **PASSED (0 ESLint errors)**.
- **`npm run build`**: **Compiled 46 routes successfully**.
