# JeevanCare — Zero-Cost Free Tier Deployment Guide

This guide outlines how to deploy **JeevanCare** ("Your Trusted Healthcare Companion") to production using top-tier, zero-cost free services.

## 1. Architecture & Clinic Access Model
- **Cloud SaaS Model**: JeevanCare is hosted centrally in the cloud. Clinics, doctors, receptionists, and patients require **zero local installation** — they access the platform via any standard web browser on desktop, tablet, or mobile.
- **Tenant Isolation**: Multi-tenant architecture securely isolates each registered clinic's data and settings server-side.

---

## 2. Recommended Free Tier Providers

| Component | Provider | Free Tier Limits | Purpose |
| :--- | :--- | :--- | :--- |
| **Database** | **MongoDB Atlas** (M0 Shared Cluster) | 512MB storage, replica set (`rs0`) | Cloud database for tenants, patients, visits & appointments |
| **Hosting** | **Vercel** (Hobby Tier) | Unlimited deployments, global CDN, HTTPS | Hosting Next.js App Router frontend & Payload CMS backend |
| **Email** | **Resend** | 3,000 emails / month | Transactional emails (password resets, verification & digests) |
| **Domain** | **Vercel / Cloudflare** | Free `*.vercel.app` or custom DNS | Public web URL access |

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Set Up MongoDB Atlas (Free M0 Cluster)
1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new shared cluster (`M0 Free Tier`) in a region close to your users (e.g., `AWS / Mumbai`).
3. Create a database user (username and password).
4. Under **Network Access**, add IP address `0.0.0.0/0` (Allow access from anywhere, required for serverless hosting).
5. Copy your connection string:
   ```env
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/jeevancare?retryWrites=true&w=majority&appName=Cluster0
   ```

### Step 2: Deploy to Vercel
1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **Add New > Project**.
3. Import your JeevanCare repository.
4. Configure **Environment Variables** in Vercel project settings:
   - `PAYLOAD_SECRET`: Generate a secure random string (e.g. `openssl rand -hex 32`)
   - `DATABASE_URL`: Paste your MongoDB Atlas connection string from Step 1
   - `RESEND_API_KEY`: (Optional) Your Resend API key for emails
   - `EMAIL_FROM`: `JeevanCare <onboarding@resend.dev>`
5. Click **Deploy**. Vercel will automatically run `npm run build` and deploy your app.

### Step 3: Post-Deployment Verification
1. Open your deployed Vercel URL (e.g., `https://jeevancare.app`).
2. Visit `/patient/login` or `/signup` to verify the application loads successfully.
3. Run test seeding if needed (`npm run seed:test`) or create your first clinic via the self-serve signup page.
