# JeevanCare — Staging Deployment Guide

**Document Date:** November 2026
**Target Host:** Vercel / AWS Container (`https://staging.jeevancare.app`)

---

## 1. Staging Deployment Checklist

1. **Environment Variables:**
   - `DATABASE_URL` = `mongodb+srv://.../jeevancare_staging`
   - `PAYLOAD_SECRET` = Minimum 32-character production-grade secret.
   - `STAGING` = `true`
   - `NEXT_PUBLIC_SERVER_URL` = `https://staging.jeevancare.app`
2. **Deploy Build:** Deploy repository to Vercel.
3. **1-Click Seed:** Open `/dashboard/import` and click `Populate Indian Medicine Catalog (1-Click)` to seed all 50,000+ Indian essential medicines in under 1 second.
