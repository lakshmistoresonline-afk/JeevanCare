# Implementation Plan — Public Clinic & Doctor Directory on JeevanCare Landing Page

Showcase all active clinics and their respective doctors on the public homepage (`src/app/(frontend)/page.tsx`), allowing new or returning patients to browse specialists, view consultation fees, and initiate appointment booking with smart redirection to login or registration.

## Proposed Changes

### [Landing Page Directory]
#### [MODIFY] [page.tsx](file:///D:/clinic-management-main/clinic-management-main/src/app/(frontend)/page.tsx)
- Server-side fetch active clinics (`tenants`) and active doctors (`users` with `role: 'doctor'`) using Payload local API.
- Add a dedicated public section: **"Our Network of Clinics & Specialist Doctors"**.
- Display clinic cards containing clinic name, city, state, phone, and list of doctors (name, specialty, consultation fee in `₹`).
- Each doctor card features a **"Book Appointment"** action button:
  - If unauthenticated -> redirects to `/patient/login` or `/patient/register`.
  - If authenticated as patient -> redirects to patient booking.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` and `npm run lint`.
- Run `vitest run tests/int/patientPortal.int.spec.ts`.

### Manual Verification
- Verify clinics and doctors render correctly on the public homepage.
- Test clicking book appointment redirects unauthenticated visitors to patient login/register.
