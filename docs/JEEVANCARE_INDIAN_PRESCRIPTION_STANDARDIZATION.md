# JeevanCare — Indian Doctor Credentials & A5 Prescription Standardization

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)
**Compliance Standard:** National Medical Commission (NMC) Registered Medical Practitioner Guidelines & Indian Prescription Format.

---

## 1. Executive Summary & Design Layout

In **JeevanCare**, printable prescriptions are rendered from the **saved, immutable clinical consultation record** (`visits` collection) in a standardized A5 print layout formatted for Indian clinical practice:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             A5 PRINTABLE PRESCRIPTION LAYOUT                             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ CLINIC LETTERHEAD: Clinic Name, Address, City, State, Phone                              │
├────────────────────────────────────────┬─────────────────────────────────────────────────┤
│ DOCTOR CREDENTIALS:                    │ CONSULTATION METADATA:                          │
│ • Doctor Name (e.g. Dr. Kavya Nair)    │ • Date (DD/MM/YYYY)                             │
│ • Qualification (e.g. MBBS, MD)        │ • Patient Name, MRN, Age, Gender                │
│ • Reg No: KMC-2026-101                 │ • Vitals: BP, Temp (°C), Pulse, Weight (kg)     │
│ • Council: Travancore Cochin Medical   │ • Diagnosis / Provisional Diagnosis             │
├────────────────────────────────────────┴─────────────────────────────────────────────────┤
│ ℞ PRESCRIPTION TABLE:                                                                    │
│ 1. Paracetamol 650mg — 1 tablet · 1-0-1 BD · for 5 days · After food                     │
│ 2. Vitamin C 500mg — 1 tablet · 1-0-0 OD · for 10 days · Morning                         │
├────────────────────────────────────────┬─────────────────────────────────────────────────┤
│ FOLLOW-UP:                             │ DOCTOR SIGNATURE AREA:                          │
│ • Date: 13/10/2026 (or "As needed")    │ • e-Signature / Signature Line                  │
│                                        │ • Doctor Name & Medical Council Reg No.         │
└────────────────────────────────────────┴─────────────────────────────────────────────────┘
```

> [!IMPORTANT]
> **NO DIAGNOSTIC AI DISCLAIMER:**
> JeevanCare is strictly a **record-management system**, not an autonomous medical advisor or diagnostic AI. Prescriptions reflect the exact clinical entries saved by the attending doctor.

---

## 2. Implemented Doctor Credential & Prescription Controls

### A. Doctor Profile Credential Fields (`src/collections/Users.ts`)
- **Qualification:** e.g. `MBBS, MD`, `MS`, `DNB`
- **Medical Council Registration Number:** e.g. `KMC-2026-101`
- **State Medical Council / Registration Authority:** e.g. `Travancore Cochin Medical Council`
- **Access Lock:** Non-superAdmin users cannot tamper with doctor credentials or registration numbers (`access: { update: superAdminOrOwnerField }`).

### B. Prescription Data Mapping
- **Medicine Name & Dosage:** Free-text medicine input with quick dosage chips (`1-0-1 BD`, `1-0-0 OD`, `0-0-1 HS`).
- **Frequency Codes:** Mapped to standard clinical abbreviations (`OD`, `BD`, `TDS`, `QID`, `SOS`).
- **Instructions:** Meal instructions (`After food`, `Before food`, `At bedtime`).
- **1-Tap WhatsApp Distribution:** Generates formatted WhatsApp prescription summaries via `WhatsAppShareButton`.

---

## 3. Automated Integration Test Coverage (`tests/int/prescriptionPrint.int.spec.ts`)

- **Doctor Profile Credentials:** Verified storage of qualification, medical registration number, and state medical council.
- **A5 Prescription Rendering:** Verified fetching and rendering saved visit records containing doctor credentials, vitals line, diagnosis, and prescription rows.
