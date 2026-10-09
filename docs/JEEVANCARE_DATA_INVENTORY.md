# JeevanCare — Data Inventory & Classification

> [!IMPORTANT]
> **ENGINEERING READINESS DOCUMENT:**
> This document provides an engineering inventory of data categories, storage locations, and role access matrices implemented in the JeevanCare platform. It is prepared for technical evaluation and does not constitute a legal conclusion or formal compliance certification.

---

## 1. Data Classification Matrix

| Category | Classification | Technical Description | Data Examples |
| :--- | :--- | :--- | :--- |
| **Personal Identifiable Information (PII)** | **Personal Data** | Attributes that directly or indirectly identify an individual | Patient Name, Mobile Number, Email, DOB, Gender, Address, PIN Code, MRN |
| **Sensitive Personal Information (SPI)** | **Sensitive Health Data** | Clinical & diagnostic information relating to physical or mental health | Symptoms, Diagnosis, Vitals, Prescriptions, Lab Reports, Medical Certificates |
| **Staff & Professional Credentials** | **Operational Data** | Identity and professional registration details of clinic staff | Staff Name, Email, Role, Medical Council Reg No, State Medical Council |
| **Billing & Transaction Data** | **Financial Data** | Invoices, fee structures, and payment receipts | Line Items, Total Amount, Amount Paid, Balance Due, Payment Method |
| **System Audit Logs** | **Audit Data** | System action history for security and compliance tracking | Action Type, Target ID, Actor ID, Timestamp, Human Summary |

---

## 2. Collection & Storage Map

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             JEEVANCARE STORAGE ARCHITECTURE                              │
├──────────────────────────┬───────────────────────────────┬───────────────────────────────┤
│ Storage Layer            │ Target Engine                 │ Stored Data Categories        │
├──────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ Primary Database         │ MongoDB Replica Set (`rs0`)   │ Patients, Users, Visits,      │
│                          │                               │ Appointments, Invoices,       │
│                          │                               │ Audit Logs, Medical Metadata  │
├──────────────────────────┼───────────────────────────────┼───────────────────────────────┤
│ Media File Storage       │ Local Disk (`media/`)         │ PDF Reports, X-Rays, Scans,   │
│                          │                               │ Lab Images (UUID Storage)     │
└──────────────────────────┴───────────────────────────────┴───────────────────────────────┘
```

### Detailed Collection Schema Mapping

1. **`patients` Collection:**
   - **Stored Fields:** `name`, `phone`, `email`, `dateOfBirth`, `gender`, `bloodGroup`, `allergies`, `addressLine`, `city`, `district`, `state`, `pinCode`, `mrn`, `activationCode`.
   - **Classification:** PII & Demographic Data.

2. **`users` Collection:**
   - **Stored Fields:** `name`, `email`, `phone`, `role`, `qualification`, `medicalRegistrationNumber`, `stateMedicalCouncil`, `consultationFee`, `availabilityType`, `availableDays`, `availableFrom`, `availableTo`, `patientProfile`.
   - **Classification:** Staff Credentials & Portal Account Links.

3. **`visits` Collection:**
   - **Stored Fields:** `patient`, `doctor`, `appointment`, `visitDate`, `symptoms`, `diagnosis`, `notes`, `vitals` (systolic/diastolic, temp, weight, pulse), `prescription` (medicine, dosage, frequency, duration, instructions), `followUpDate`.
   - **Classification:** Sensitive Health Data (SPI).

4. **`appointments` Collection:**
   - **Stored Fields:** `patient`, `doctor`, `start`, `durationMins`, `end`, `reason`, `status`, `isWalkIn`, `tokenNumber`, `cancellationReason`.
   - **Classification:** Clinical Scheduling Data.

5. **`invoices` Collection:**
   - **Stored Fields:** `invoiceNumber`, `patient`, `visit`, `currency`, `lineItems` (description, qty, unitAmount, amount), `totalAmount`, `payments` (amount, method, receivedAt, receivedBy), `amountPaid`, `balanceDue`, `paymentStatus`, `voided`, `voidReason`.
   - **Classification:** Financial & Billing Data.

6. **`medical-documents` Collection:**
   - **Stored Fields:** `title`, `documentType`, `patient`, `doctor`, `visit`, `appointment`, `documentDate`, `filename` (UUID storage name), `checksum` (SHA-256 hash), `status` (`active` | `archived`).
   - **Classification:** Diagnostic Health Records & Files.

7. **`auditLogs` Collection:**
   - **Stored Fields:** `tenant`, `user`, `action`, `targetCollection`, `targetId`, `summary`, `meta`.
   - **Classification:** Security Audit Trail.

---

## 3. Role-Based Access Control (RBAC) Matrix

| Collection | Super Admin | Clinic Owner | Doctor | Receptionist | Patient |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`patients`** | All Docs | Tenant Docs | Tenant Docs | Tenant Docs | Self Patient Profile Only |
| **`visits`** | All Docs | Tenant Docs | Tenant Docs | Tenant Docs (Read) | Self Visits Only |
| **`appointments`**| All Docs | Tenant Docs | Tenant Docs | Tenant Docs | Self Appointments Only |
| **`invoices`** | All Docs | Tenant Docs | Tenant Docs | Tenant Docs | Self Invoices Only |
| **`medical-documents`** | All Docs | Tenant Docs | Tenant Docs | Tenant Docs | Self Active Documents Only |
| **`auditLogs`** | All Docs | Tenant Logs | Denied | Denied | Denied |
