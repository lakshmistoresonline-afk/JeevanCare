# Implementation Plan — Interactive Hierarchical Location & Doctor Discovery Widget on Landing Page

Replace or augment the static grid on the landing page with an intuitive, interactive cascading dropdown selector (**State** [Kerala] -> **District** [Thrissur] -> **City/Area** -> **Clinic** -> **Specialty** -> **Doctor**) that dynamically filters and displays every registered clinic and doctor in the database without omission, followed by direct booking flow redirection.

## Proposed Changes

### [Seed Data & Registration Updates]
#### [MODIFY] [seedTest.ts](file:///D:/clinic-management-main/clinic-management-main/src/seedTest.ts)
- Update seed data so every clinic and doctor record explicitly populates `state` ("Kerala"), `district` ("Thrissur"), and `city`/`area` (e.g., Swaraj Round, Mission Quarters, Ayyanthole, Chembukkavu, East Fort, West Fort, Punkunnam, Ollur, Mannuthy, Koorkanchery).
- Ensure all 10 clinics and 25 doctors are populated with these location attributes.

#### [MODIFY] [Tenants.ts](file:///D:/clinic-management-main/clinic-management-main/src/collections/Tenants.ts)
- Ensure fields for `state`, `district`, and `city` are supported in clinic schemas.

### [Interactive Discovery Widget Component]
#### [NEW] [ClinicDoctorFinder.tsx](file:///D:/clinic-management-main/clinic-management-main/src/components/ClinicDoctorFinder.tsx)
- Client component providing cascading dropdowns:
  1. State (Default: Kerala)
  2. District (Default: Thrissur)
  3. Area / Locality (Dynamically filters available areas)
  4. Clinic (Dynamically filters clinics in selected area)
  5. Specialty / Doctor (Dynamically filters doctors at selected clinic)
- Direct **[Book Appointment]** button linked to patient login or booking.

#### [MODIFY] [page.tsx](file:///D:/clinic-management-main/clinic-management-main/src/app/(frontend)/page.tsx)
- Replace static grid with the `ClinicDoctorFinder` interactive component while retaining fallback visibility of all clinics/doctors.

## Verification Plan

### Automated Tests
- Run `npx tsc --noEmit` and `npm run lint`.
- Run `npm run seed:test` to verify database seeding with Kerala/Thrissur metadata.

### Manual Verification
- Test interactive dropdown hierarchy on the landing page (`http://localhost:3000`).
- Verify filtering works seamlessly for State, District, Area, Clinic, and Doctor.
