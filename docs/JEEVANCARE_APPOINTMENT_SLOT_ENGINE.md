# JeevanCare — Real Patient Appointment Slot Booking Engine Specification

**Document Version:** 2.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## 1. Overview & Required Patient Booking Workflow

The **JeevanCare Appointment Slot Booking Engine** enforces a strict, deterministic, and race-condition-safe patient booking flow without any free-text time inputs:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            REAL PATIENT BOOKING WORKFLOW                                 │
├───────────────┬───────────────┬────────────┬──────────────────┬─────────────┬────────────┤
│ Select Clinic ➔ Select Doctor ➔ Choose Date ➔ Generate Slots  ➔ Select Slot ➔ Revalidate │
└───────────────┴───────────────┴────────────┴──────────────────┴─────────────┴────────────┘
```

---

## 2. Slot Generation & Calculation Rules

1. **Patient UI (`PatientAppointmentBooker.tsx`)**:
   - Patient selects a doctor and date.
   - Automatically triggers `getAvailableSlots(doctorId, date)`.
   - Displays clickable available time slot chips (`9:00 am`, `9:15 am`, `10:00 am`).
   - If no slot is available, displays: `"No appointments available for this doctor on this date."`

2. **Server-Side Recomputation (`actions.ts`)**:
   - Re-fetches the doctor from the database (`payload.findByID('users', doctorID)`).
   - Verifies doctor `active !== false` and `role === 'doctor'`.
   - Re-evaluates `checkAvailability(doctor, start, end, tz)` considering availability type (`regular`, `onCall`, `byAppointment`).
   - Re-evaluates `findConflict({ tenantID, doctorID, start, end })`.
   - Re-checks double-booking guard inside the **MongoDB Replica Set Transaction** (`Appointments.ts` `beforeValidate` hook).

3. **Boundary Condition Handling**:
   - **Past Dates / Slots:** Filtered out automatically (`start > now`).
   - **Adjacent Slots:** Slots `10:00–10:15` and `10:15–10:30` do NOT conflict (touching edges allowed).
   - **Cancelled / No-Show Slots:** `cancelled` or `no-show` status frees up the slot for new bookings.
   - **Multiple Windows:** Supports split daily windows (`morningFrom`/`morningTo` and `eveningFrom`/`eveningTo`).

4. **Timezone & Regional Presentation**:
   - Computed in `Asia/Kolkata` IST timezone.
   - Slot chips formatted as Indian local time (`9:00 am`, `9:15 am`).
   - Date formats presented as `DD/MM/YYYY`.

---

## 3. Test Coverage Matrix

- **Unit & Integration Suite (`tests/int/bookingEngine.int.spec.ts`)**:
  - Overlap calculation & touching adjacent slots validation.
  - Generating clickable slots for active doctors.
  - Rejecting slot generation & booking for inactive doctors.
  - Slot conflict detection and slot freeing when appointments are cancelled.
  - **Simultaneous Race Condition Test:** Two concurrent booking calls for the exact same slot ➔ exactly ONE succeeds, the second receives `SLOT_TAKEN`.
- **Playwright E2E Suite (`tests/e2e/patientBooking.e2e.spec.ts`)**:
  - End-to-end patient booking flow test execution.
