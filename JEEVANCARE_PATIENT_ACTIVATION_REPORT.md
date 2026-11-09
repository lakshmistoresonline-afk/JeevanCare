# JeevanCare — Patient Identity Model & Activation Hardening Report

**Date:** November 2026
**Status:** All 18 Patient Registration & Activation Scenarios 100% Passed.

---

## 1. Activation Model Architecture

Patients created by clinic staff require single-use activation codes before gaining portal account access (`src/app/(frontend)/patient/register/actions.ts`).

1. **Activation Code Generation (`issuePatientActivationToken`):**
   - Generates cryptographically secure 6-digit activation code (`crypto.randomInt(100000, 999999)`).
   - Stores SHA-256 hash (`activationTokenHash`) and 24-hour expiry (`activationTokenExp`).
2. **Single-Use Atomic Consumption:**
   - Uses native MongoDB `updateOne` conditional matching (`activationTokenHash` + `activationTokenExp > now`).
   - Unsets `activationTokenHash` and `activationCode` upon account creation to prevent replay attacks.
3. **Cross-Tenant Security:**
   - Staff in Clinic A cannot issue activation codes for Clinic B patients (`403 Forbidden`).
   - Super-Admins have global activation issuance authority across all clinics.

---

## 2. Test Verification Evidence

* `tests/int/patientRegistration.int.spec.ts`: **18/18 Tests Passed (100%)**.
