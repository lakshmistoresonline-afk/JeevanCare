# Privacy & Data Handling (India-First & DPDP Act Alignment)

## 1. Data Collected
- **Patient Identity**: Full name, mobile number (+91 normalization), alternate mobile, date of birth, gender, address (area, city, district, state, PIN code), emergency contact, optional ABHA identifier.
- **Clinical Records**: Appointments, consultation visits, symptoms, diagnoses, vitals, prescriptions, medical documents, lab reports, follow-ups.
- **Billing**: Invoices, payments (Cash, UPI, Card, Bank transfer), amounts, receipt history.
- **Staff Credentials**: Doctor name, qualifications, specialization, NMC registration number, State Medical Council.

## 2. Purpose of Collection
All data is collected solely for direct patient care, clinical documentation, appointment management, prescription generation, clinic billing, and statutory record maintenance.

## 3. Access Control & Tenant Isolation
- **Tenant Isolation**: Strict clinic-level multi-tenancy ensures data never leaks between independent clinics.
- **Patient Isolation**: Patients authenticated via the Patient Portal can access only their own appointments, history, prescriptions, documents, and billing invoices.
- **Role-Based Access Control (RBAC)**: Owners, doctors, receptionists, and patients have strictly enforced least-privilege permissions.

## 4. Retention & Deletion
- Medical records and clinical notes are retained in accordance with applicable Indian clinical establishment record retention guidelines (e.g., minimum 3 years for OPD records).
- Patient accounts or user logins can be deactivated or unlinked without destroying statutory medical history records.

## 5. Audit Logging
Security-sensitive and clinical actions (logins, patient creation, record modifications, prescription creation, document uploads, invoice payments) are recorded in a tenant-scoped immutable audit trail.
