# JeevanCare — Multi-Tenant Isolation & Data Boundaries Audit Report

**Audit Date:** November 2026
**Scope:** Multi-Tenant Database Architecture, Tenant Injection Hooks, Access Control Functions, GraphQL & REST Query Isolation.

---

## 1. Multi-Tenant Architecture Principles

JeevanCare employs a **Single Database, Discriminator-Based Multi-Tenant Architecture**. Every document belonging to a clinic contains a mandatory `tenant` relationship field storing the clinic's `Tenant` ObjectId.

```
[Tenants Collection]
       ▲
       │ (tenant ObjectId relationship)
       ├────── Users (role: owner | doctor | receptionist)
       ├────── Patients
       ├────── Appointments
       ├────── Visits
       ├────── Invoices
       ├─── MedicalDocuments
       └────── AuditLogs
```

---

## 2. Tenant Isolation Enforcement Mechanics

### A. Access Control Functions (`src/access/index.ts`)
* **`getTenantID(user)`**: Robustly extracts the tenant ID whether stored as a string, number, ObjectId, or populated document.
* **`tenantScoped` Access Rule:**
  ```ts
  export const tenantScoped: Access = ({ req: { user } }) => {
    if (!user) return false
    if (isSuperAdmin(user)) return true
    const tenantID = getTenantID(user)
    if (!tenantID) return false // Fail-closed: deny if no tenant relationship
    return { tenant: { equals: String(tenantID) } }
  }
  ```
* **`patientSelfAccess` Access Rule:**
  Restricts patient portal users strictly to reading records where `tenant` matches their clinic AND `patient` matches their own `patientProfile` ID.

---

### B. Automatic Tenant Injection Hook (`src/hooks/tenant.ts`)
* **`forceTenant` Hook:** Automatically populates `data.tenant` with `getTenantID(req.user)` on `beforeValidate` for all `create` operations, preventing staff from creating orphan records or manually specifying tenant IDs.

---

## 3. Findings & Security Vulnerabilities

### Finding TEN-001 (P0): CSV Importer Foreign Tenant Selection
* **File:** `src/app/api/import/[type]/route.ts`
* **Vulnerability:** `resolveTenantID` inspects CSV `clinic_name` input and overrides `targetTenantID` for non-superadmins.
* **Impact:** Cross-tenant record creation.
* **Remediation:** Enforce `targetTenantID = getTenantID(actor)` for all non-superadmin imports.

---

### Finding TEN-002 (P1): `overrideAccess: true` Usage Audit
* **Locations:**
  - `src/app/(frontend)/dashboard/appointments/actions.ts`
  - `src/app/(frontend)/dashboard/visits/actions.ts`
  - `src/app/api/medical-documents/[id]/route.ts`
* **Audit Finding:** All server actions using `overrideAccess: true` first resolve the caller's identity via `getCurrentUser()` and verify tenant ID equality before executing payload operations.
* **Recommendation:** Maintain strict manual tenant verification in any function bypassing Payload's built-in access control via `overrideAccess: true`.

---

## 4. Tenant Isolation Verification Test Suite

The test suite in `tests/unit/access.spec.ts` verifies:
1. `tenantScoped` returns `{ tenant: { equals: tenantID } }` for clinic owners, doctors, and receptionists.
2. `tenantScoped` returns `true` for `superAdmin`.
3. `tenantScoped` returns `false` (fail-closed) for unauthenticated or malformed requests.
4. Cross-tenant queries return empty result sets.
