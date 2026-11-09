# JeevanCare — Windows Doctor PC Installation & Recovery Guide

**Document Date:** November 2026
**Target Workstation:** Windows 10 / 11 64-bit

---

## 1. Local Companion Agent Installation Steps

1. **Create Storage Directory:**
   Open PowerShell and execute:
   ```powershell
   New-Item -Path "$env:USERPROFILE\JeevanCare\MedicalDocuments" -ItemType Directory -Force
   ```
2. **Install Local Companion Service (`JeevanCareDocAgent.exe`):**
   - Run the installer with Administrator privileges.
   - The installer binds loopback API service to `127.0.0.1:9443` and configures automatic Windows startup.
3. **Verify Connection:**
   - Open JeevanCare web application in Google Chrome or Microsoft Edge.
   - The Doctor Workspace status badge will display **`Local Storage: Connected (C:\Users\...\JeevanCare\MedicalDocuments)`**.

---

## 2. Troubleshooting & Local Recovery

* **Agent Offline Warning:** If local agent is stopped, the application displays a non-blocking warning badge and falls back safely to private server storage.
* **Service Restart:** Run `net start JeevanCareDocAgent` in Windows Command Prompt as Administrator.
