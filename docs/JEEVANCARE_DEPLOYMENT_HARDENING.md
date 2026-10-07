# JeevanCare — Production Configuration & Deployment Hardening

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)

---

## 1. Executive Summary & Production Environment Checklist

This document specifies the deployment hardening controls, environment variable configurations, MongoDB Replica Set requirements, Docker container builds, and security precautions for deploying **JeevanCare** to production.

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                            PRODUCTION DEPLOYMENT CHECKLIST                               │
├─────────────────┬───────────────────┬─────────────────────┬──────────────────────────────┤
│ Control         │ Environment       │ Configuration       │ Security Requirement         │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────────────────┤
│ Database        │ MongoDB 7.0       │ Single/Multi-node   │ Replica Set (`rs0`) MANDATORY│
│                 │                   │ Replica Set         │ for MongoDB transactions     │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────────────────┤
│ CMS Secret      │ `PAYLOAD_SECRET`  │ 32+ char random key │ Never committed in git       │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────────────────┤
│ Cron Token      │ `CRON_SECRET`     │ Bearer Auth Header  │ Protects `/api/cron/*`       │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────────────────┤
│ Mail Provider   │ `RESEND_API_KEY`  │ Resend API Client   │ Verified Domain DKIM/SPF     │
├─────────────────┼───────────────────┼─────────────────────┼──────────────────────────────┤
│ Container       │ Docker            │ Multi-stage Build   │ Non-root user (`nextjs:1001`)│
└─────────────────┴───────────────────┴─────────────────────┴──────────────────────────────┘
```

---

## 2. Environment Variable Inventory

| Environment Variable | Required | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SERVER_URL` | **Yes** | `https://jeevancare.in` | Public URL for asset resolution & links |
| `NODE_ENV` | **Yes** | `production` | Enables Next.js & cookie security flags |
| `PAYLOAD_SECRET` | **Yes** | *[Random 32+ Chars]* | Cryptographic signing key for JWT tokens |
| `DATABASE_URL` | **Yes** | `mongodb://.../jeevancare?replicaSet=rs0` | MongoDB connection URI with Replica Set |
| `CRON_SECRET` | **Yes** | *[Random Bearer Token]* | Secures `/api/cron/daily-digest` endpoint |
| `RESEND_API_KEY` | Optional | `re_123456789...` | API key for transactional emails |
| `DEFAULT_FROM_ADDRESS` | Optional | `noreply@jeevancare.in` | Email sender address |
| `DEFAULT_FROM_NAME` | Optional | `"JeevanCare Clinics"` | Email sender display name |

---

## 3. Mandatory MongoDB Replica Set Requirement

> [!CAUTION]
> **REPLICA SET (`rs0`) IS MANDATORY:**
> JeevanCare executes the double-booking slot reservation guard (`findConflict()`) inside a **MongoDB Transaction** (`req.transactionID`).
> Standalone MongoDB instances without a replica set turn transactions into a no-op, exposing booking race conditions under high concurrency.
>
> Deploy MongoDB using Docker Compose:
> ```bash
> docker compose up -d
> ```

---

## 4. Multi-Stage Docker Container Build

Build and run the production Docker container:
```bash
# Build image
docker build -t jeevancare:latest .

# Run container
docker run -d \
  --name jeevancare-app \
  -p 3000:3000 \
  --env-file .env \
  jeevancare:latest
```

---

## 5. Automated Build & Verification Steps

Run local build verification before deployment:
```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint check
npm run lint

# 3. Unit & Integration test suite
npm run test:int

# 4. Next.js production build
npm run build
```
