# JeevanCare Complete UAT Test Dataset Summary (Thrissur City, Kerala)

- **Clinics (Tenants)**: 10 active healthcare facilities across Thrissur City (Swaraj Medical Centre, Mission Quarters Health Clinic, Ayyanthole Family Practice, Chembukkavu Specialist Chambers, East Fort Outpatient Centre, West Fort Multispeciality Clinic, Punkunnam Medical Centre, Ollur Urban Health Hub, Mannuthy Care Clinic, Koorkanchery Outpatient Unit).
- **Platform Super Admin**: 1 (`admin@test.com`)
- **Clinic Owners**: 10 (`owner1@test.com` to `owner10@test.com`)
- **Receptionists**: 10 (`staff1@test.com` to `staff10@test.com`)
- **Specialist Doctors**: 7 (`doctor1@test.com` to `doctor5@test.com`, `dr.unni@test.com`, `dr.anitha@test.com`)
- **Test Patients**: 10 (`patient1@test.com` to `patient10@test.com`)
- **Idempotency**: 100% Idempotent (`npm run seed:test` can be run consecutively without creating duplicate record pollution).
- **Currency Defaults**: INR (₹)
- **Timezone Defaults**: Asia/Kolkata (IST, UTC+5:30)
