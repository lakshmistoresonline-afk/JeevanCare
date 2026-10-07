# JeevanCare — Production-Grade Appointment Slot Engine Specification

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## 1. Overview & Architectural Goal

The **JeevanCare Appointment Slot Engine** provides deterministic, race-condition-safe, and timezone-aware appointment slot generation and booking revalidation.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             PATIENT APPOINTMENT BOOKING FLOW                             │
├───────────────┬───────────────┬────────────┬──────────────────┬─────────────┬────────────┤
│ Select Clinic ➔ Select Doctor ➔ Choose Date ➔ Generate Slots  ➔ Select Slot ➔ Revalidate │
└───────────────┴───────────────┴────────────┴──────────────────┴─────────────┴────────────┘
```

---

## 2. Slot-Generation Algorithm

1. **Input Parameters:** `doctorId`, `date` (`YYYY-MM-DD`).
2. **Doctor Availability Lookup:**
   - Reads doctor record from MongoDB `users` collection.
   - Verifies `active !== false` and `role === 'doctor'`.
   - Resolves availability windows using `windowsOf(doctor)` (`availableFrom`/`availableTo` or `morningFrom`/`morningTo` & `eveningFrom`/`eveningTo`).
3. **Clinic Configuration:**
   - Retrieves clinic `timezone` (e.g. `Asia/Kolkata`) and `appointmentDurationMins` (e.g. 15 mins).
4. **Timezone Wall-Time to UTC Conversion:**
   - `wallTimeToUTC(tz, date, timeStr)` converts wall-time string in tenant timezone into precise UTC Date objects.
5. **Occupancy & Conflict Filter:**
   - Filters out past time slots for current date.
   - Evaluates `checkAvailability(doctor, start, end, tz)` to check weekday and window inclusion.
   - Executes `findConflict({ tenantID, doctorID, start, end })` to filter out active appointments (`scheduled` / `checked-in`).
   - Converts valid UTC start times back into local formatted time strings (`9:00 am`, `9:15 am`) for UI button display.

---

## 3. Double-Booking Conflict Model & Transaction Behavior

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         DOUBLE-BOOKING GUARD (MongoDB Transaction)                      │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ 1. Server receives booking request with (doctorID, date, timeStr).                       │
│ 2. Server recomputes start & end in tenant timezone.                                    │
│ 3. Server independently re-verifies checkAvailability().                                 │
│ 4. MongoDB Transaction (`req.transactionID`) begins:                                    │
│    a. Executes findConflict() inside transaction.                                        │
│    b. Partial Unique Index (`uniq_active_slot`) on (tenant, doctor, start) backstops     │
│       simultaneous inserts.                                                              │
│    c. Insert succeeds ➔ Commit Transaction ➔ Return appointment ID & Walk-in Token.     │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Conflict Definition:** Two appointments for the same doctor overlap iff:
  `existing.start < new.end AND existing.end > new.start`
- **Touching Edges:** Adjacent slots (e.g., `10:00–10:15` and `10:15–10:30`) do **NOT** conflict.
- **Cancelled / No-Show Slots:** Appointments with status `cancelled` or `no-show` do not occupy slots and are excluded from conflict queries.

---

## 4. Test Matrix & Automated Coverage

| Test Area | File Location | Covered Scenario |
| :--- | :--- | :--- |
| **Unit Overlap** | `tests/int/bookingEngine.int.spec.ts` | Overlap calculation & touching adjacent slots |
| **Slot Generation** | `tests/int/bookingEngine.int.spec.ts` | Generating clickable slots for active doctors |
| **Inactive Doctor** | `tests/int/bookingEngine.int.spec.ts` | Rejecting slot generation for inactive doctors |
| **Conflict & Cancellation**| `tests/int/bookingEngine.int.spec.ts` | Blocking occupied slots & freeing cancelled slots |
| **Race Condition** | `tests/int/bookingEngine.int.spec.ts` | Simultaneous concurrent booking requests for same slot |
| **Playwright E2E** | `tests/e2e/patientBooking.e2e.spec.ts` | Full patient booking journey end-to-end |
