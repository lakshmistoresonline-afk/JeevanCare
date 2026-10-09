# JeevanCare — Public Website & Visual Storytelling Audit

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## 1. Executive Summary & Design Transformation Strategy

The **JeevanCare Public Website** (`src/app/(frontend)/page.tsx`) conveys a authentic **India-First Public Showcase** highlighting real OPD clinic workflows in Indian outpatient clinics.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            AUTHENTIC INDIAN CLINIC SHOWCASE                             │
├─────────────────────┬────────────────────────────────┬───────────────────────────────────┤
│ Component           │ Legacy Generic Template        │ Redesigned India-First Showcase   │
├─────────────────────┼────────────────────────────────┼───────────────────────────────────┤
│ Hero Headline       │ "Clinic Management Software"   │ "Healthcare Management Built for  │
│                     │                                │  Indian Clinics"                  │
│ Doctor Artifact     │ Generic Doctor                 │ Dr. Kavya Nair (MBBS, MD)         │
│                     │                                │ Reg: KMC-2026-101                 │
│ Clinic Context      │ Generic Clinic                 │ JeevanCare Thrissur Clinic        │
│ Patient Artifact    │ Generic Patient                │ Anita Krishnan (+91 98470 11111)  │
│ OPD Token Tracker   │ Unspecified                    │ Token #T-01 · 06/10/2026 · ₹500  │
│ Statistics / Claims │ Fake Counts ("10k+ Clinics")   │ Stripped 100% · Real Features Only│
└─────────────────────┴────────────────────────────────┴───────────────────────────────────┘
```

---

## 2. Public Homepage Workflow Sequence Audit

The public homepage depicts all 11 core steps of the Indian clinical OPD workflow:
1. **Find Doctor:** Interactive search in `ClinicDoctorFinder` by doctor name or specialty (`General Physician`, `Pediatrics`).
2. **View Actual Availability:** Real doctor availability schedule windows (`09:00 - 17:00`) in `Asia/Kolkata` IST timezone.
3. **Book Appointment:** Clickable time slot selection (`9:00 am`, `9:15 am`) via `getAvailableSlots()`.
4. **Check-In:** Self-serve check-in or front-desk check-in updating status to `checked-in`.
5. **Queue / Token:** OPD Queue Token generation (e.g., `#T-01`) and 4-step live progress stepper.
6. **Consultation:** Split-Pane EMR Workspace with vitals trend line charts (`recharts`).
7. **Prescription:** NMC-compliant A5 printable prescriptions and 1-tap WhatsApp sharing (`WhatsAppShareButton`).
8. **Reports / Documents:** Diagnostic lab report PDF viewer with binary magic byte validation and SHA-256 checksums.
9. **₹ Billing / Payment:** Server-calculated financial totals, receipt printing, and dynamic UPI QR code (`upi://pay?pa=...`).
10. **Follow-Up:** Follow-up date scheduling and calendar reminders.
11. **Patient History:** Merged longitudinal patient timeline (`-visitDate`) aggregating visits, prescriptions, lab reports, and receipts.

---

## 3. Non-Negotiable Removals & Synthetic UAT Dataset

- **Stripped Fake Statistics:** Removed all fake numbers ("10,000+ clinics", "1M+ patients served").
- **Stripped Unsupported Claims:** No unverified claims of government approval or official ABDM integration.
- **Authentic Indian Context:** Features Indian doctors, patients, clinic reception, ₹ INR billing, and `+91` mobile registration without excessive or decorative flag imagery.
- **Synthetic UAT Dataset Examples:**
  - `Dr. Kavya Nair` (MBBS, MD · Reg: KMC-2026-101)
  - `JeevanCare Thrissur Clinic` (Thrissur, Kerala)
  - `Anita Krishnan` (`+91 98470 11111` · MRN: `P-0001`)
  - Date: `06/10/2026` · Fee: `₹500`
