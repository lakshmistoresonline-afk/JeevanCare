# JeevanCare — FHIR R4 / ABDM Interoperability Candidate Mapping

**Document Version:** 1.0
**Target Standard:** HL7 FHIR R4 & NDHM / ABDM Health Data Specifications
**Status:** **FHIR/ABDM READINESS — NOT ABDM INTEGRATION**

---

> [!IMPORTANT]
> **READINESS DISCLAIMER:**
> This document specifies the candidate mapping from JeevanCare's internal domain models to HL7 FHIR R4 resources. JeevanCare provides a clean, versioned interoperability layer (`src/lib/fhir/index.ts`). It does **not** call live government ABDM APIs, fabricate ABHA credentials, or store unverified consent artifacts.

---

## 1. Executive Summary & Mapping Matrix

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            JEEVANCARE ➔ FHIR R4 INTEROPERABILITY MAP                      │
├──────────────────────┬────────────────────────┬─────────────────────┬────────────────────┤
│ JeevanCare Concept    │ Payload Collection     │ FHIR R4 Resource    │ Standard Code Set  │
├──────────────────────┼────────────────────────┼─────────────────────┼────────────────────┤
│ Patient              │ `patients`             │ `Patient`           │ Local MRN / System │
│ Doctor               │ `users` (role=doctor)  │ `Practitioner`      │ Medical Council Reg│
│ Clinic               │ `tenants`              │ `Organization`      │ Clinic Identifier  │
│ Appointment          │ `appointments`         │ `Appointment`       │ HL7 Status         │
│ Clinical Visit       │ `visits`               │ `Encounter`         │ ActCode `AMB`      │
│ Vitals               │ `visits.vitals`        │ `Observation`       │ LOINC Codes        │
│ Prescription         │ `visits.prescription`  │ `MedicationRequest` │ RxNorm / Generic   │
│ Medical Document     │ `medical-documents`    │ `DiagnosticReport`  │ Attachment URL     │
│ Invoice              │ `invoices`             │ `Invoice`           │ INR Financials     │
└──────────────────────┴────────────────────────┴─────────────────────┴────────────────────┘
```

---

## 2. Detailed Concept Field-Level Mapping

| JeevanCare Concept | Current Field | Potential FHIR Resource | Potential FHIR Element | Transformation Notes | Gap |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Patient** | `id` | `Patient` | `Patient.id` | String ID | None |
| **Patient** | `mrn` | `Patient` | `Patient.identifier` | System: `https://jeevancare.in/mrn` | ABHA ID (Future) |
| **Patient** | `name` | `Patient` | `Patient.name[0].text` | Human name string | First/Last split |
| **Patient** | `phone` | `Patient` | `Patient.telecom` | System: `phone`, Use: `mobile` | None |
| **Patient** | `gender` | `Patient` | `Patient.gender` | `male` \| `female` \| `other` | None |
| **Patient** | `dateOfBirth` | `Patient` | `Patient.birthDate` | ISO Date YYYY-MM-DD | None |
| **Patient** | `pinCode` | `Patient` | `Patient.address[0].postalCode` | Indian 6-digit PIN | None |
| **Practitioner** | `medicalRegistrationNumber` | `Practitioner` | `Practitioner.identifier` | State Council Reg Number | None |
| **Practitioner** | `qualification` | `Practitioner` | `Practitioner.qualification` | MBBS, MD, MS text | SNOMED CT qualification |
| **Organization** | `name` | `Organization` | `Organization.name` | Clinic name | ROHINI / HPR ID |
| **Appointment** | `status` | `Appointment` | `Appointment.status` | Mapped to `booked`/`fulfilled` | None |
| **Encounter** | `symptoms` | `Encounter` | `Encounter.reasonCode` | Symptoms text | SNOMED CT reason |
| **Encounter** | `diagnosis` | `Encounter` | `Encounter.diagnosis` | Diagnosis text | ICD-10 / SNOMED CT |
| **Observation** | `bpSystolic` | `Observation` | `Observation.code` | LOINC `8480-6` | None |
| **Observation** | `bpDiastolic` | `Observation` | `Observation.code` | LOINC `8462-4` | None |
| **Observation** | `temperatureC` | `Observation` | `Observation.code` | LOINC `8310-5` (Celsius) | None |
| **Observation** | `weightKg` | `Observation` | `Observation.code` | LOINC `29463-7` (kg) | None |
| **Observation** | `pulse` | `Observation` | `Observation.code` | LOINC `8867-4` (/min) | None |
| **Medication** | `medicine` | `MedicationRequest` | `MedicationRequest.medication` | Free-text medicine name | Systemic Drug Code |
| **Document** | `checksum` | `DiagnosticReport` | `DiagnosticReport.presentedForm.hash` | SHA-256 binary hash | None |

---

## 3. Versioned Interoperability Layer (`src/lib/fhir/index.ts`)

JeevanCare exposes standard export functions for every core entity:
- `toFhirPatient(patient)`
- `toFhirPractitioner(doctor)`
- `toFhirOrganization(tenant)`
- `toFhirAppointment(appt)`
- `toFhirEncounter(visit)`
- `toFhirObservations(visit)`
- `toFhirMedicationRequests(visit)`
- `toFhirDiagnosticReport(doc)`
- `toFhirInvoice(invoice)`

---

## 4. Test Matrix & Validation Status

- **Unit Test Suite:** `tests/int/fhirMapping.int.spec.ts`
- **Coverage:** Verified transforming internal domain objects into valid FHIR R4 Patient, Practitioner, Organization, Appointment, Encounter, Observation (LOINC), MedicationRequest, DiagnosticReport, and Invoice candidate structures.
