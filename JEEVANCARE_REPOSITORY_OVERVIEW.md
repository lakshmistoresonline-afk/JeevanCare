# JeevanCare — Repository Architecture & Technical Overview

**Date:** November 2026
**Repository:** `https://github.com/lakshmistoresonline-afk/JeevanCare.git`
**Local Path:** `E:\Jeevan Care`
**Branch:** `main`

---

## 1. Executive Summary

JeevanCare is an enterprise multi-tenant Outpatient Department (OPD) clinic management software platform built specifically for Indian outpatient clinics, polyclinics, and healthcare groups. It manages patient records, doctor scheduling, front-desk OPD queue management, digital prescriptions (EMR), billing & invoicing, and patient portal access.

---

## 2. Core Tech Stack & Architecture

| Layer | Technology | Version / Implementation Details |
| :--- | :--- | :--- |
| **Framework** | Next.js App Router | Next.js `16.2.6` (Turbopack enabled) |
| **CMS & Data Engine** | Payload CMS | Payload `3.x` with Mongoose Adapter |
| **Database** | MongoDB / MongoDB Atlas | Self-hosted or Atlas Cluster (`DATABASE_URL`) |
| **Language & Typing** | TypeScript | Strict mode, auto-generated Payload types (`payload-types.ts`) |
| **Styling & UI** | Tailwind CSS v4 & Lucide | Custom healthcare design system (`primitives.tsx`, `ui-kit.tsx`) |
| **Real-time Sync** | App Router Polling | `QueueAutoRefresher.tsx` background revalidation |
| **File Storage** | Local Media / S3 Ready | Payload static uploads directory (`media`) |

---

## 3. Directory & Module Structure

```
E:\Jeevan Care
├── docs/                        # Bulk import CSV datasets & clinical templates
├── src/
│   ├── access/                  # Payload CMS RBAC & Tenant Isolation rules (`index.ts`)
│   ├── app/
│   │   ├── (frontend)/          # Next.js App Router UI pages & server actions
│   │   │   ├── dashboard/       # Staff/Doctor/Owner workspace routes
│   │   │   ├── patient/         # Consumer Patient Portal routes
│   │   │   ├── super/           # SaaS SuperAdmin platform console
│   │   │   ├── print/           # Printable Rx & receipt rendering routes
│   │   │   └── login/           # Authentication pages
│   │   └── api/                 # Custom REST & GraphQL endpoints
│   │       ├── import/          # Bulk CSV import routes (`[type]/route.ts`)
│   │       ├── export/          # Data export endpoints (`[type]/route.ts`)
│   │       ├── medical-documents/# Secure medical document download route
│   │       └── medicines/       # Medicine search & 1-click catalog endpoints
│   ├── collections/             # Payload CMS Data Models
│   │   ├── Tenants.ts           # Clinic multi-tenant workspace schema
│   │   ├── Users.ts             # User profiles & RBAC roles
│   │   ├── Patients.ts          # Patient medical profiles & MRNs
│   │   ├── Appointments.ts      # OPD slots, queue tokens & status transitions
│   │   ├── Visits.ts            # EMR consultation notes, symptoms, diagnosis, Rx
│   │   ├── Invoices.ts          # Billing ledgers, line items, payment status
│   │   ├── MedicalDocuments.ts  # Lab reports, X-Rays, scanned PDFs
│   │   ├── Medicines.ts         # National medicine catalog & drug dictionary
│   │   └── AuditLogs.ts         # HIPAA/NABH compliance audit trail
│   ├── components/              # Shared React UI kit & workspace modals
│   ├── hooks/                   # Payload data hooks (tenant injection, audit logging)
│   ├── lib/                     # Business logic, validation, & security utilities
│   └── payload.config.ts        # Primary Payload CMS configuration & index initializers
├── tests/                       # Unit, integration, & security test suites
└── package.json
```

---

## 4. Operational Workflows & Lifecycle States

1. **OPD Care Lifecycle (5-Stage Flow):**
   `Scheduled` $\rightarrow$ `Checked-In (Token T-01)` $\rightarrow$ `In Consultation` $\rightarrow$ `Post-Consultation (Pharmacy/Checkout)` $\rightarrow$ `Completed / Discharged`
2. **Billing Lifecycle:**
   `Front-Desk Check-In Payment` $\rightarrow$ `EMR Visit Linkage` $\rightarrow$ `Invoice Finalization / Receipt Print`
3. **Multi-Tenant Isolation:**
   Every document in `users`, `patients`, `appointments`, `visits`, `invoices`, `medical-documents`, and `auditLogs` is strictly scoped to a `tenant` ObjectId representing the clinic branch.
