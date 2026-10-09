# JeevanCare — Current-State Code, Security & Component Inventory

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## 1. Feature Verification & Code Realization Matrix

| Component / Workflow | Status | Backend File | UI Path | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Multi-Tenant Isolation** | **VERIFIED** | `src/access/index.ts` | All routes | `tenantScoped` & `forceTenant` active |
| **Patient BOLA Isolation** | **VERIFIED** | `src/access/index.ts` | `/patient/*` | `patientSelfAccess` active |
| **Double-Booking Transaction Guard**| **VERIFIED** | `src/lib/booking.ts` | `/patient/appointments/book` | MongoDB `rs0` transaction + `uniq_active_slot` |
| **Real Available Slots Engine** | **VERIFIED** | `src/lib/availability.ts` | `PatientAppointmentBooker.tsx` | Clickable slot buttons (`getAvailableSlots`) |
| **Safe Patient Record Claiming** | **VERIFIED** | `patient/register/actions.ts` | `/patient/register` | MRN / Activation Code required to claim |
| **Split-Pane EMR Workspace** | **VERIFIED** | `Visits.ts` | `/dashboard/visits/new` | Vitals, diagnosis, quick dosage chips (`1-0-1 BD`) |
| **A5 Printable Prescriptions** | **VERIFIED** | `print/prescription/[id]` | `/print/prescription/[id]` | Clinic letterhead, doctor credentials, e-Signature |
| **Financial Server Derivation** | **VERIFIED** | `Invoices.ts` | `/dashboard/invoices/[id]` | Derived totals, overpayment guard, void locks |
| **Dynamic UPI Payment QR Codes** | **VERIFIED** | `UpiQrCode.tsx` | `/patient/billing` | `upi://pay?pa=...` QR code generation |
| **Binary Magic Byte Document Security**| **VERIFIED** | `fileSecurity.ts` | `/api/medical-documents/[id]` | PDF/JPEG/PNG/WEBP magic bytes & SHA-256 hash |
| **Append-Only Audit Logs** | **VERIFIED** | `AuditLogs.ts` | `/dashboard/activity` | `create/update/delete: denyAll`, `logAudit` helper |
| **FHIR R4 Candidate Mapping** | **VERIFIED** | `src/lib/fhir/index.ts` | Interoperability Layer | `toFhirPatient`, `toFhirPractitioner`, etc. |
| **Thrissur City UAT Test Dataset** | **VERIFIED** | `src/seedTest.ts` | `npm run seed` | 10 Thrissur clinics, 25 doctors, 10 patients |
| **Playwright 51-Workflow E2E Suite** | **VERIFIED** | `tests/e2e/` | Playwright Runner | Covered across all 51 clinical workflows |

---

## 2. Shared Design System & Token Architecture

- **Palette:** Clinical Calm (`#0d6e60` primary teal, `#e2efec` soft secondary, `#f7f6f2` warm paper canvas, `#182320` ink body text).
- **Typography:** Bricolage Grotesque (Display headings) + Figtree (Body & Metadata) + Tabular-nums for money/time.
- **Component Primitives:** Re-exported via `src/components/primitives.tsx` and `src/components/ui-kit.tsx`.
