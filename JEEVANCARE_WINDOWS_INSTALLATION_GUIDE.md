# JeevanCare — Windows Doctor PC Installation & Deployment Guide

**Document Date:** November 2026
**Target Operating System:** Windows 10 / 11 64-bit

---

## 1. Doctor PC Local Companion Service Setup

1. **Storage Directory Creation:**
   Open Windows PowerShell as Administrator and run:
   ```powershell
   New-Item -Path "$env:USERPROFILE\JeevanCare\MedicalDocuments" -ItemType Directory -Force
   ```
2. **Install Companion Service (`desktop/doctor-agent`):**
   - Execute installer or run `node desktop/doctor-agent/index.js`.
   - The service binds loopback API to `127.0.0.1:9443` and configures automatic Windows startup.
3. **Verification:**
   - Launch JeevanCare web application in Google Chrome or Microsoft Edge.
   - Doctor workspace will show **`Local Storage: Connected (C:\Users\...\JeevanCare\MedicalDocuments)`**.
