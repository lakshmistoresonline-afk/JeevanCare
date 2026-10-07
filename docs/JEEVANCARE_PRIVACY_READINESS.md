# JeevanCare — Privacy & Data Minimization Engineering Readiness

> [!IMPORTANT]
> **ENGINEERING READINESS DOCUMENT:**
> This document details technical privacy-by-design controls, data minimization practices, and security safeguards implemented across the JeevanCare platform. It is prepared for engineering review and does not constitute a formal legal conclusion or certification under the Indian Digital Personal Data Protection (DPDP) Act.

---

## 1. Technical Privacy-by-Design Safeguards

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                           PRIVACY-BY-DESIGN ENGINEERING CONTROLS                         │
├─────────────────┬───────────────────┬─────────────────────┬──────────────────────────────┤
│ 1. URL          │ 2. Audit & Logging│ 3. Error Handling   │ 4. Cookie & Credentials      │
│ Opaque ObjectIDs│ Action summaries  │ Sanitized user      │ HTTP-Only, Lax/Secure        │
│ No PII in params│ No passwords/tokens│ Stack traces hidden │ `.env` in `.gitignore`       │
└─────────────────┴───────────────────┴─────────────────────┴──────────────────────────────┘
```

---

## 2. Minimization in URLs, Logs & Error Messages

### A. URL Minimization
- **Opaque Resource Identifiers:** All application routes use MongoDB ObjectIDs or per-clinic auto-assigned MRNs (`/dashboard/patients/65a1b2c3...`, `/patient/appointments`).
- **No PII in Query Strings:** Patient names, phone numbers, and email addresses are **never** passed in URL query strings or browser history paths.

### B. Audit Log Minimization
- **Human-Readable Action Summaries:** The `logAudit` helper logs action type, target ID, actor ID, and concise human summaries (e.g. `Booked Anita Krishnan with Dr. Ramesh`).
- **Zero Sensitive Credential Exposure:** Passwords, JWT tokens, credit card numbers, and full medical document file contents are **never** stored in audit logs.

### C. Error Message & Stack Trace Suppression
- **Mapped Error Codes (`src/lib/errors.ts`)**: Server action exceptions are mapped to stable, safe error codes (`VALIDATION`, `FORBIDDEN`, `SLOT_TAKEN`, `INVOICE_LOCKED`).
- **Production Suppression:** Internal database stack traces and Mongoose connection errors are suppressed from user-facing error banners in production.

---

## 3. Cookie & Credentials Security

1. **Authentication Session Cookies:**
   - Cookie name: `payload-token`
   - Attributes: `httpOnly: true`, `path: '/'`, `sameSite: 'lax'`, `secure: process.env.NODE_ENV === 'production'`.
2. **Secrets & Environment Variables:**
   - Production secrets (`PAYLOAD_SECRET`, `DATABASE_URL`) are referenced exclusively via server-side environment variables.
   - `.env` files are strictly excluded from version control in `.gitignore`.

---

## 4. Synthetic Test Data Verification

- **UAT & Integration Tests:** All test scripts (`src/seedTest.ts`, `tests/int/fixtures.ts`) utilize synthetic test accounts (e.g., `Patient Anita Krishnan`, `patient1@test.com`, phone `03001234567`) with the standardized test password `Test@123`.
- **No Real Patient PII in Repository:** The codebase contains zero real-world patient records, actual Indian Aadhaar numbers, or live clinical data.

---

## 5. Third-Party Disclosures & Integrations

- **WhatsApp Sharing (`src/lib/whatsapp.ts`)**: Generates direct `wa.me` deep links processed entirely on the client browser. No patient data is sent to external ad networks or tracking trackers.
- **Dynamic UPI Payment Codes (`src/components/UpiQrCode.tsx`)**: Generates client-side QR codes (`upi://pay?pa=...`) for instant bill payment without transmitting patient billing data to third-party payment gateways.
