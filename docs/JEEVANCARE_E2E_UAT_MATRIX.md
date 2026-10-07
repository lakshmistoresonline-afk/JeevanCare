# JeevanCare — Comprehensive End-to-End Playwright UAT Matrix

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)
**Test Suite Directory:** `tests/e2e/`

---

## 1. Executive Summary & Test Status Overview

The **JeevanCare Comprehensive E2E UAT Suite** evaluates all 51 core workflows across 7 operational domains (Patient Journey, Receptionist, Doctor, Owner, Super Admin, Security/BOLA, and Mobile Responsiveness).

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            E2E UAT MATRIX WORKFLOW SUMMARY                               │
├─────────────────────────┬─────────────────────────┬─────────────────┬────────────────────┤
│ Operational Domain      │ Workflows               │ Automation File │ Overall Status     │
├─────────────────────────┼─────────────────────────┼─────────────────┼────────────────────┤
│ Patient Journey         │ 1 – 16                  │ `patientJourney`│ **PASSED**         │
│ Receptionist Workflow   │ 17 – 23                 │ `receptionist`  │ **PASSED**         │
│ Doctor EMR Workflow     │ 24 – 32                 │ `doctorWorkflow`│ **PASSED**         │
│ Clinic Owner Admin      │ 33 – 38                 │ `ownerWorkflow` │ **PASSED**         │
│ Super Admin Operations  │ 39 – 42                 │ Super Admin UI  │ **NOT APPLICABLE** │
│ Security & BOLA Guards  │ 43 – 48                 │ `securityBOLA`  │ **PASSED**         │
│ Mobile Responsiveness   │ 49 – 51                 │ `responsive`    │ **PASSED**         │
└─────────────────────────┴─────────────────────────┴─────────────────┴────────────────────┘
```

---

## 2. Complete 51-Workflow E2E Matrix

| # | Workflow / Test Case | Persona | Target Route | Status | Notes / Execution Proof |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Patient Registration** | Patient | `/patient/register` | **PASSED** | Validated +91 mobile, MRN assignment, PIN code |
| **2** | **Patient Login** | Patient | `/patient/login` | **PASSED** | Authenticated via `patient1@test.com` |
| **3** | **Patient Dashboard** | Patient | `/patient/dashboard` | **PASSED** | Verified OPD Queue Tracker & Token `#T-01` |
| **4** | **Clinic Selection** | Patient | `/patient/appointments/book` | **PASSED** | Selected JeevanCare Thrissur Clinic |
| **5** | **Doctor Selection** | Patient | `/patient/appointments/book` | **PASSED** | Selected Dr. Sabitha Krishnamoorthy |
| **6** | **Date Selection** | Patient | `/patient/appointments/book` | **PASSED** | Interactive date picker (`Asia/Kolkata` IST) |
| **7** | **Actual Slot Availability** | Patient | `/patient/appointments/book` | **PASSED** | Clickable slot buttons (`9:00 am`, `9:15 am`) |
| **8** | **Booking Execution** | Patient | Server Action | **PASSED** | Atomic `bookAppointment` Server Action |
| **9** | **Appointment Confirmation** | Patient | `/patient/appointments` | **PASSED** | Assigned Token `#T-01` confirmed |
| **10** | **Appointment Cancellation** | Patient | `/patient/appointments` | **PASSED** | Cancelled with mandatory reason |
| **11** | **Medical History** | Patient | `/patient/history` | **PASSED** | Chronological timeline query (`-visitDate`) |
| **12** | **Prescriptions** | Patient | `/patient/prescriptions` | **PASSED** | Viewed A5 Rx layout & WhatsApp share button |
| **13** | **Documents** | Patient | `/patient/documents` | **PASSED** | Downloaded lab report PDF |
| **14** | **Billing & Receipts** | Patient | `/patient/billing` | **PASSED** | Viewed ₹ INR receipt & dynamic UPI QR code |
| **15** | **Follow-up Reminders** | Patient | `/patient/dashboard` | **PASSED** | Verified follow-up calendar reminder |
| **16** | **Patient Logout** | Patient | `/patient/dashboard` | **PASSED** | Cleared `payload-token` session cookie |
| **17** | **Receptionist Login** | Reception | `/login` | **PASSED** | Authenticated via `staff1@test.com` |
| **18** | **Patient Search** | Reception | `/dashboard/patients` | **PASSED** | Searched by MRN `P-0001` or mobile `+91` |
| **19** | **Patient Registration** | Reception | `/dashboard/patients/new` | **PASSED** | Created new in-person patient record |
| **20** | **Appointment Management** | Reception | `/dashboard/appointments` | **PASSED** | Viewed daily appointment rail |
| **21** | **Patient Check-in** | Reception | Server Action | **PASSED** | Updated status from `scheduled` to `checked-in` |
| **22** | **OPD Queue Display** | Reception | `/dashboard/queue-display` | **PASSED** | Displayed wall poster QR & token numbers |
| **23** | **Billing & Invoicing** | Reception | `/dashboard/invoices` | **PASSED** | Created invoice from visit with doctor fee |
| **24** | **Doctor Login** | Doctor | `/login` | **PASSED** | Authenticated via `doctor1@test.com` |
| **25** | **Today's Queue** | Doctor | `/dashboard` | **PASSED** | Viewed active OPD patient queue |
| **26** | **Patient Chart** | Doctor | `/dashboard/patients/[id]` | **PASSED** | Viewed vitals trend line charts |
| **27** | **Consultation EMR** | Doctor | `/dashboard/visits/new` | **PASSED** | Opened Split-Pane EMR Workspace |
| **28** | **Vitals Recording** | Doctor | `/dashboard/visits/new` | **PASSED** | Recorded BP, Temperature, Pulse & Weight |
| **29** | **Diagnosis Entry** | Doctor | `/dashboard/visits/new` | **PASSED** | Entered clinical diagnosis string |
| **30** | **Prescription Authoring**| Doctor | `/dashboard/visits/new` | **PASSED** | Applied Quick Dosage Chips (`1-0-1 BD`) |
| **31** | **Follow-up Scheduling** | Doctor | `/dashboard/visits/new` | **PASSED** | Selected follow-up date in calendar |
| **32** | **Document Linking** | Doctor | `/dashboard/visits/new` | **PASSED** | Attached lab PDF to visit record |
| **33** | **Owner Dashboard** | Owner | `/dashboard` | **PASSED** | Authenticated via `owner1@test.com` |
| **34** | **Revenue Reporting** | Owner | `/dashboard/invoices` | **PASSED** | Total revenue calculated in ₹ INR |
| **35** | **Staff Management** | Owner | `/dashboard/staff` | **PASSED** | Managed clinic doctors and receptionists |
| **36** | **Clinic Settings** | Owner | `/dashboard/settings` | **PASSED** | Configured working hours (`09:00` - `17:00`) |
| **37** | **Subscription Plans** | Owner | `/dashboard/plans` | **PASSED** | Viewed Plus subscription plan status |
| **38** | **Activity Audit Log** | Owner | `/dashboard/activity` | **PASSED** | Viewed append-only audit trail entries |
| **39** | **Tenant List** | SuperAdmin | `/dashboard/tenants` | **NOT APPLICABLE**| Handled via Payload Admin (`/admin`) |
| **40** | **Clinic Approval** | SuperAdmin | Server Action | **NOT APPLICABLE**| Handled via Payload Admin (`/admin`) |
| **41** | **Tenant Suspension** | SuperAdmin | Server Action | **NOT APPLICABLE**| Handled via Payload Admin (`/admin`) |
| **42** | **Upgrade Workflow** | SuperAdmin | Server Action | **NOT APPLICABLE**| Handled via Payload Admin (`/admin`) |
| **43** | **Patient BOLA Isolation** | Security | `/patient/history` | **PASSED** | Patient A denied access to Patient B records |
| **44** | **Tenant Isolation** | Security | `/dashboard/patients` | **PASSED** | Owner A denied access to Clinic B data |
| **45** | **Direct Document URL** | Security | `/api/medical-documents/[id]`| **PASSED** | Unauthenticated/Unauthorized download denied |
| **46** | **Direct Invoice URL** | Security | `/dashboard/invoices/[id]` | **PASSED** | Direct URL cross-tenant access denied |
| **47** | **Direct Appointment URL**| Security | `/dashboard/appointments` | **PASSED** | Direct URL cross-tenant access denied |
| **48** | **Unauthorized Route** | Security | `/dashboard` | **PASSED** | Patient redirected away from staff routes |
| **49** | **Mobile Patient Booking** | Responsive | `390 x 844` | **PASSED** | Tested touch-friendly slot selection |
| **50** | **Mobile History View** | Responsive | `412 x 915` | **PASSED** | Tested mobile patient history timeline |
| **51** | **Mobile Doctor EMR** | Responsive | `768 x 1024` | **PASSED** | Tested responsive tablet consultation view |
