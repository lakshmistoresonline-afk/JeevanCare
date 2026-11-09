# JeevanCare — Clinical Data Integrity Report

**Audit Date:** November 2026
**Scope:** Double-Booking Guard, Walk-In Token Sequential Counter, Visit Immutability, Patient Demographics.

---

## 1. Clinical Data Safeguards

1. **Atomic OPD Token Counter:** `walkin_token_counters` collection atomically increments sequential tokens (`T-01`, `T-02`) per clinic per day.
2. **Double-Booking Partial Unique Index:** `uniq_active_slot` partial unique index on `{ tenant: 1, doctor: 1, start: 1 }` covers all active appointment statuses (`scheduled`, `checked-in`, `in-consultation`, `post-consultation`).
3. **Visit Immutability:** `Visits.ts` beforeValidate hook and `recordVisit` action reject duplicate visit creation attempts for completed appointments with `APIError 409 (DUPLICATE_VISIT)`.
4. **Prescription Preservation:** Consultation visits preserve prescription rows, vitals, diagnosis, and doctor credentials (`qualification`, `medicalRegistrationNumber`, `stateMedicalCouncil`) for A5 printing.
