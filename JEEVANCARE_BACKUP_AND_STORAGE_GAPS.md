# JeevanCare — Backup & Storage Architecture Gap Report

**Audit Date:** November 2026
**Context:** Storage Architecture & Backup Systems Audit.

---

## 1. Storage Architecture Clarification

1. **Standalone Local Workstation Model (Baseline Product Design):**
   - Designed for local clinic PC installations where files reside on the attending doctor's PC under `private_media/`.
   - **Advantage:** Total data localization, zero cloud costs, full offline operation.
   - **Limitation:** Cross-workstation file sharing within the same clinic requires local network drive configuration.
2. **Centralized Multi-Doctor Cloud Model (Optional Cloud Adapter):**
   - Deployable to cloud environments (Vercel / AWS EC2), utilizing encrypted Amazon S3 / Cloudflare R2 storage buckets.
3. **Hybrid Model:**
   - Local workstation storage with encrypted background off-site cloud sync.

---

## 2. Implemented Features vs. Future Recommendations

| Area | Currently Implemented Feature | Future Recommendation |
| :--- | :--- | :--- |
| **Local Data Backup** | Full JSON collection serialization written to `backups/` with SHA-256 checksums. | Native `mongodump` BSON serialization with continuous oplog tailing. |
| **Media File Protection** | Private local directory (`private_media/`) isolated from public web URLs. | Compressed `.tar.gz` media file backups with AES-256 GCM encryption. |
| **Cloud Vault Sync** | S3-ready interface. | Automated 30-day off-site cloud storage sync. |
