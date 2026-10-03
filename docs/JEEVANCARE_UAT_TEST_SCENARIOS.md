# JeevanCare UAT Test Scenarios

1. **Patient Self-Registration**: Register a new test patient via `/patient/register`.
2. **Patient Login**: Sign in via `/patient/login` using patient credentials.
3. **Doctor Availability & Slot Selection**: Select clinic, doctor, and date to view real available time slots.
4. **Patient Self-Booking**: Select an available slot and confirm appointment.
5. **Appointment Confirmation**: Verify confirmation details on the patient dashboard.
6. **Staff Dashboard Sync**: Log in as Receptionist and verify the appointment appears in the clinic schedule.
7. **Patient Check-in**: Check in the patient from the reception dashboard.
8. **Doctor OPD Queue**: Log in as Doctor and verify patient appears in the queue.
9. **Clinical Consultation**: Record vitals, symptoms, and diagnosis.
10. **Prescription Generation**: Create an NMC-compliant prescription with dosage, frequency (OD, BD, TDS), and duration.
11. **Follow-up**: Specify follow-up date and advice.
12. **Medical Document Upload**: Upload a test lab report or X-ray via staff view.
13. **Patient History Review**: Log back in as the patient and review medical history and timeline.
14. **Billing & Invoices**: Generate invoice and record payment (Cash/UPI/Card).
15. **Cross-Tenant Security**: Verify Patient A from Chennai cannot access Kochi patient data or clinic records.
