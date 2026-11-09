# JeevanCare — Staging Deployment & Infrastructure Checklist

**Date:** November 2026
**Target:** Controlled Staging Environment (`https://staging.jeevancare.app`)

---

## 1. Pre-Deployment Staging Checklist

- [x] **Repository Synchronization:** Working tree clean & synchronized with `d087c84`.
- [x] **TypeScript Sign-Off:** `npx tsc --noEmit` returns zero errors.
- [x] **Test Suite Sign-Off:** All 40 test files (265 tests) pass 100%.
- [x] **Production Build Sign-Off:** `npm run build` compiles 30/30 routes cleanly.
- [x] **Isolated Staging Database:** Configured to `jeevancare_staging` (never touching production `jeevancare`).
- [x] **Secrets Validation:** `PAYLOAD_SECRET` validated for minimum 32 characters.
- [x] **Multi-Tenant CSV Guard:** Enforced `targetTenantID = getTenantID(actor)` for non-superadmins.
- [x] **Medical Document Protection:** Protected download route `/api/medical-documents/[id]` verified.
- [x] **Real-Time Background Sync:** `QueueAutoRefresher.tsx` active on all layouts.

---

## 2. Post-Deployment Verification Steps

1. Verify HTTPS SSL certificate binding on staging domain.
2. Verify SuperAdmin login at `/super` and active clinic onboarding.
3. Test front-desk OPD check-in, token generation (`T-01`), and EMR consultation visit creation.
4. Upload sample lab report PDF and verify authenticated download via `/api/medical-documents/[id]`.
5. Trigger bulk CSV import and confirm sub-second native bulk write performance.
