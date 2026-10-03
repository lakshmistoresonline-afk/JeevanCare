# JeevanCare Thrissur City UAT Dataset & Import Guide

This document provides the complete, ready-to-import CSV dataset for **Thrissur City** private clinics and specialist doctors, formatted specifically for direct upload into the JeevanCare bulk import APIs (`/api/import/clinics` and `/api/import/staff`).

---

## 1. Clinics Dataset (`docs/Thrissur_City_Clinics_Bulk_Import.csv`)
Upload this file via `POST /api/import/clinics` to register primary medical facilities across Thrissur City (Swaraj Round, Mission Quarters, Ayyanthole, Chembukkavu, East Fort, West Fort, Punkunnam, Ollur, Mannuthy, Koorkanchery).

```csv
name,phone,city,state,currency
"Swaraj Medical Centre","+919847011111","Thrissur","Kerala","INR"
"Mission Quarters Health Clinic","+919847022222","Thrissur","Kerala","INR"
"Ayyanthole Family Practice","+919847033333","Thrissur","Kerala","INR"
"Chembukkavu Specialist Chambers","+919847044444","Thrissur","Kerala","INR"
"East Fort Outpatient Centre","+919847055555","Thrissur","Kerala","INR"
"West Fort Multispeciality Clinic","+919847066666","Thrissur","Kerala","INR"
"Punkunnam Medical Centre","+919847077777","Thrissur","Kerala","INR"
"Ollur Urban Health Hub","+919847088888","Thrissur","Kerala","INR"
"Mannuthy Care Clinic","+919847099999","Thrissur","Kerala","INR"
"Koorkanchery Outpatient Unit","+919847012121","Thrissur","Kerala","INR"
```

---

## 2. Doctors Dataset (`docs/Thrissur_City_Doctors_Bulk_Import.csv`)
Upload this file via `POST /api/import/staff` to register specialist doctors with Travancore-Cochin Medical Council / State Medical Council registration numbers and ₹ consultation fees.

```csv
name,email,password,role,phone,specialty,fee,regno
"Dr. Unni Krishnan","dr.unni@jeevancare.test","Test@123","doctor","+919847111111","General Medicine","500","KMC-2026-101"
"Dr. Anitha Warrier","dr.anitha@jeevancare.test","Test@123","doctor","+919847222222","Pediatrics","600","KMC-2026-102"
"Dr. Suresh Menon","dr.suresh@jeevancare.test","Test@123","doctor","+919847333333","Orthopedics","700","KMC-2026-103"
"Dr. Radhika Nair","dr.radhika@jeevancare.test","Test@123","doctor","+919847444444","Gynecology","800","KMC-2026-104"
"Dr. Varghese Paul","dr.varghese@jeevancare.test","Test@123","doctor","+919847555555","Cardiology","1000","KMC-2026-105"
```
