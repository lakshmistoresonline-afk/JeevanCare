# JeevanCare — Doctor PC Windows Local Medical Storage Implementation

**Implementation Date:** November 2026
**Files:**
- [`src/lib/localDocAgent.ts`](file:///E:/Jeevan_Care/src/lib/localDocAgent.ts)
- [`src/collections/MedicalDocuments.ts`](file:///E:/Jeevan_Care/src/collections/MedicalDocuments.ts)
- [`src/app/api/medical-documents/[id]/route.ts`](file:///E:/Jeevan_Care/src/app/api/medical-documents/[id]/route.ts)

---

## 1. Local Workstation Companion Architecture

To satisfy the business requirement that medical document files (PDFs, X-Rays, Scans) reside directly on each attending doctor's Windows workstation PC, JeevanCare provides a local storage engine (`src/lib/localDocAgent.ts`).

```
[Attending Doctor's Windows Workstation]
  └─ C:\Users\<User>\JeevanCare\MedicalDocuments\<tenantId>\<doctorId>\<filename>
       ▲
       │ (Authenticated Loopback / Local Agent Bridge)
       │
[JeevanCare Web Application]
  ├─ MongoDB Collection: `medical-documents` (Metadata, SHA-256, localStoragePath, agentId)
  └─ Download Route: `/api/medical-documents/[id]` (Auth, Tenant Check, Patient Scoping)
```

---

## 2. Key Safeguards & Implementation Features

1. **Local Filesystem Isolation:** Files are written to `C:\Users\<User>\JeevanCare\MedicalDocuments\<tenantId>\<doctorId>\<filename>`.
2. **Path Traversal Prevention:** Uses `sanitizePathFilename` to verify target paths remain inside the configured base directory.
3. **SHA-256 Checksum Verification:** Calculates SHA-256 hash on write and re-verifies integrity on read.
4. **Metadata Preservation:** MongoDB stores metadata (`localStoragePath`, `agentId`, `filesize`, `checksum`, `mimeType`, `documentType`), ensuring file binaries never leave the local PC unless explicit off-site backup is authorized.
5. **Fallback Server Storage:** If `localStoragePath` is not set or local agent is offline, `/api/medical-documents/[id]` seamlessly resolves private server files from `private_media/`.
