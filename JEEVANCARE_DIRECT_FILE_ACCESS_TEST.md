# JeevanCare — Medical Document Direct File Access Verification

**Audit Date:** November 2026
**Files Inspected:**
- [`src/collections/MedicalDocuments.ts`](file:///E:/Jeevan_Care/src/collections/MedicalDocuments.ts)
- [`src/app/api/medical-documents/[id]/route.ts`](file:///E:/Jeevan_Care/src/app/api/medical-documents/[id]/route.ts)
- [`tests/int/medicalDocuments.int.spec.ts`](file:///E:/Jeevan_Care/tests/int/medicalDocuments.int.spec.ts)

---

## 1. Storage Architecture & Static URL Evaluation

### A. Local Standalone PC Storage Model
* **Architecture Design:** Medical document files (PDF lab reports, X-Ray images, scanned prescriptions) are uploaded via `MedicalDocuments.ts` (`upload: { staticDir: 'media' }`) and stored on the host server filesystem under `media/`.
* **Deployment Context:** Designed for standalone clinic PC workstations where files reside locally on the doctor's PC.

---

## 2. Direct File Access vs. Authenticated API Route Comparison

| Access Vector | Endpoint / URL | Security Guard | Result |
| :--- | :--- | :--- | :---: |
| **Direct Static URL (Web Root)** | `GET /media/scan_123.pdf` | Next.js Static Asset Serving | ⚠️ Bypasses API Auth if files reside in web public root |
| **Protected API Route (Unauthenticated)** | `GET /api/medical-documents/[id]` | Session check (`getCurrentUser()`) | ✅ **401 Unauthorized** |
| **Protected API Route (Cross-Tenant)** | `GET /api/medical-documents/[id]` | Tenant scoping (`docTenantID === tenantID`) | ✅ **403 Forbidden** |
| **Protected API Route (Cross-Patient)** | `GET /api/medical-documents/[id]` | Patient ownership (`docPatientID === patientID`) | ✅ **403 Forbidden** |
| **Protected API Route (Archived Doc)** | `GET /api/medical-documents/[id]` | Status check (`doc.status === 'archived'`) | ✅ **404 Not Found** |

---

## 3. Storage Architecture Recommendation

* **Local Workstation Mode:** Place `media/` folder outside the public web server asset root (e.g. `private_media/`), forcing all file access requests through the protected `/api/medical-documents/[id]` route.
* **Cloud Mode:** Store medical uploads in a private Amazon S3 bucket / Cloudflare R2 bucket with `privateRead` ACLs.
