# JeevanCare — Disaster Recovery Runbook

**Document Date:** November 2026
**Target RPO:** $\le$ 1 Hour | **Target RTO:** $\le$ 30 Minutes

---

## 1. Emergency Restoration Procedures

### Step 1: Verify Database Target Safety
Before executing any restore command, confirm the target connection URL is directed to an isolated database (`jeevancare_staging` or `jeevancare_test`). **NEVER target production `jeevancare`**.

### Step 2: Decrypt & Validate Archive Checksum
1. Verify the archive's SHA-256 checksum matches the manifest.
2. Supply the master backup key (`BACKUP_ENCRYPTION_KEY`).

### Step 3: Execute Restoration Command
Run the restore script:
```ts
import { runTenantRestore } from '@/lib/restore'

const result = await runTenantRestore({
  backupPath: './backups/jeevancare_backup_global_2026-11-09T12-00-00.json.enc',
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
  overrideDbUrl: process.env.STAGING_DATABASE_URL,
})

console.log('Restore Result:', result)
```

---

## 2. Post-Restoration Verification Checklist

1. Confirm collection counts match the backup manifest.
2. Verify patient MRNs and user logins.
3. Test front-desk appointment queue token display.
4. Verify doctor consultation records and Rx print formatting.
