# JeevanCare — Backup Architecture & AES-256 Encryption Specification

**Implementation Date:** November 2026
**Files:**
- [`src/lib/backup.ts`](file:///E:/Jeevan_Care/src/lib/backup.ts)
- [`src/lib/restore.ts`](file:///E:/Jeevan_Care/src/lib/restore.ts)
- [`tests/int/backupRestore.int.spec.ts`](file:///E:/Jeevan_Care/tests/int/backupRestore.int.spec.ts)

---

## 1. Complete Collection Coverage & Un-Truncated Serialization

The backup pipeline in `src/lib/backup.ts` handles full data dumps across all core collections:
* `tenants`, `users`, `patients`, `appointments`, `visits`, `invoices`, `auditLogs`, `medical-documents`, `medicines`.

### Un-Truncated Pagination:
Instead of truncating at 10,000 documents, `runTenantBackup` paginates in batches of 500 documents until `hasNextPage` is false, guaranteeing 100% complete data dumps regardless of collection size.

---

## 2. AES-256-GCM Encryption at Rest

Backups are encrypted using AES-256-GCM with PBKDF2 key derivation (`100,000 iterations`, `32-byte derived key`, `12-byte random IV`, `16-byte random salt`):

```ts
const encryptedJson = encryptBackupContent(backupJsonString, secretKey)
```

The encrypted archive bundle (`.json.enc`) includes authentication tag verification (`cipher.getAuthTag()`) to prevent data tampering before restoration.

---

## 3. Test Verification Evidence

* **Integration Test Spec:** `tests/int/backupRestore.int.spec.ts`
* **Test Outcome:** **4/4 Tests Passed (100%)**.
