# JEEVANCARE FREE-TIER PRODUCTION DEPLOYMENT GUIDE

**Repository:** `https://github.com/lakshmistoresonline-afk/JeevanCare.git`
**Local Directory:** `E:\Jeevan Care`
**Branch:** `main`
**Target:** 100% Free-Tier Production Launch ($0/month infrastructure cost)

---

## Overview

This guide details how to launch JeevanCare live to production utilizing industry-standard, zero-cost free tiers for database hosting, serverless application deployment, and transactional email delivery.

---

## Step 1: Free Database Setup (MongoDB Atlas M0 Sandbox)

1. **Create Account & Cluster:**
   - Sign up for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Deploy a **Free Cluster (M0 Sandbox)**. (Atlas M0 clusters automatically include a 3-node Replica Set (`rs0`), fulfilling Payload CMS transaction requirements).
2. **Network & Database Access:**
   - Under **Network Access**, add IP address `0.0.0.0/0` to allow inbound connections from serverless hosting runners.
   - Under **Database Access**, create a dedicated database user with read/write privileges.
3. **Get Connection String:**
   - Click **Connect** $\rightarrow$ **Drivers** $\rightarrow$ Copy your connection string:
     `mongodb+srv://<username>:<password>@cluster.mongodb.net/jeevancare_prod?retryWrites=true&w=majority&clusterMode=replicaSet`

---

## Step 2: Free Hosting Setup (Vercel Hobby Tier)

Vercel's Free/Hobby Tier provides serverless Next.js hosting with automatic SSL and global CDN:

1. Sign in to [Vercel](https://vercel.com) using your GitHub account (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`).
2. Import the **JeevanCare** repository.
3. In **Project Settings $\rightarrow$ Environment Variables**, configure:
   - `DATABASE_URL` = Your MongoDB Atlas M0 connection string (with database name `jeevancare_prod`).
   - `PAYLOAD_SECRET` = A strong random 64-character secret key.
   - `NEXT_PUBLIC_SERVER_URL` = Your Vercel deployment URL (e.g., `https://jeevancare.vercel.app`).
   - `RESEND_API_KEY` = *(Optional)* Free tier Resend API key for transactional emails.
4. Click **Deploy**. Vercel will automatically build and publish your app with a free `*.vercel.app` domain and free SSL certificate.

---

## Step 3: Free Email Notifications (Resend Free Tier)

- Sign up for a free account at [Resend](https://resend.com) (includes 3,000 free emails per month).
- Generate an API key and add it as `RESEND_API_KEY` in Vercel.
- *Note:* JeevanCare's email module (`src/lib/email.ts`) features graceful degradation—if no API key is provided, emails are safely logged to console without crashing the application.

---

## Summary of Monthly Infrastructure Cost

* **MongoDB Atlas M0 Sandbox:** $0 / month (512MB storage, replica set enabled)
* **Vercel Hobby Hosting:** $0 / month (Serverless Next.js deployment)
* **Resend Free Tier:** $0 / month (3,000 transactional emails)
* **Total Live Cost:** **$0.00 / month**
