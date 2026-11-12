# JeevanCare Platform — Master Product Architecture, Security Audit & Operational Presentation Report

> **Executive Product & Architecture Overview**
> **Platform Name:** JeevanCare — Your Trusted Healthcare Companion
> **Live Production Web Application:** [https://jeevan-care-sooty.vercel.app](https://jeevan-care-sooty.vercel.app)
> **Brand Identity:** Simple, connected healthcare for patients, doctors, and clinics.
> **Designed & Developed by:** Subramanian T S, WebCraft Digital Solutions.

---

## 1. Executive Summary & Platform Architecture

JeevanCare is a next-generation, multi-tenant healthcare SaaS workspace specifically engineered for Indian clinics, nursing homes, and outpatient departments (OPD). The platform connects **Clinic Owners**, **Attending Doctors**, **Receptionists / Front-Desk Staff**, **Patients**, and **Super Administrators** into a single synchronized ecosystem.

### Live Application Link
- **Web App URL:** [https://jeevan-care-sooty.vercel.app](https://jeevan-care-sooty.vercel.app)

### Workflow & Business Objective
- **Primary Landing Page (`/`):** Establishes platform identity, Indian clinic compliance standards (₹ INR, +91 Mobile, ABDM/UPI QR), and product capabilities. Allows unauthenticated visitors to search clinic directories or register a clinic.

![Figure 1.1: JeevanCare Brand Value Proposition & Landing Page Overview](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_01_landing.png)

```mermaid
graph TD
    A["Clinic Workspace (JeevanCare)"] --> B["Clinic Owner / Admin"]
    A --> C["Attending Doctors"]
    A --> D["Receptionists / Front Desk"]
    A --> E["Patients (Portal & PWA)"]
    A --> F["Super Administrator"]

    B -->|Manage| G["Staff, Billing, Reports, Plans"]
    C -->|Execute| H["Consultations, Split EMR, Prescriptions"]
    D -->|Manage| I["Walk-in Tokens, Check-in, Invoices"]
    E -->|Access| J["Self-Booking, History, UPI Payments"]
    F -->|Govern| K["Tenant Isolation, Audits, Verification"]
```

---

## 2. Database Schema & Payload CMS Collections

The platform data layer is built on Payload CMS 3.85 over MongoDB, enforcing clinic-level tenant isolation across 9 core collections:

| Collection | Primary Entity Role | Key Field Attributes | Isolation & Index Safety |
| :--- | :--- | :--- | :--- |
| **Tenants** | Clinic Workspaces | `name`, `slug`, `city`, `phone`, `settings` (timezone, currency, openTime, closeTime) | Root multi-tenant scope boundary (`tenantID`). |
| **Users** | Accounts & Roster | `email`, `name`, `role` (owner, doctor, receptionist, patient, superAdmin), `specialty`, `active` | Partial index: `uniq_patient_profile_portal` (role='patient'). |
| **Patients** | Medical Roster | `mrn`, `name`, `phone`, `gender`, `allergies`, `city`, `bloodGroup` | Compound index: `idx_patients_tenant_created` (`{ tenant: 1, createdAt: -1 }`). |
| **Appointments** | OPD Slot Rail | `tenant`, `doctor`, `patient`, `start`, `end`, `status`, `isWalkIn`, `tokenNumber`, `tokenDay` | Partial unique index: `uniq_active_slot` & `uniq_walkin_token` (`{ tenant: 1, tokenDay: 1, tokenNumber: 1 }`). |
| **Visits** | EMR Consultations | `appointment`, `visitDate`, `vitals` (BP, Pulse, Weight, SpO2, RBS), `symptoms`, `diagnosis`, `prescription` | 1 visit per checked-in appointment with past EMR history lookup. |
| **Invoices** | Billing & Receipts | `invoiceNumber`, `patient`, `totalAmount`, `amountPaid`, `balanceDue`, `payments` (amount, method, receivedAt) | Compound index: `idx_invoices_tenant_voided_created` (`{ tenant: 1, voided: 1, createdAt: -1 }`). |
| **MedicalDocuments** | Document Vault | `patient`, `filename`, `fileCategory`, `checksumSha256`, `fileUrl` | Fail-closed direct HTTP access rules with SHA-256 integrity verification. |
| **Medicines** | Directory Search | `brandName`, `genericName`, `strength`, `category`, `defaultFrequency`, `defaultDurationDays` | Indian essential medicines catalog with 200ms debounced search API. |
| **AuditLogs** | Security Compliance | `action`, `user`, `tenant`, `ipAddress`, `timestamp` | Immutable audit log tracking all patient data access and export events. |

---

## 3. Authentication & Configurable Quick Login

### Workflow & Business Objective
- **1-Click Quick Login Toolbar (`/login`):** Enables instant role-switching between Super Admin, Clinic Owner, Doctor, Receptionist, and Patient accounts during demonstration and daily operations. Populates credentials with zero typing required.
- **Self-Serve Clinic Onboarding Wizard (`/signup`):** Allows new clinic owners to register a dedicated multi-tenant clinic workspace in minutes, establishing an isolated database boundary (`tenantID`).

![Figure 2.1: Authentication Screen featuring Configurable 1-Click Quick Login Toolbar](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_02_login.png)

![Figure 2.2: Self-Serve Clinic Registration Wizard](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_03_signup.png)

---

## 4. Complete Care 5-Stage Operational Workflow

```mermaid
sequenceDiagram
    autonumber
    participant P as Patient
    participant R as Receptionist
    participant D as Doctor
    participant S as JeevanCare System
    participant B as Billing & UPI Gateway

    P->>S: 1. Book Appointment or Request Walk-In Token
    S->>R: Token Issued (e.g., #T-01) in OPD Queue
    R->>S: 2. Check-In Patient & Collect Consultation Fee
    S->>D: Live OPD Queue Ticker Updates Status (Checked-In -> Room Ready)
    D->>S: 3. Start Consultation & Record Vitals / Split EMR
    D->>S: 4. Generate Prescriptions (1-Tap Dosage Kits, A5/A4 Print)
    S->>B: 5. Generate Invoice with Dynamic UPI QR Code (upi://pay)
    B->>P: WhatsApp / Print Receipt Issued & Payment Reconciled
```

### Stage 1: Public Doctor Directory & Appointment Booking
- **Doctor Finder & Directory (`/clinics`):** Patients search doctors by specialty, city, and available time slots. Selecting a doctor opens real-time IST slot availability.

![Figure 3.1: Public Doctor Directory & Clinic Search Interface (`/clinics`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_04_clinics.png)

### Stage 2: Primary Dashboard & OPD Live Queue Management
- **Workspace Dashboard (`/dashboard`):** Real-time OPD Queue Stepper (`Checked-In` ➔ `In Lobby` ➔ `In Consult` ➔ `Completed`), Live Doctor Schedule Pace Banner (`DoctorPaceBanner`), Shift Progress Ring, and triage allergy warning badges.

![Figure 3.2: Primary Dashboard Overview featuring OPD Queue Stepper Rail, Doctor Schedule Pace Banner & Shift Progress Ring](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_05_dashboard.png)

### Stage 3: Multi-Doctor Day Rail Schedule & Walk-In Tokens
- **Day Rail Schedule (`/dashboard/appointments`):** Timeline view displaying appointments per doctor, check-in statuses, and daily walk-in token allocation (`#T-01`, `#T-02`).
- **New Appointment Form (`/dashboard/appointments/new`):** Front-desk slot booking and walk-in token generation.

![Figure 3.3: Multi-Doctor Day Rail Schedule Timeline View (`/dashboard/appointments`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_06_appointments.png)

![Figure 3.4: Front-Desk Appointment Slot Booking & Walk-In Token Generator (`/dashboard/appointments/new`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_07_new_appointment.png)

### Stage 4: Patient Roster, EMR & Prescription Writing
- **Patient Directory (`/dashboard/patients`):** Searchable patient database with MRN lookup, phone search, and slide-over quick-view drawers (`PatientSlideOver`).
- **Register Patient (`/dashboard/patients/new`):** Quick 1-click patient registration.
- **Clinical OPD Queue & EMR:** Manages patient vitals, diagnosis search, speech-to-text dictation, and 1-tap treatment prescription kits.

![Figure 3.5: Searchable Patient Directory Roster featuring Slide-Over Quick-View Drawer (`/dashboard/patients`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_08_patients.png)

![Figure 3.6: Quick Patient Registration Form (`/dashboard/patients/new`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_09_new_patient.png)

![Figure 3.7: Clinical OPD Appointments Queue & Consultation Visit Creator (`/dashboard/appointments`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_06_appointments.png)

### Stage 5: Invoices, Dynamic UPI QR Payments & Lobby TV Display
- **Invoices & Billing (`/dashboard/invoices`):** Total collected revenue (₹ INR), pending balance due, and itemized invoice generation with dynamic `upi://pay` payment QR codes.
- **Waiting Room Lobby TV (`/dashboard/queue-display`):** High-contrast lobby TV display with patient token callout audio chimes.

![Figure 3.8: Invoices & Financial Summary Dashboard with Dynamic `upi://pay` Payment QR Codes (`/dashboard/invoices`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_11_invoices.png)

![Figure 3.9: Waiting Room Lobby TV Queue Display Screen with Token Callout Chimes (`/dashboard/queue-display`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_12_queue_display.png)

---

## 5. Clinic Owner Administration, Reports & Settings

- **Monthly Reports (`/dashboard/reports`):** Owner financial reports breaking down monthly revenue collections, completion rates, and per-doctor splits.
- **Staff Directory (`/dashboard/staff`):** Configures doctor specialties, timings, and staff accounts.
- **Workspace Settings (`/dashboard/settings`):** Configures clinic details, timezone (Asia/Kolkata), currency (₹ INR), and subscription plan.

![Figure 4.1: Owner Monthly Financial Reports & Per-Doctor Revenue Breakdown (`/dashboard/reports`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_13_reports.png)

![Figure 4.2: Staff Directory & Doctor Working Hours Configuration (`/dashboard/staff`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_14_staff.png)

![Figure 4.3: Clinic Workspace Settings, Timezone (Asia/Kolkata) & Subscription Plans (`/dashboard/settings`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_15_settings.png)

---

## 6. Patient Portal & Multi-Tenant Workflows

- **Patient Portal (`/patient/dashboard`):** Self-service dashboard for patients to view past prescriptions, medical documents, and billing history.
- **Patient Slot Booking (`/patient/appointments/book`):** Direct online appointment booking portal.
- **Multi-Tenant Workspace Console (`/dashboard`):** Workspace isolation, tenant data security (`uniq_active_slot`), and clinic management.

![Figure 5.1: Patient Portal Personal Dashboard Overview (`/patient/dashboard`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_16_patient_dashboard.png)

![Figure 5.2: Patient Online Appointment Slot Booking Interface (`/patient/appointments/book`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_17_patient_book.png)

![Figure 5.3: Multi-Tenant Clinic Workspace Administration Console (`/dashboard`)](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_05_dashboard.png)

---

## 7. API Architecture & System Endpoints

| HTTP Method | API Endpoint Route | Functional Purpose & Security Controls |
| :--- | :--- | :--- |
| `POST` | `/api/import/[type]` | Bulk CSV import for Patients, Appointments, Invoices, and Medicines with schema validation. |
| `GET` | `/api/export/[type]` | Audit-logged CSV export for clinic reports, patients, and financial records. |
| `GET` | `/api/medicines/search?q=...` | 200ms debounced search over Indian essential medicines catalog. |
| `GET` | `/api/medical-documents/[id]` | Fail-closed medical file access with SHA-256 integrity verification. |
| `GET` | `/api/cron/appointment-reminders` | Automated WhatsApp and SMS reminder dispatch cron job. |
| `GET` | `/api/cron/daily-digest` | End-of-day revenue and consultation summary digest for clinic owners. |
| `POST / GET` | `/api/graphql` | Payload GraphQL query and mutation endpoint. |

---

## 8. Technical Specifications & Developer Attribution

| Subsystem | Specification & Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript 5.7 |
| **Database & CMS** | Payload CMS 3.85 + MongoDB (Mongoose Adapter with connection pooling) |
| **Styling & Design System** | Tailwind CSS v4 + Base UI + Lucide React + Recharts |
| **Performance Optimizations**| Selective `select` field projections, package tree-shaking (`experimental.optimizePackageImports`), compound indexes (`idx_patients_tenant_created`, `idx_invoices_tenant_voided_created`), and sticky backdrop headers |
| **Security & Isolation** | Multi-tenant query isolation (`tenant: { equals: tenantID }`), partial unique indexes, SHA-256 file checksums |

---

> **Live Production Web Application:** [https://jeevan-care-sooty.vercel.app](https://jeevan-care-sooty.vercel.app)
> **Designed & Developed by Subramanian T S, WebCraft Digital Solutions.**
