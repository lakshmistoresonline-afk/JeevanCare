# JeevanCare — Modern Healthcare Platform & Clinic Management

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![GitHub](https://img.shields.io/badge/Repository-JeevanCare-0d6e60.svg)](https://github.com/lakshmistoresonline-afk/JeevanCare)

A multi-tenant **healthcare and OPD clinic management platform** built for **Indian clinics, practitioners, and patients** with **Next.js 16 (App Router + Turbopack)**, **Payload CMS 3**, and **MongoDB**.

Clinics share a secure multi-tenant deployment with strict data isolation (`patientSelfAccess` and `tenantScoped`), keeping patient health records, OPD queue tokens, consultations, A5 prescriptions, and ₹ INR billing completely isolated between clinics.

---

## 🎯 Target Context: Indian Clinics & Outpatient OPDs

JeevanCare is designed around the daily operational workflows of Indian outpatient clinics:
- **India Defaults:** Currency (`INR` / `₹`), Timezone (`Asia/Kolkata` IST, UTC+5:30), Date (`DD/MM/YYYY`), Phone (`+91`), and 6-digit Indian PIN codes.
- **OPD Queue & Token Display:** Walk-in OPD token generator (`T-01`, `T-02`), live 4-step queue progress stepper, audio token callouts, and reception wall poster QR self check-in.
- **Doctor Consultation & EMR:** Split-pane EMR workspace with vitals trend lines (`recharts`), quick dosage chips (`1-0-1 BD`), treatment kits (*Fever Protocol*, *Gastritis Kit*), Web Speech API voice dictation, and e-Signatures.
- **Prescriptions & Billing:** 1-click A5 printable prescriptions, dynamic UPI payment QR codes (`upi://pay?pa=...`), 1-tap WhatsApp sharing, and patient portal access.

---

## 🩺 Core Workflows

1. **Patient Registration & Self-Account Claiming:** Register via `+91` mobile numbers with MRN auto-assignment (`P-0001`). Existing front-desk records are safely claimed using Patient MRN or 6-digit Activation Code.
2. **Appointment Scheduling & Availability:** Real-time doctor schedule windows (`regular`, `onCall`, `byAppointment`) with clickable available time slot chips.
3. **Double-Booking Guard:** Slot reservation concurrency check (`findConflict()`) executing inside **MongoDB Replica Set (`rs0`) Transactions** backed by a partial unique index `uniq_active_slot`.
4. **OPD Queue & Check-In:** Patient check-in updating status to `checked-in` and calculating live queue position and wait times.
5. **Consultation & Prescriptions:** Doctor records symptoms, diagnosis, vitals, and prescription rows, automatically completing the appointment.
6. **Medical Document Management:** Diagnostic lab report uploads with strict binary magic byte validation (PDF, JPEG, PNG, WEBP), 10 MB size limits, and SHA-256 integrity checksums.
7. **Billing & Receipts:** Server-derived totals (`totalAmount`, `amountPaid`, `balanceDue`, `paymentStatus`) in `₹ INR`. Dynamic UPI payment QR codes and payment lock guards after first payment.
8. **Follow-Up & Patient History:** Chronological longitudinal timeline (`-visitDate`) merging visits, prescriptions, lab reports, and invoice receipts.

---

## ⚡ Quick Start & Local Development

### Requirements
- **Node.js**: `v20.x` or higher
- **MongoDB**: `7.0` running as a **Single-Node Replica Set (`rs0`)** *(Mandatory for MongoDB multi-document transactions during slot reservations)*

### Setup Instructions

```bash
# 1. Install dependencies
npm install

# 2. Environment configuration
cp .env.example .env

# 3. Start local MongoDB Replica Set (rs0) via Docker
docker compose up -d

# 4. Seed Thrissur City Kerala UAT test dataset
npm run seed:test

# 5. Start Next.js development server
npm run dev
```

Visit `http://localhost:3000` to view the JeevanCare public portal.

---

## 🔑 Test Credentials (UAT Environment)

Seeded password for all UAT test accounts: **`Test@123`**

| Persona | Login Email | Scope |
| :--- | :--- | :--- |
| **Super Admin** | `admin@test.com` | Super console & platform management |
| **Clinic Owner** | `owner1@test.com` | Swaraj Medical Centre (Thrissur, Kerala) |
| **Receptionist** | `staff1@test.com` | Front-desk OPD queue & check-in |
| **Specialist Doctor**| `doctor1@test.com` | Dr. Sabitha Krishnamoorthy (Internal Medicine) |
| **Patient Portal** | `patient1@test.com` | Thrissur Patient 1 (History, Prescriptions, Paid Bill) |

*(For complete credentials across all 10 Thrissur City clinics, see [`docs/JEEVANCARE_TEST_CREDENTIALS.md`](docs/JEEVANCARE_TEST_CREDENTIALS.md))*

---

## 🧪 Automated Testing

```bash
# 1. Type check
npx tsc --noEmit

# 2. Linter check
npm run lint

# 3. Vitest Integration Test Suite
npm run test:int

# 4. Next.js Production Build
npm run build
```

---

## 📁 Repository Structure

```
src/
  access/         # Tenant isolation & patientSelfAccess rules
  app/(frontend)/ # Patient portal, staff dashboard, print layouts, homepage
  collections/    # Tenants, Users, Patients, Appointments, Visits, Invoices, MedicalDocuments, AuditLogs
  components/     # EMR workspace, CommandPalette, UpiQrCode, QueueAudioAnnouncer, VitalsChart
  hooks/          # forceTenant, planLimit, audit logging hooks
  lib/            # booking.ts, availability.ts, fileSecurity.ts, fhir/
  seedTest.ts     # Thrissur City Kerala UAT dataset seeder
tests/
  int/            # Security, Booking Engine, Patient Registration, Billing & Medical Document integration tests
  e2e/            # Playwright End-to-End test suites across 51 workflows
```

---

## 🙌 Credits & Licensing

- **Original Foundation:** Based on *matab / clinic-management* by [Abdul Rehman](https://github.com/abdulrehmankz1).
- **License:** Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
