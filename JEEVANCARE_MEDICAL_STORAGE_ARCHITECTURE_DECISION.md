# JeevanCare — Medical Storage Architecture Decision Report

**Audit Date:** November 2026
**Context:** Evaluation of local PC workstation storage vs. cloud hosting options for medical files.

---

## 1. Architectural Options Overview

### Option A: Standalone Local Workstation Installation (Product Baseline)
* **Architecture:** JeevanCare runs locally on each clinic's workstation PC. Uploaded medical documents (PDFs, scans, X-Rays) are stored on the local PC filesystem under `private_media/`.
* **Advantages:** Complete data localization, zero cloud bandwidth costs, full offline operational capability.
* **Limitations:** Backups are tied to local disk health; multiple PC workstations within the same clinic cannot share uploaded scans without local network drive sharing.
* **Backup Requirements:** Automated daily script to mirror `private_media/` to an external encrypted USB drive or local NAS.

---

### Option B: Centralized Multi-Doctor Cloud Hosting
* **Architecture:** JeevanCare is deployed on cloud infrastructure (e.g. Vercel / AWS EC2), storing medical documents in an encrypted private S3 / Cloudflare R2 bucket with `privateRead` ACLs.
* **Advantages:** Accessible across multiple PCs and mobile devices, automated cloud snapshot backups, high availability.
* **Limitations:** Requires continuous Internet connectivity; monthly S3 storage & bandwidth costs.

---

### Option C: Hybrid Local-Cloud Synchronized Storage
* **Architecture:** Primary document storage resides on the local clinic workstation (`private_media/`), with an automated background worker syncing encrypted backups to a private S3 cloud vault.
* **Advantages:** Fast local access with off-site disaster recovery protection.

---

## 2. Decision & Recommendation Status

* **Current Status:** Option A (Private Local Directory `private_media/`) is implemented as the product baseline, ensuring that direct public static URLs cannot access medical files while respecting the local workstation architecture.
* **Recommendation:** Submit this Architecture Decision Report to the clinic owner for formal approval before deciding whether to enable Option B (Cloud S3 Adapter) for multi-branch clinics.
