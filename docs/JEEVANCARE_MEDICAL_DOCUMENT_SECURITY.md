# JeevanCare — Medical Document Security & Management Specification

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)
**Compliance Standard:** ISO/IEC 27001, OWASP ASVS v4.0 (V12 File Upload Security) & Indian DPDP Act.

---

## 1. Overview & Security Architecture

The **JeevanCare Medical Document Management System** handles sensitive patient health records, diagnostic lab reports, X-rays, and medical certificates.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         MEDICAL DOCUMENT SECURITY CONTROL LAYERS                          │
├─────────────────┬───────────────────┬─────────────────────┬──────────────────────────────┤
│ 1. Content      │ 2. Filename & Path│ 3. Storage & Hash   │ 4. Authorization & Download  │
│ Magic Byte Check│ UUID Storage Name │ SHA-256 Checksum    │ Dynamic Ownership Guard      │
│ Strict Allowlist│ Path Traversal    │ Duplicate Detection │ Audit Log Trigger            │
│ (%PDF-, PNG, JPG│ Sanitization      │ 10 MB Hard Cap      │ X-Content-Type-Options       │
└─────────────────┴───────────────────┴─────────────────────┴──────────────────────────────┘
```

---

## 2. Implemented Security Controls

### A. Magic Byte Buffer Validation (Strict Allowlist)
- **Engine (`src/lib/fileSecurity.ts`)**: Validates the actual binary content header (magic bytes) before storing the file, overriding any untrusted client-supplied `Content-Type` header:
  - **PDF:** Must begin with `%PDF-` (`0x25 0x50 0x44 0x46`).
  - **JPEG:** Must begin with `0xFF 0xD8 0xFF`.
  - **PNG:** Must begin with `\x89PNG` (`0x89 0x50 0x4E 0x47`).
  - **WEBP:** Must begin with `RIFF` at offset 0 and `WEBP` at offset 8.
- **Malicious Payload Rejection:** Executable content (Windows EXE `MZ`, ELF, PKZip executables, or HTML/JS script tags) disguised with `.pdf` or `.png` extensions are rejected with `400 Validation Error`.

### B. Untrusted Filename & Storage Sanitization
- **UUID Storage Name:** Never uses original filenames as storage paths. Generates safe UUID-based storage filenames (e.g. `a1b2c3d4-e5f6-7890-a1b2-c3d4e5f67890.pdf`).
- **Path Traversal Guards (`sanitizePathFilename`)**: Strips path traversal sequences (`..`, `/`, `\`, `%00`) to prevent directory escape attacks.

### C. Server-Side Size Cap & SHA-256 Data Integrity
- **10 MB Size Limit (`MAX_FILE_SIZE_BYTES`)**: Enforced server-side in `MedicalDocuments.ts` collection hooks.
- **SHA-256 Checksum (`computeSha256`)**: Computes cryptographic hash on upload and stores it in the `checksum` field for data integrity and duplicate detection.

### D. Download Route Authorization (`/api/medical-documents/[id]`)
- **Per-Download Authorization:** Every download request re-verifies session authentication, tenant isolation (`docTenantID === tenantID`), and patient ownership (`docPatientID === patientID`).
- **Archived Document Restrictions:** Archived medical documents (`status: 'archived'`) are hidden from patient portal views.
- **Audit Logging:** Every file download triggers a `document.downloaded` audit event.

---

## 3. Malware & Antivirus Scanning Workframe Status

> [!IMPORTANT]
> **MALWARE / AV SCANNING FUTURE WORK NOTICE:**
> In accordance with project requirements, **no fake antivirus scanning is claimed**. Real-time ClamAV / AWS GuardDuty Malware Protection integration is documented as **Future Enterprise Work**. All current file uploads rely on strict magic byte verification, size caps, and non-executable storage permissions.

---

## 4. Automated Integration Test Matrix (`tests/int/medicalDocumentSecurity.int.spec.ts`)

| Test Case | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **Authentic Formats** | PDF, JPEG, PNG buffers | Passed validation & MIME resolved |
| **Malicious Executables** | Windows EXE disguised as PDF | Rejected with `400 Validation Error` |
| **Script Injection** | HTML/JS script tags in image extension | Rejected with `400 Validation Error` |
| **Oversized Files** | File exceeding 10 MB limit | Rejected with `400 Size Exceeded` |
| **Path Traversal** | Filename containing `../../etc/passwd` | Sanitized to `passwd` |
| **SHA-256 Hash** | Document upload checksum computation | Verified hash match |
| **Cross-Tenant Attach** | Doctor attaching doc to Clinic B patient | Rejected with `400 Cross-Tenant` |
