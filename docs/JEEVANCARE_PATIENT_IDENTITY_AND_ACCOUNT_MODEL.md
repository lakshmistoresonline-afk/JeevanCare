# JeevanCare — Patient Identity & Portal Account Ownership Model

**Document Version:** 2.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)
**Compliance Standard:** ISO/IEC 29115 (Entity Authentication Assurance) & OWASP ASVS v4.0.

---

## 1. Executive Summary & Conceptual Distinction

In **JeevanCare**, a **Patient Medical Record** (`patients` collection) and a **Patient Portal User Account** (`users` collection with `role: 'patient'`) are strictly distinct entities:

```
┌─────────────────────────────────────────┐         ┌─────────────────────────────────────────┐
│          PATIENT MEDICAL RECORD         │         │           USER PORTAL ACCOUNT           │
│           (patients collection)         │         │            (users collection)            │
├─────────────────────────────────────────┤         ├─────────────────────────────────────────┤
│ • Holds clinical & medical history      │  1 : 1  │ • Holds login credentials (password/JWT)│
│ • Identified by per-clinic MRN (P-0001) │◄───────►│ • Role: 'patient'                       │
│ • Created by receptionist or self-reg   │ (Unique)│ • Linked strictly via `patientProfile`  │
│ • Contains allergies, vitals & visits   │         │ • Database-enforced partial unique index│
└─────────────────────────────────────────┘         └─────────────────────────────────────────┘
```

---

## 2. Core Ownership & Verification Rules

1. **Maximum One Active Portal Account Per Patient Record:**
   - Enforced at the database layer via MongoDB partial unique index `uniq_patient_profile_portal` on `{ patientProfile: 1 }` where `role: 'patient'` in `src/payload.config.ts`.
2. **Safe Staff-Created Record Claiming (No Unverified Takeovers):**
   - If a clinic receptionist creates a patient record in person at the front desk, registering for a portal account with that mobile number does **NOT** automatically grant access.
   - Registrants must supply their **Patient MRN** (e.g. `P-0001`, printed on prescriptions or clinic receipts) or a 6-digit **Activation Code** issued by clinic staff to claim the portal account.
   - Registering without valid MRN / Activation Code returns `{ code: 'VERIFICATION_REQUIRED' }` directing the user to enter their Patient MRN.
3. **Idempotency & Duplicate Prevention:**
   - Detects existing portal user accounts by mobile phone or email.
   - Attempting duplicate registration returns `{ code: 'PORTAL_ACCOUNT_EXISTS' }` directing the user to sign in or recover their password.
4. **Server-Side Identity Derivation (Zero Client-Input Trust):**
   - Patients cannot supply untrusted `tenant`, `patientProfile`, or existing patient IDs in form payloads to bypass checks. All relationship links are validated and derived on the server side.
5. **Cross-Tenant Mobile Number Matching:**
   - Mobile numbers are scoped per clinic tenant. A patient with the same mobile number registered in Clinic A can independently register in Clinic B without cross-tenant data leakage or account pollution.

---

## 3. Account Creation & Claiming Decision Tree

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            PATIENT REGISTRATION DECISION TREE                               │
├──────────────────┬──────────────────┬─────────────────────┬─────────────────────────────────┤
│ Portal Account?  │ Medical Record?  │ Activation Provided?│ Action / Result                 │
├──────────────────┼──────────────────┼─────────────────────┼─────────────────────────────────┤
│ Exists           │ Any              │ Any                 │ 🚫 Reject: `PORTAL_ACCT_EXISTS` │
│ No               │ Exists           │ Invalid / Missing   │ 🚫 Reject: `VERIFY_REQUIRED`    │
│ No               │ Exists           │ Valid (MRN / Code)  │ ✅ Claim: Link & Create Portal  │
│ No               │ None             │ Not Applicable      │ ✅ Create: New Record & Portal  │
└──────────────────┴──────────────────┴─────────────────────┴─────────────────────────────────┘
```

---

## 4. Automated Integration Test Matrix (`tests/int/patientRegistration.int.spec.ts`)

- **New Patient Registration:** Validates atomic creation of `patients` record and `users` portal account.
- **Unverified Staff-Created Claim Block:** Verifies registration without MRN / Activation Code is blocked with `VERIFICATION_REQUIRED`.
- **Verified Staff-Created Claim Success:** Verifies supplying valid MRN links the portal account.
- **Duplicate Account Prevention:** Verifies existing portal users receive `PORTAL_ACCOUNT_EXISTS`.
- **Cross-Tenant Phone Match Isolation:** Verifies same phone in Clinic B creates isolated record without leaking Clinic A patient records.
- **IDOR / Takeover Prevention:** Verifies client-supplied `patientProfile` form overrides are ignored.
