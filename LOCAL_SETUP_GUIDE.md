# JeevanCare — Local PC Execution & Setup Guide

**Target Platform:** Windows / macOS / Linux
**Repository:** `https://github.com/lakshmistoresonline-afk/JeevanCare.git`

---

## 📋 Prerequisites

Before running JeevanCare on your local PC, ensure the following software is installed:

1. **Node.js**: `v20.x` or higher ([Download Node.js](https://nodejs.org/))
2. **Git**: Installed ([Download Git](https://git-scm.com/))
3. **Docker Desktop**: Installed and running ([Download Docker Desktop](https://www.docker.com/products/docker-desktop/))
   *(Required for MongoDB Replica Set `rs0` transactions during slot booking)*

---

## 🚀 Step-by-Step Local Setup Guide

### Step 1: Open Terminal & Clone Repository
```bash
git clone https://github.com/lakshmistoresonline-afk/JeevanCare.git
cd "Jeevan Care"
```

### Step 2: Install Node Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:

- **On Windows PowerShell:**
  ```powershell
  Copy-Item .env.example .env
  ```
- **On Linux / macOS:**
  ```bash
  cp .env.example .env
  ```

Ensure your `.env` file contains the following variables:
```env
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
NODE_ENV=development
PAYLOAD_SECRET=32-character-random-payload-secret-key-here
DATABASE_URL=mongodb://127.0.0.1:27017/jeevancare?replicaSet=rs0
CRON_SECRET=random-cron-bearer-token-secret-here
```

### Step 4: Start MongoDB Replica Set (`rs0`) via Docker
> [!IMPORTANT]
> **Why Docker Replica Set?** JeevanCare executes double-booking reservation checks inside **MongoDB Transactions**. Standalone MongoDB instances turn transactions into no-ops, so a single-node replica set (`rs0`) is required.

Start MongoDB:
```bash
docker compose up -d
```

Verify container status:
```bash
docker compose ps
```

### Step 5: Seed Thrissur District Kerala UAT Test Dataset
Seed the database with 10 Thrissur City clinics, 25 specialist doctors, and 10 patient portal accounts:
```bash
npm run seed
```

### Step 6: Start Next.js Development Server
```bash
npm run dev
```

Open your browser and navigate to:
👉 **`http://localhost:3000`**

---

## 🔑 Pre-Configured UAT Test Logins

Universal Password for all test accounts: **`Test@123`**

| Persona | Login Route | Email | Testing Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `/login` | `admin@test.com` | Platform console & tenant management |
| **Clinic Owner** | `/login` | `owner1@test.com` | Swaraj Medical Centre (Revenue, Staff, Settings) |
| **Receptionist** | `/login` | `staff1@test.com` | In-person registration, Check-in, OPD TV queue, Billing |
| **Specialist Doctor**| `/login` | `doctor1@test.com` | Dr. Sabitha Krishnamoorthy (EMR, Prescriptions, Vitals) |
| **Patient Portal** | `/patient/login` | `patient1@test.com` | Live OPD queue tracker, Prescriptions, UPI receipts |

---

## 🧪 Verification & Testing Commands

To run quality checks locally:

```bash
# 1. Run TypeScript type check
npx tsc --noEmit

# 2. Run Linter
npm run lint

# 3. Run Integration & Unit Tests
npm run test:int

# 4. Production Build Test
npm run build
```

---

## 🛠️ Troubleshooting Common Issues

1. **`connect ECONNREFUSED 127.0.0.1:27017`**:
   - Docker Desktop is not running or MongoDB container is stopped.
   - Fix: Start Docker Desktop and run `docker compose up -d`.

2. **`Transaction numbers are only allowed on a replica set`**:
   - Local MongoDB is running in standalone mode instead of replica set mode.
   - Fix: Use `docker compose up -d` to run single-node `rs0`.
