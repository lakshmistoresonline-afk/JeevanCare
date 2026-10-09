# JeevanCare — Billing & Payment Integrity Specification

**Document Version:** 1.0
**Target Branch:** `main` (`https://github.com/lakshmistoresonline-afk/JeevanCare.git`)
**Compliance Standard:** ISO/IEC 27001, OWASP ASVS & Indian Payment Standard (UPI 2.0).

---

## 1. Overview & Core Financial Principle

In **JeevanCare**, **billing totals and payment status are NEVER trusted from client input. Server-side hooks independently derive all financial calculations.**

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                INVOICE STATE MACHINE                                    │
├─────────────────┬───────────────────┬─────────────────────┬──────────────────────────────┤
│ 1. Subtotal/Total│ 2. Amount Paid    │ 3. Balance Due      │ 4. Payment Status            │
│ sum(qty × unit) │ sum(payments)     │ total - amountPaid  │ `unpaid` / `partial` / `paid`│
└─────────────────┴───────────────────┴─────────────────────┴──────────────────────────────┘
```

---

## 2. Implemented Financial Controls & Hardened Rules

### A. Server Derivation of Financial Fields
- **Calculation Hook (`src/collections/Invoices.ts`)**:
  - `totalAmount = sum(lineItems[i].quantity * lineItems[i].unitAmount)`
  - `amountPaid = sum(payments[j].amount)`
  - `balanceDue = totalAmount - amountPaid`
  - `paymentStatus = amountPaid <= 0 ? 'unpaid' : (balanceDue <= 0 ? 'paid' : 'partial')`
- Client-supplied financial totals in request payloads are unconditionally overwritten.

### B. Currency Preservation
- `currency` is snapshotted at invoice creation time from clinic settings (defaults to `INR`).
- Future changes to clinic settings never modify historical invoice currency or total amounts.

### C. Overpayment & Void Invoice Guards
- **Overpayment Guard:** Rejects payments where `amountPaid > totalAmount` with `400 PAYMENT_EXCEEDS_BALANCE`.
- **Void Invoice Freeze:** Voided invoices (`voided === true`) are frozen against line item edits, payment additions, or status updates (`403 INVOICE_VOIDED`).
- **Voiding Authorization:** Only clinic `owner` or `superAdmin` can set `voided: true`. A `voidReason` is strictly required.

### D. Line Item Lock After Payment
- Once a payment is recorded (`payments.length > 0`), the invoice line items (`description`, `quantity`, `unitAmount`) are locked against modification (`403 INVOICE_LOCKED`). To adjust line items, the invoice must be voided and re-issued.

### E. Relationship Boundary Isolation
- Atomically validates that `patient`, `visit`, and `appointment` belong to the same clinic `tenantID`.
- Cross-tenant or cross-patient billing attempts are rejected with `400 Validation Error`.

### F. Dynamic UPI Payment Integration (`src/components/UpiQrCode.tsx`)
- Renders dynamic Indian UPI QR codes (`upi://pay?pa={clinic_vpa}&am={balanceDue}&tn=Invoice_{invoiceNumber}`) on printable receipts (`/print/receipt/[id]`) and invoice details.

---

## 3. Automated Integration Test Coverage (`tests/int/billingIntegrity.int.spec.ts`)

| Test Case | Scenario | Expected Outcome |
| :--- | :--- | :--- |
| **Server Derivation** | Client supplies fake totalAmount = 10 | Calculated to true total = 1000 |
| **Overpayment Block**| Payment of 500 on 300 balance | Rejected with `PAYMENT_EXCEEDS_BALANCE` |
| **Void Freeze** | Payment attempt on voided invoice | Rejected with `INVOICE_VOIDED` |
| **Line Item Lock** | Modifying line items after payment | Rejected with `INVOICE_LOCKED` |
| **Unauthorized Void**| Receptionist attempting to void invoice | Denied with `403 Forbidden` |
| **Cross-Tenant Billing**| Invoice for Patient in Clinic B | Rejected with `400 Validation Error` |
