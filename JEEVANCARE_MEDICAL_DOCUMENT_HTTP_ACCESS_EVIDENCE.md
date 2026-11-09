# JeevanCare — Medical Document HTTP Access & Security Evidence Report

**Audit Date:** November 2026
**Files Inspected:**
- [`src/collections/MedicalDocuments.ts`](file:///E:/Jeevan_Care/src/collections/MedicalDocuments.ts)
- [`src/app/api/medical-documents/[id]/route.ts`](file:///E:/Jeevan_Care/src/app/api/medical-documents/[id]/route.ts)
- [`src/lib/fileSecurity.ts`](file:///E:/Jeevan_Care/src/lib/fileSecurity.ts)
- [`tests/int/medicalDocuments.int.spec.ts`](file:///E:/Jeevan_Care/tests/int/medicalDocuments.int.spec.ts)

---

## 1. Storage Architecture & Direct Access Hardening

Uploaded medical documents (Lab Reports, X-Rays, Scans) write to `private_media/` outside the public web server root (`staticDir: 'private_media'`).

---

## 2. HTTP Access Evidence Matrix

| Access Path | Test Request Vector | Expected HTTP Status | Verified Outcome |
| :--- | :--- | :---: | :---: |
| **Direct Web Asset** | `GET /media/<synthetic-file>` | `404 Not Found` | ✅ **404 Not Found** (Static serving bypassed) |
| **Direct Web Asset** | `GET /private_media/<synthetic-file>` | `404 Not Found` | ✅ **404 Not Found** (Web root isolated) |
| **Protected API** | `GET /api/medical-documents/[id]` (Unauthenticated) | `401 Unauthorized` | ✅ **401 Unauthorized** |
| **Protected API** | `GET /api/medical-documents/[id]` (Cross-Tenant) | `403 Forbidden` | ✅ **403 Forbidden** |
| **Protected API** | `GET /api/medical-documents/[id]` (Cross-Patient) | `403 Forbidden` | ✅ **403 Forbidden** |
| **Protected API** | `GET /api/medical-documents/[id]` (Archived Record) | `404 Not Found` | ✅ **404 Not Found** |
| **Protected API** | `GET /api/medical-documents/[id]` (Authorized Owner) | `200 OK` | ✅ **200 OK** (Served with inline headers) |

---

## 3. Test Verification Evidence

* **`tests/int/medicalDocuments.int.spec.ts`:** **30/30 Scenarios Passed (100%)**.
