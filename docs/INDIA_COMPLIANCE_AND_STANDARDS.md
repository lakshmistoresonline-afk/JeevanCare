# India Compliance & Standards Reference

This document outlines the regulatory, clinical, and administrative standards applicable to outpatient clinics and healthcare staff in India, and details how **Matab** is designed to support compliance.

## 1. Regulatory Framework & Standards

| Requirement | Source / Authority | Applicable Scope | Current Status in Matab | Configuration / Review Required |
| :--- | :--- | :--- | :--- | :--- |
| **Clinical Establishments Act** | Ministry of Health & Family Welfare (MoHFW) / State Govts | All clinical establishments (clinics, hospitals, labs) | Supported via clinic profile, doctor credentials, and record retention. | State-specific rules and registration certificates must be configured by clinic admin. |
| **National Medical Commission (NMC) Regulations** | National Medical Commission (NMC) / State Medical Councils | Registered medical practitioners (RMPs) in India | Doctor profiles support NMC Registration Number, State Medical Council, and qualifications. | Doctors must enter their valid registration numbers and council details. |
| **Ayushman Bharat Digital Mission (ABDM)** | National Health Authority (NHA) | Digital health ecosystems across India | Data model includes optional ABHA number, ABHA address, and health-ID linking readiness fields. | Full ABDM sandbox/production integration requires official NHA client keys and API gateway connection. |
| **Prescription Guidelines** | NMC Guidelines / Indian Pharmacopoeia | Outpatient prescriptions issued by RMPs | Prescriptions support patient identity, doctor registration number, diagnosis, formulation, dosage, route, frequency (OD, BD, TDS), duration, and follow-up. | Clinics should review prescription templates against local state council guidelines. |
| **Data Privacy & IT Act** | Information Technology Act, 2000 & SPDI Rules / Digital Personal Data Protection (DPDP) Act, 2023 | Handling of electronic health records (EHR) and personal data | Tenant isolation, patient isolation, role-based access control, secure document delivery, and comprehensive audit trails. | Clinic management must establish patient consent workflows and privacy policies. |

## 2. Disclaimer
*Matab is designed to support Indian clinical and administrative workflows. Clinics remain solely responsible for ensuring compliance with applicable Central, State, and Municipal laws, including the Clinical Establishments (Registration and Regulation) Act, NMC guidelines, and the DPDP Act.*
