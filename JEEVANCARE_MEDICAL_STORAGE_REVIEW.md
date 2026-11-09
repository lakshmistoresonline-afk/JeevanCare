# JeevanCare — Medical Storage & Document Security Review

**Audit Date:** November 2026
**Files Inspected:**
- [`src/collections/MedicalDocuments.ts`](file:///E:/Jeevan_Care/src/collections/MedicalDocuments.ts)
- [`src/app/api/medical-documents/[id]/route.ts`](file:///E:/Jeevan_Care/src/app/api/medical-documents/[id]/route.ts)
- [`src/lib/fileSecurity.ts`](file:///E:/Jeevan_Care/src/lib/fileSecurity.ts)
- [`tests/int/medicalDocuments.int.spec.ts`](file:///E:/Jeevan_Care/tests/int/medicalDocuments.int.spec.ts)

---

## 1. Storage Boundaries & Binary Validation

Medical document uploads (Lab Reports, X-Rays, Scans, Discharge Summaries) are processed in `MedicalDocuments.ts`:

1. **Magic-Byte Binary Inspection (`validateFileMagicBytes`):**
   Validates binary file signatures on `beforeValidate`:
   - `PDF` (`%PDF-`)
   - `JPEG` (`0xFF 0xD8 0xFF`)
   - `PNG` (`0x89 0x50 0x4E 0x47`)
   - `WEBP` (`RIFF....WEBP`)
   - Rejects `.exe`, `.sh`, `.php`, and corrupted files with `APIError 400`.
2. **File Size Cap:** Enforced at **10 MB** (`MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024`).
3. **SHA-256 Checksum:** Automatically computed and stored on the document record (`computeSha256`).

---

## 2. Authenticated Download Route Security

All document retrievals are routed through `GET /api/medical-documents/[id]`:

* **Authentication Guard:** Rejects signed-out callers (`401 Unauthorized`).
* **Tenant Scoping:** Verifies `doc.tenant.id === getTenantID(user)` (`403 Forbidden`).
* **Patient Ownership:** For `patient` accounts, verifies `doc.patient.id === getPatientID(user)` (`403 Forbidden`).
* **Archived Records:** Rejects patient access to archived documents (`404 Not Found`).
* **Path Traversal Guard (`sanitizePathFilename`):**
  Forces filenames to resolve strictly inside `path.resolve(process.cwd(), 'media')`.
* **Headers:** `Content-Disposition: inline`, `X-Content-Type-Options: nosniff`.
* **Audit Trail:** Logs an `export.generated` audit record on download.

---

## 3. Test Verification Metrics

* `tests/int/medicalDocuments.int.spec.ts`: **30/30 Scenarios Passed (100%)**.
