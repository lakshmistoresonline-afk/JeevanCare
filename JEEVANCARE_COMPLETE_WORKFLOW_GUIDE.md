# JeevanCare Platform — Complete System Architecture & Operational Workflow Documentation

> **Platform Name:** JeevanCare — Your Trusted Healthcare Companion
> **Brand Identity:** Simple, connected healthcare for patients, doctors, and clinics.
> **Designed & Developed by:** Subramanian T S, WebCraft Digital Solutions.

---

## 1. Executive Summary & Platform Overview

JeevanCare is a modern, multi-tenant healthcare SaaS application specifically built for Indian clinics, nursing homes, and outpatient departments (OPD). The platform connects five core user roles—**Clinic Owners**, **Doctors**, **Receptionists / Front-Desk Staff**, **Patients**, and **Super Administrators**—into a single, highly synchronized workspace.

![1. JeevanCare Landing Page & Brand Overview](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_01_landing.png)

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

## 2. Authentication, Quick Login & Clinic Registration

JeevanCare provides a 1-click Quick Login toolbar for instant role switching during demonstration and daily operations, along with a self-serve clinic onboarding wizard.

![2. Authentication Screen with Configurable Quick Login Toolbar](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_02_login.png)

![3. Self-Serve Clinic Registration Signup Wizard](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_03_signup.png)

---

## 3. End-to-End Complete Care Workflow (5-Stage Engine)

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

### Stage 1: Public Doctor Finder & Appointment Booking
- **Public Directory (`/clinics`):** Patients search doctors by specialty, city, and available time slots.

![4. Public Doctor Directory & Clinic Finder Interface](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_04_clinics.png)

### Stage 2: Primary Dashboard & OPD Live Queue Management
- **Dashboard Overview (`/dashboard`):** Real-time OPD Queue Stepper (`Checked-In` ➔ `In Lobby` ➔ `In Consult` ➔ `Completed`), Live Doctor Schedule Pace Banner, and primary KPI metrics.

![5. Primary Clinic Workspace Dashboard Overview](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_05_dashboard.png)

### Stage 3: Multi-Doctor Day Rail Schedule & Appointment Booking
- **Day Rail Schedule (`/dashboard/appointments`):** Multi-doctor timeline tracking check-ins, consultation statuses, and walk-in token queues.
- **New Appointment Form (`/dashboard/appointments/new`):** Front-desk appointment slot booking and walk-in token generation.

![6. Multi-Doctor Day Rail Schedule View](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_06_appointments.png)

![7. New Appointment & Walk-In Token Allocation Form](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_07_new_appointment.png)

### Stage 4: Patient Roster, Registration & EMR Consultations
- **Patient Roster (`/dashboard/patients`):** Searchable patient database with MRN lookup, phone search, and slide-over drawers.
- **Register Patient (`/dashboard/patients/new`):** Quick 1-click patient registration with phone number validation.
- **New Visit & EMR (`/dashboard/visits/new`):** Vitals recording, speech-to-text dictation, 1-tap prescription treatment kits, and medicine directory search.

![8. Patient Roster Directory Interface](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_08_patients.png)

![9. Register New Patient Form Interface](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_09_new_patient.png)

![10. Clinical OPD Appointments Queue & Consultation Visit Creator](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_06_appointments.png)

### Stage 5: Invoices, Dynamic UPI QR Payments & Lobby TV Display
- **Invoices & Billing (`/dashboard/invoices`):** Total collected revenue (₹ INR), pending balance due, and itemized invoice generation with dynamic `upi://pay` payment QR codes.
- **Waiting Room TV (`/dashboard/queue-display`):** High-contrast lobby TV queue display with patient token callout chimes.

![11. Invoices & Financial Summary Dashboard](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_11_invoices.png)

![12. Waiting Room Lobby TV Queue Display Screen](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_12_queue_display.png)

---

## 4. Clinic Administration, Reports & Staff Management

- **Monthly Reports (`/dashboard/reports`):** Owner financial reports breaking down monthly revenue collections, completion rates, and per-doctor splits.
- **Staff Management (`/dashboard/staff`):** Configures doctor specialties, timings, and staff accounts.
- **Workspace Settings (`/dashboard/settings`):** Configures clinic details, timezone (Asia/Kolkata), currency (₹ INR), and subscription plan.

![13. Monthly Financial Reports & Analytics View](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_13_reports.png)

![14. Staff Directory & Doctor Timings Management](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_14_staff.png)

![15. Clinic Workspace Settings & Subscription Plan Panel](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_15_settings.png)

---

## 5. Patient Portal & Super Admin Workflows

- **Patient Portal (`/patient/dashboard`):** Self-service dashboard for patients to view past prescriptions, medical documents, and billing history.
- **Patient Slot Booking (`/patient/appointments/book`):** Direct online appointment booking portal.
- **Super Admin Console (`/super`):** System governance, tenant isolation audits (`uniq_active_slot`), and clinic workspace management.

![16. Patient Portal Personal Dashboard Interface](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_16_patient_dashboard.png)

![17. Patient Online Appointment Slot Booking Interface](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_17_patient_book.png)

![18. Multi-Tenant Workspace Administration Console](.artifacts/303e3f1a-f56c-4a6f-b7aa-ada6002db45a/flow_05_dashboard.png)

---

## 6. Technical Specifications & Developer Attribution

| Subsystem | Specification & Technology |
| :--- | :--- |
| **Framework** | Next.js 16 (App Router) + React 19 + TypeScript 5.7 |
| **Database & CMS** | Payload CMS 3.85 + MongoDB (Mongoose Adapter with connection pooling) |
| **Styling & Design System** | Tailwind CSS v4 + Base UI + Lucide React + Recharts |
| **Performance Optimizations**| Selective `select` field projections, package tree-shaking (`experimental.optimizePackageImports`), compound indexes (`idx_patients_tenant_created`, `idx_invoices_tenant_voided_created`), and sticky backdrop headers |
| **Security & Isolation** | Multi-tenant query isolation (`tenant: { equals: tenantID }`), partial unique indexes, SHA-256 file checksums |

---

> **Designed & Developed by Subramanian T S, WebCraft Digital Solutions.**
