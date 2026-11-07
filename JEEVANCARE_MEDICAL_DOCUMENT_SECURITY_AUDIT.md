# JeevanCare — Medical Document Security & Privacy Audit Report

**Audit Date:** November 2026
**Scope:** Medical Document Storage, File Upload Security, Magic-Byte File Validation, Path Traversal, MIME Types, and Download Route Authorization.

---

## 1. Document Management Architecture

Medical documents (Lab Reports, Blood Tests, X-Rays, Scanned Prescriptions, Discharge Summaries) are managed via the `MedicalDocuments` Payload CMS collection (`src/collections/MedicalDocuments.ts`) and served through a dedicated secure download API route (`src/app/api/medical-documents/[id]/route.ts`).

---

## 2. Security Analysis & Upload Boundaries

### A. Magic-Byte File Validation (`src/lib/fileSecurity.ts`)
Uploads are validated at the binary level before writing to disk:
* **Allowed MIME Types:** `application/pdf`, `image/jpeg`, `image/png`, `image/webp`.
* **Magic-Byte Signature Checks:**
  - PDF: `%PDF-` (`0x25 0x50 0x44 0x46`)
  - JPEG: `0xFF 0xD8 0xFF`
  - PNG: `0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A`
  - WEBP: `RIFF....WEBP`
* **File Size Cap:** Strictly enforced at **10 MB** (`MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024`).
* **SHA-256 Checksum:** Automatically computed and stored on the document payload.

---

### B. Download Route Security (`src/app/api/medical-documents/[id]/route.ts`)
* **Session Verification:** Rejects unauthenticated requests (`401 Unauthorized`).
* **Tenant Isolation:** Verifies `doc.tenant.id === getTenantID(user)` (`403 Forbidden`).
* **Patient Ownership:** For `patient` accounts, verifies `doc.patient.id === getPatientID(user)` (`403 Forbidden`).
* **Archived Document Check:** Patient accounts cannot view soft-deleted/archived files (`404 Not Found`).
* **Path Traversal Protection (`sanitizePathFilename`):**
  Ensures requested filenames are sanitized and resolved strictly inside `path.resolve(process.cwd(), 'media')`.
* **Security Headers:**
  `Content-Disposition: inline; filename="..."`
  `X-Content-Type-Options: nosniff`

---

## 3. Vulnerabilities & Remediation Plan

### Finding DOC-001 (P0): Static Asset Public Serving Vulnerability
* **Location:** `src/collections/MedicalDocuments.ts` (`upload: { staticDir: 'media' }`)
* **Vulnerability:** Payload CMS serves `staticDir: 'media'` files over public static HTTP URLs (e.g. `https://domain.com/media/scan_123.pdf`).
* **Impact:** An unauthenticated user who guesses or scrapes file URLs can bypass the `/api/medical-documents/[id]` route and view confidential medical scans.
* **Remediation:** Configure static file storage to write to a private directory (`private_media`) or an encrypted, non-public S3 bucket (`privateRead`).

---

### Finding DOC-002 (P2): Lack of Antivirus / Malware Scanning
* **Vulnerability:** File uploads validate magic bytes but do not execute active antivirus scanning (e.g., ClamAV).
* **Remediation:** Integrate a lightweight virus scanner pipeline for production deployments.
