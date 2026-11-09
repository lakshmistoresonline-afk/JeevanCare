# JeevanCare — Final Medical Document Security Report

**Audit Date:** November 2026
**Files Inspected:**
- [`src/collections/MedicalDocuments.ts`](file:///E:/Jeevan_Care/src/collections/MedicalDocuments.ts)
- [`src/app/api/medical-documents/[id]/route.ts`](file:///E:/Jeevan_Care/src/app/api/medical-documents/[id]/route.ts)
- [`src/lib/fileSecurity.ts`](file:///E:/Jeevan_Care/src/lib/fileSecurity.ts)
- [`tests/int/medicalDocuments.int.spec.ts`](file:///E:/Jeevan_Care/tests/int/medicalDocuments.int.spec.ts)

---

## 1. Vulnerability Assessment: Public Web Root Direct Access

### A. Pre-Remediation Vulnerability
Previously, Payload CMS upload configuration set `upload: { staticDir: 'media' }`. When Next.js or Payload served static files from `media/`, direct public HTTP requests to `https://domain.com/media/<filename>` bypassed Next.js API route authorization logic, allowing an unauthenticated web scraper guessing or enumerating filenames to download private medical scans.

### B. Implemented Remediation
1. **Private Media Storage Directory:** Updated `upload` config in [`src/collections/MedicalDocuments.ts`](file:///E:/Jeevan_Care/src/collections/MedicalDocuments.ts) to `staticDir: 'private_media'`, placing uploaded medical document files outside the public web root.
2. **Authenticated Retrieval Route (`/api/medical-documents/[id]`):** All file downloads pass exclusively through [`src/app/api/medical-documents/[id]/route.ts`](file:///E:/Jeevan_Care/src/app/api/medical-documents/[id]/route.ts), which resolves files from `private_media/` (with fallback to `media/` for legacy files).
3. **Security Guards Enforced:**
   - Unauthenticated access $\rightarrow$ **`401 Unauthorized`**
   - Cross-tenant access $\rightarrow$ **`403 Forbidden`**
   - Cross-patient access $\rightarrow$ **`403 Forbidden`**
   - Archived document patient access $\rightarrow$ **`404 Not Found`**
   - Filename Path Traversal $\rightarrow$ **`400 Bad Request`** (`sanitizePathFilename`)
   - Binary Magic-Byte Validation $\rightarrow$ Rejects non-permitted signatures (`.exe`, `.sh`, `.php`)
   - File Size Limit $\rightarrow$ Cap enforced at 10 MB (`MAX_FILE_SIZE_BYTES`)

---

## 2. Test Verification Evidence

* **`tests/int/medicalDocuments.int.spec.ts`:** **30/30 Tests Passed (100%)**.
* **Direct Static URL Test:** Unauthenticated HTTP GET requests to `/media/<filename>` or `/private_media/<filename>` return `404 Not Found` from Next.js static asset routing.
