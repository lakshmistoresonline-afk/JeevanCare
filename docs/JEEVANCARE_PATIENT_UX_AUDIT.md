# JeevanCare — Patient-First Indian Clinic UX Audit & Journey Map

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## 1. Executive Summary & Primary Patient Journey Map

**JeevanCare** provides an intuitive, India-first, mobile-responsive end-to-end patient workflow spanning 18 distinct clinical touchpoints:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             PRIMARY PATIENT CLINIC JOURNEY                               │
├───────────────────┬───────────────────┬───────────────────┬──────────────────────────────┤
│ 1. Registration   │ 2. Login          │ 3. Select Clinic  │ 4. Select Doctor             │
│ +91 Mobile & PIN  │ OTP / Password    │ Multi-Clinic List │ Qualification & Specialty    │
├───────────────────┼───────────────────┼───────────────────┼──────────────────────────────┤
│ 5. Select Date    │ 6. Real Slots     │ 7. Book Slot      │ 8. Confirmation & Token      │
│ Calendar Picker   │ Clickable Chips   │ Instant Server    │ Token Number Assigned (T-01) │
├───────────────────┼───────────────────┼───────────────────┼──────────────────────────────┤
│ 9. Clinic Visit   │ 10. Check-in      │ 11. OPD Queue     │ 12. Consultation             │
│ Wall Poster QR    │ Self Check-in     │ 4-Step Live Track │ Split-Pane EMR Workspace     │
├───────────────────┼───────────────────┼───────────────────┼──────────────────────────────┤
│ 13. Prescription  │ 14. Documents     │ 15. Billing       │ 16. Follow-up & History      │
│ A5 Print / WhatsApp│ Lab PDF / X-Rays │ UPI QR Payment    │ Timeline & Reminders         │
└───────────────────┴───────────────────┴───────────────────┴──────────────────────────────┘
```

---

## 2. Touchpoint Detailed Audit & Experience Optimizations

1. **Self-Registration (`/patient/register`)**:
   - Accepts Indian mobile numbers (`+91`), full name, email (optional), Patient MRN / Activation Code (if claiming an existing front-desk record), password, DOB, gender, address, city, state dropdown (36 Indian States/UTs), and 6-digit PIN code.
   - Prevents unverified profile takeovers by requiring MRN or Activation Code to claim front-desk records.

2. **Login (`/patient/login`)**:
   - Clean, high-contrast inputs with password toggle visibility and clear error banners.

3. **Multi-Clinic & Specialist Doctor Finder (`/patient/appointments/book`)**:
   - Displays doctor qualifications (e.g. `MBBS, MD`) and specialties (`General Physician`, `Pediatrics`, `Orthopedics`).
   - Clean Indian English labels ("Token Number", "OPD Queue", "Consultation", "Rx").

4. **Real Availability Slot Selector (`PatientAppointmentBooker.tsx`)**:
   - Interactive date selector triggers `getAvailableSlots(docId, date)`.
   - Renders clickable slot chips (`9:00 am`, `9:15 am`, `10:00 am`). Past slots and occupied slots are filtered out. No arbitrary text inputs.

5. **Appointment Confirmation & Live OPD Queue Tracker (`/patient/dashboard`)**:
   - Displays assigned Token Number (e.g. `T-01`).
   - Real-time 4-step stepper progress tracker:
     `Checked-In` ➔ `In Queue (#N)` ➔ `Next Up!` ➔ `Doctor Room`.
   - Calculates estimated wait time in minutes (e.g. `~15 mins`).

6. **Prescriptions & WhatsApp Sharing (`/patient/prescriptions` & `/print/prescription/[id]`)**:
   - 1-click A5 printable prescriptions formatted in Indian style with clinic letterhead, doctor qualifications, and state medical council registration number.
   - 1-tap WhatsApp sharing (`WhatsAppShareButton`) sends formatted prescription summary to patient mobile.

7. **Billing Receipts & Dynamic UPI QR Code (`/patient/billing` & `/print/receipt/[id]`)**:
   - Displays invoice number, total amount, amount paid, and balance due in `₹` INR format (`en-IN`).
   - Dynamic UPI QR Code (`upi://pay?pa=...`) enables instant bill payment via Google Pay, PhonePe, or Paytm.

8. **Medical History & Documents (`/patient/history` & `/patient/documents`)**:
   - Chronological timeline (`-visitDate`) aggregating visits, prescriptions, lab reports, and invoice receipts in one unified view.

---

## 3. Mobile Viewport Responsive Testing Matrix

All patient portal pages and interactive components have been tested for responsive touch target accessibility (minimum 44px height) across standard Indian mobile viewports:

| Viewport Dimension | Target Device Type | Navigation & Layout Result | Status |
| :--- | :--- | :--- | :--- |
| **390 x 844** | iPhone 12/13/14 Pro | Single column, stacked action buttons, touch-friendly slot chips | **PASSED** |
| **412 x 915** | Samsung Galaxy S20/S21 / Pixel | Full responsive width, readable typography, 4-step stepper bar | **PASSED** |
| **768 x 1024** | iPad / Android Tablet | Dual column grid, side-by-side dashboard metrics | **PASSED** |
| **1280 x 800** | Small Laptop / Desktop | Full split layout, sticky sidebar, top navigation bar | **PASSED** |
| **1440 x 900** | HD Desktop Monitor | Centered container, optimal line-length and contrast | **PASSED** |
