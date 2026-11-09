# JeevanCare — Authentication & Workspace Isolation Review

**Audit Date:** November 2026
**Files Inspected:**
- [`src/lib/auth.ts`](file:///E:/Jeevan_Care/src/lib/auth.ts)
- [`src/lib/bookingInternal.ts`](file:///E:/Jeevan_Care/src/lib/bookingInternal.ts)
- [`src/access/index.ts`](file:///E:/Jeevan_Care/src/access/index.ts)
- [`tests/int/patientRegistration.int.spec.ts`](file:///E:/Jeevan_Care/tests/int/patientRegistration.int.spec.ts)

---

## 1. Authentication Mechanics & Helper Evaluation

### A. React `cache()` Removal from `getCurrentUser()`
* **Location:** `src/lib/auth.ts#L18`
* **Finding:** `getCurrentUser` was previously wrapped in React's `cache()`. During integration test execution or server actions where cookies changed within the same request context tick, React's `cache()` returned stale memoized user objects.
* **Remediation:** Removed `cache()` wrapper from `getCurrentUser()`. The function now dynamically parses `reqHeaders.get('cookie')` on every execution, guaranteeing that user identity reflects current session cookies.

---

### B. Cookie Scope Hierarchy
* **Cookie Isolation:**
  - `payload-token-super` $\rightarrow$ SuperAdmin SaaS Workspace (`/super`)
  - `payload-token-staff` $\rightarrow$ Clinic Dashboard (`/dashboard`)
  - `payload-token-patient` $\rightarrow$ Consumer Patient Portal (`/patient/dashboard`)
  - `payload-token` $\rightarrow$ Global Fallback Token
* **Verification:** If a user with role `patient` attempts to access staff workspace routes (`requireDashboardSession()`), line 48 in `src/lib/auth.ts` explicitly redirects them to `/patient/dashboard`:
  ```ts
  if ((user as any).role === 'patient') redirect('/patient/dashboard')
  ```

---

### C. JWT Header & Authorization Fallback
* **Header Assembly:** `getCurrentUser` constructs a `Headers` instance containing both `cookie: payload-token=...` and `authorization: JWT ...`.
* **Security Behavior:** If `payload.auth({ headers })` fails to resolve a valid JWT, it returns `null` and halts execution. Failed authentication attempts never default or fall back to an arbitrary user identity.

---

## 2. Granular Role Verification Matrix

| Role | Workspace Route Access | Access Control Helper | Verification Status |
| :--- | :--- | :--- | :--- |
| **`superAdmin`** | `/super`, `/dashboard`, `/admin` | `isSuperAdmin(user)` | ✅ Verified (Global Read/Write Across Tenants) |
| **`owner`** | `/dashboard/*` | `tenantScoped` | ✅ Verified (Scoped to Session Clinic Tenant) |
| **`doctor`** | `/dashboard/appointments`, `/dashboard/visits/new` | `tenantScoped` | ✅ Verified (Scoped to Session Clinic Tenant) |
| **`receptionist`** | `/dashboard/appointments`, `/dashboard/invoices` | `tenantScoped` | ✅ Verified (Scoped to Session Clinic Tenant) |
| **`patient`** | `/patient/dashboard`, `/patient/*` | `patientSelfAccess` | ✅ Verified (Strictly Scoped to Self `patientProfile` ID) |
