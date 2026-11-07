# JeevanCare — Comprehensive Security Audit Report

**Audit Date:** November 2026
**Scope:** Authentication, Session Cookie Handling, Input Validation, CSRF/XSS, File Uploads, Rate Limiting, and Secret Management.

---

## 1. Executive Summary & Critical Risk Assessment

A full security audit was conducted on JeevanCare's codebase (`E:\Jeevan Care`). The platform enforces strong TypeScript typing and Payload CMS access controls. However, critical vulnerabilities were identified in CSV import tenant resolution, direct file serving, and password hashing fallbacks.

---

## 2. Key Vulnerability Summary Table

| Finding ID | Severity | Category | File & Location | Summary |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-001** | **P0 (Critical)** | Authorization Bypass | `src/app/api/import/[type]/route.ts#L26` | Non-superadmin staff can inject foreign clinic tenant IDs via CSV. |
| **SEC-002** | **P0 (Critical)** | Data Leakage | `src/collections/MedicalDocuments.ts#L36` | Direct static file serving (`/media/`) bypasses API authorization. |
| **SEC-003** | **P1 (High)** | Data Tampering | `src/collections/Medicines.ts#L12` | Patient accounts have write/delete permissions on the medicine catalog. |
| **SEC-004** | **P1 (High)** | Secret Exposure | `src/payload.config.ts#L18` | Hardcoded fallback JWT secret in non-production environments. |
| **SEC-005** | **P2 (Medium)** | Injection Risk | `src/app/api/export/[type]/route.ts` | CSV exports lack Excel formula injection protection. |

---

## 3. Detailed Vulnerability Breakdown

### Finding SEC-001 (P0): Cross-Tenant Data Injection via CSV Import
* **File:** `src/app/api/import/[type]/route.ts`
* **Code Evidence:**
  ```ts
  async function resolveTenantID(payload: any, isSuper: boolean, actor: any, row: Record<string, string>, rowIndex?: number) {
    const rawClinicKey = row.clinic_name || row['clinic name'] || row.clinic || row.tenantid || row.clinic_id || ''
    if (rawClinicKey) {
      // Resolves tenant ID directly from CSV row input without checking actor role!
      const matched = allTenants.docs.find((t: any) => t.name.trim().toLowerCase() === targetName)
      if (matched) return String(matched.id)
    }
    ...
  }
  ```
* **Exploit Scenario:** A receptionist logged into Clinic A uploads a Patients or Appointments CSV containing `clinic_name: "Swaraj Medical Centre"`. The system resolves `targetTenantID` to Swaraj Medical Centre and inserts records into another clinic's database.
* **Remediation:** For non-superadmins (`!isSuperAdmin(actor)`), force `targetTenantID = getTenantID(actor)` strictly from the authenticated request session.

---

### Finding SEC-002 (P0): Direct Public Media Access Bypass
* **File:** `src/collections/MedicalDocuments.ts`
* **Code Evidence:**
  ```ts
  upload: {
    staticDir: 'media',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
  }
  ```
* **Exploit Scenario:** Payload CMS serves files placed in `staticDir: 'media'` as public assets (`/media/filename.pdf`). An unauthenticated web scraper can download confidential patient lab reports directly without passing through `/api/medical-documents/[id]`.
* **Remediation:** Move uploaded medical files to a non-public folder outside the web root (`private_media`) or private S3 bucket, serving file requests exclusively through the authenticated `/api/medical-documents/[id]` route.

---

### Finding SEC-003 (P1): Medicine Catalog Modification by Patients
* **File:** `src/collections/Medicines.ts`
* **Code Evidence:**
  ```ts
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  }
  ```
* **Exploit Scenario:** Any authenticated `patient` account can issue REST or GraphQL requests to alter or delete prescription medicine records, corrupting clinic drug dictionaries.
* **Remediation:** Change `create`, `update`, and `delete` access to `isSuperAdmin(user) || user.role === 'owner'`.

---

### Finding SEC-004 (P1): Fallback JWT Secret in Development
* **File:** `src/payload.config.ts`
* **Code Evidence:**
  ```ts
  const secret = process.env.PAYLOAD_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'jeevancare_dev_secret_fallback_key_minimum_32_chars_2026')
  ```
* **Exploit Scenario:** If `PAYLOAD_SECRET` is omitted in staging or non-production deployments, all JWT session tokens are signed with a known public fallback string, enabling token forgery.
* **Remediation:** Require `PAYLOAD_SECRET` to be set in all environments, throwing a hard startup error if missing.

---

### Finding SEC-005 (P2): CSV Formula Injection Risk
* **File:** `src/app/api/export/[type]/route.ts`
* **Exploit Scenario:** If a patient enters their name or chief complaint as `=CMD|' /C calc.exe'!A1`, exported CSV files opened in Microsoft Excel execute arbitrary commands.
* **Remediation:** Prefix any cell value starting with `=`, `+`, `-`, or `@` with a single quote (`'`).
