# JeevanCare Bulk Excel / CSV Import Guide & Templates

Super admins and clinic owners can bulk import clinics and staff using CSV templates via the import API or admin tooling.

## 1. Clinic Import Template (`/api/export/template/clinics`)
CSV Headers:
`name,phone,city,state,currency`

Example Row:
```csv
"JeevanCare Delhi Clinic","+919811111111","New Delhi","Delhi","INR"
```

## 2. Staff / Doctor Import Template (`/api/export/template/staff`)
CSV Headers:
`name,email,password,role,phone,specialty,fee,regno`

Example Row:
```csv
"Dr. Ramesh Kumar","dr.ramesh@jeevancare.test","Test@123","doctor","+919822222222","General Medicine","500","SMC-99999"
```
*Note: `role` can be `doctor`, `receptionist`, or `owner`.*
