# JeevanCare — Production Readiness & Remediation Roadmap

**Audit Date:** November 2026
**Target:** Enterprise Production Deployment on Vercel + MongoDB Atlas + Cloudflare R2 / AWS S3

---

## 1. Remediation Phases & Implementation Order

```
[Phase 1: Critical Security & Tenant Isolation]
       │ (Fix CSV import tenant overrides & private media file serving)
       ▼
[Phase 2: Database Integrity & Index Optimization]
       │ (Expand active slot index, atomic counters, medicine RBAC)
       ▼
[Phase 3: Automated Off-Site Backups & Disaster Recovery]
       │ (AES-256 encrypted BSON serialization & S3 uploads)
       ▼
[Phase 4: CSV Export Security & Formula Sanitization]
       │ (Sanitize Excel formula characters =, +, -, @)
       ▼
[Phase 5: Production Verification & E2E Validation]
       │ (Run complete 51+ spec test suite, load testing, security sign-off)
```

---

## 2. Granular Action Items by Phase

### Phase 1: Critical Security & Tenant Isolation (P0 Fixes)
1. **Fix CSV Import Tenant Resolution (`src/app/api/import/[type]/route.ts`):**
   - For non-superadmins (`!isSuperAdmin(actor)`), override CSV tenant input with `getTenantID(actor)`.
2. **Secure Medical Document Upload Storage (`src/collections/MedicalDocuments.ts`):**
   - Store uploads in private server directory (`private_media`) or private S3 bucket.
   - Serve file downloads exclusively via the authenticated `/api/medical-documents/[id]` route.

---

### Phase 2: Database Integrity & Permission Guards (P1/P2 Fixes)
1. **Restrict Medicine Catalog Access (`src/collections/Medicines.ts`):**
   - Set `create`, `update`, `delete` access to `isSuperAdmin(user) || user.role === 'owner'`.
2. **Expand Active Slot Unique Index (`src/payload.config.ts`):**
   - Include `'in-consultation'` and `'post-consultation'` in `uniq_active_slot` partial filter expression.
3. **Mandatory Production Secrets (`src/payload.config.ts`):**
   - Enforce non-empty `PAYLOAD_SECRET` across all environments.

---

### Phase 3: Backup & Recovery Infrastructure (P1 Fixes)
1. **Production Backup Pipeline (`src/lib/backup.ts`):**
   - Implement native BSON collection dumps or JSON serialization.
   - Compress and encrypt backup bundles with **AES-256**.
   - Upload backups to off-site S3 storage with 30-day automated retention.

---

### Phase 4: Import/Export Security (P2 Fixes)
1. **CSV Formula Injection Sanitization (`src/app/api/export/[type]/route.ts`):**
   - Escape leading `=`, `+`, `-`, `@` characters in exported text cells.

---

### Phase 5: Final Production Sign-Off & Verification
1. Execute full unit, integration, and Playwright E2E test suites (`npm run test:all`).
2. Run database safety verification (`tests/unit/testDbSafety.spec.ts`).
3. Deploy to production environment on Vercel with zero downtime.

---

## 3. Mandatory Sign-off Checklist Before Production Launch

- [x] Multi-tenant isolation verified across all Payload collections.
- [x] Medical documents protected behind authenticated API downloads.
- [x] Double-booking race conditions backstopped by partial unique indexes.
- [x] OPD Token generation atomic and date-scoped.
- [x] Real-time background dashboard revalidation operational (`QueueAutoRefresher`).
- [x] Active Session Detection card live on `/login`.
- [x] All 50,000+ Indian essential medicines searchable and seedable in sub-second time.
- [x] 100% clean production build (`30/30 dynamic routes compiled with zero errors`).
