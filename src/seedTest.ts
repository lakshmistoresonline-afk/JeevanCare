/**
 * JeevanCare Safe Test / UAT Dataset Seeder
 *
 *   npm run seed:test
 *
 * Creates all 10 Thrissur City clinics and specialist doctors including:
 *   - Dr. Sabitha Krishnamoorthy (Internal Medicine)
 *   - Dr. Bins M John (General Medicine)
 *   - Dr. Vinaya Thekkethil (Family Medicine)
 *   - Dr. Iqbal (General Practice)
 *   - Dr. Varghees Chakola (General Medicine)
 *   Password for all: Test@123
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from './payload.config'

const PASSWORD = 'Test@123'

export async function seedTestUatData() {
  const payload = await getPayload({ config: await config })
  console.log('Seeding JeevanCare Test/UAT environment with full Thrissur City dataset & Google-verified doctors...')

  for (const col of ['invoices', 'visits', 'appointments', 'patients', 'users', 'tenants'] as const) {
    await payload.delete({ collection: col, where: {}, overrideAccess: true })
  }

  // 1. Super Admin
  await payload.create({
    collection: 'users',
    overrideAccess: true,
    data: {
      name: 'Super Admin JeevanCare',
      email: 'admin@test.com',
      password: PASSWORD,
      role: 'superAdmin',
    },
  })

  // 2. All 10 Thrissur City Clinics
  const clinics = [
    { name: 'Swaraj Medical Centre', phone: '+919847011111', city: 'Thrissur', state: 'Kerala', pin: '680001' },
    { name: 'Mission Quarters Health Clinic', phone: '+919847022222', city: 'Thrissur', state: 'Kerala', pin: '680001' },
    { name: 'Ayyanthole Family Practice', phone: '+919847033333', city: 'Thrissur', state: 'Kerala', pin: '680003' },
    { name: 'Chembukkavu Specialist Chambers', phone: '+919847044444', city: 'Thrissur', state: 'Kerala', pin: '680020' },
    { name: 'East Fort Outpatient Centre', phone: '+919847055555', city: 'Thrissur', state: 'Kerala', pin: '680005' },
    { name: 'West Fort Multispeciality Clinic', phone: '+919847066666', city: 'Thrissur', state: 'Kerala', pin: '680004' },
    { name: 'Punkunnam Medical Centre', phone: '+919847077777', city: 'Thrissur', state: 'Kerala', pin: '680002' },
    { name: 'Ollur Urban Health Hub', phone: '+919847088888', city: 'Thrissur', state: 'Kerala', pin: '680306' },
    { name: 'Mannuthy Care Clinic', phone: '+919847099999', city: 'Thrissur', state: 'Kerala', pin: '680651' },
    { name: 'Koorkanchery Outpatient Unit', phone: '+919847012121', city: 'Thrissur', state: 'Kerala', pin: '680007' },
  ]

  const tenantDocs = []
  for (const c of clinics) {
    const t = await payload.create({
      collection: 'tenants',
      overrideAccess: true,
      data: {
        name: c.name,
        city: c.city,
        district: 'Thrissur',
        state: c.state,
        country: 'India',
        phone: c.phone,
        status: 'active',
        plan: 'plus',
        settings: {
          currency: 'INR',
          timezone: 'Asia/Kolkata',
          appointmentDurationMins: 15,
          openTime: '09:00',
          closeTime: '17:00',
        },
      } as never,
    })
    tenantDocs.push(t)

    // Owner for each clinic
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: `Owner — ${c.name}`,
        email: `owner.${c.name.toLowerCase().replace(/[^a-z]/g, '')}@test.com`,
        password: PASSWORD,
        role: 'owner',
        tenant: t.id,
        phone: c.phone,
      },
    })

    // Receptionist for each clinic
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: `Reception — ${c.name}`,
        email: `staff.${c.name.toLowerCase().replace(/[^a-z]/g, '')}@test.com`,
        password: PASSWORD,
        role: 'receptionist',
        tenant: t.id,
        phone: c.phone,
      },
    })
  }

  // 3. Specialist Doctors (Including Google-Verified Thrissur Doctors)
  const doctorsData = [
    { name: 'Dr. Sabitha Krishnamoorthy', email: 'dr.sabitha@jeevancare.test', specialty: 'Internal Medicine', fee: 800, regno: 'KMC-11223' },
    { name: 'Dr. Bins M John', email: 'dr.bins@jeevancare.test', specialty: 'General Medicine', fee: 600, regno: 'KMC-11224' },
    { name: 'Dr. Vinaya Thekkethil', email: 'dr.vinaya@jeevancare.test', specialty: 'Family Medicine', fee: 500, regno: 'KMC-11225' },
    { name: 'Dr. Iqbal', email: 'dr.iqbal@jeevancare.test', specialty: 'General Practice', fee: 500, regno: 'KMC-11226' },
    { name: 'Dr. Varghees Chakola', email: 'dr.varghees@jeevancare.test', specialty: 'General Medicine', fee: 600, regno: 'KMC-11227' },
    { name: 'Dr. Unni Krishnan', email: 'dr.unni@test.com', specialty: 'General Medicine', fee: 500, regno: 'KMC-2026-101' },
    { name: 'Dr. Anitha Warrier', email: 'dr.anitha@test.com', specialty: 'Pediatrics', fee: 600, regno: 'KMC-2026-102' },
    { name: 'Dr. Suresh Menon', email: 'dr.suresh@test.com', specialty: 'Orthopedics', fee: 700, regno: 'KMC-2026-103' },
    { name: 'Dr. Radhika Nair', email: 'dr.radhika@test.com', specialty: 'Gynecology', fee: 800, regno: 'KMC-2026-104' },
    { name: 'Dr. Varghese Paul', email: 'dr.varghese@test.com', specialty: 'Cardiology', fee: 1000, regno: 'KMC-2026-105' },
    { name: 'Dr. Fathima Beevi', email: 'dr.fathima@test.com', specialty: 'Dermatology', fee: 600, regno: 'KMC-2026-106' },
    { name: 'Dr. Manoj Kumar', email: 'dr.manoj@test.com', specialty: 'ENT (Otorhinolaryngology)', fee: 500, regno: 'KMC-2026-107' },
    { name: 'Dr. Deepa Sreedhar', email: 'dr.deepa@test.com', specialty: 'Ophthalmology', fee: 600, regno: 'KMC-2026-108' },
    { name: 'Dr. George Mathew', email: 'dr.george@test.com', specialty: 'Neurology', fee: 1200, regno: 'KMC-2026-109' },
    { name: 'Dr. Smitha Nambiar', email: 'dr.smitha@test.com', specialty: 'Gastroenterology', fee: 900, regno: 'KMC-2026-110' },
    { name: 'Dr. Biju Thomas', email: 'dr.biju@test.com', specialty: 'Pulmonology & Chest Medicine', fee: 750, regno: 'KMC-2026-111' },
    { name: 'Dr. Revathy Mohan', email: 'dr.revathy@test.com', specialty: 'Nephrology', fee: 1000, regno: 'KMC-2026-112' },
    { name: 'Dr. K. P. Namboodiri', email: 'dr.namboodiri@test.com', specialty: 'Urology', fee: 900, regno: 'KMC-2026-113' },
    { name: 'Dr. Elizabeth Chacko', email: 'dr.elizabeth@test.com', specialty: 'Psychiatry', fee: 700, regno: 'KMC-2026-114' },
    { name: 'Dr. Haridas Panicker', email: 'dr.haridas@test.com', specialty: 'Ayurveda / Ayush', fee: 400, regno: 'KMC-2026-115' },
    { name: 'Dr. Shabana Banu', email: 'dr.shabana@test.com', specialty: 'Dentistry & Maxillofacial', fee: 500, regno: 'KMC-2026-116' },
    { name: 'Dr. Ramesan Pillai', email: 'dr.ramesan@test.com', specialty: 'General Surgery', fee: 800, regno: 'KMC-2026-117' },
    { name: 'Dr. Jayanthi Raman', email: 'dr.jayanthi@test.com', specialty: 'Diabetology & Endocrinology', fee: 700, regno: 'KMC-2026-118' },
    { name: 'Dr. Mohan Chandran', email: 'dr.mohan@test.com', specialty: 'Physiotherapy & Rehabilitation', fee: 400, regno: 'KMC-2026-119' },
    { name: 'Dr. Sheela Cherian', email: 'dr.sheela@test.com', specialty: 'Internal Medicine', fee: 600, regno: 'KMC-2026-120' },
  ]

  for (let i = 0; i < doctorsData.length; i++) {
    const doc = doctorsData[i]
    const tenant = tenantDocs[i % tenantDocs.length]
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: doc.name,
        email: doc.email,
        password: PASSWORD,
        role: 'doctor',
        tenant: tenant.id,
        specialty: doc.specialty,
        consultationFee: doc.fee,
        medicalRegistrationNumber: doc.regno,
        stateMedicalCouncil: 'Travancore Cochin Medical Council',
        availabilityType: 'regular',
        availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        availableFrom: '09:00',
        availableTo: '17:00',
      } as never,
    })
  }

  // 4. Test Patients & Portal Accounts
  for (let i = 1; i <= 10; i++) {
    const clinicSpec = clinics[(i - 1) % clinics.length]
    const tenant = tenantDocs[(i - 1) % clinics.length]
    const pat = await payload.create({
      collection: 'patients',
      overrideAccess: true,
      data: {
        tenant: tenant.id,
        name: `Thrissur Patient ${i}`,
        phone: `+91984755500${i}`,
        email: `patient${i}@test.com`,
        dateOfBirth: '1990-01-01',
        gender: i % 2 === 0 ? 'female' : 'male',
        city: clinicSpec.city,
        state: clinicSpec.state,
      } as never,
    })

    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: `Thrissur Patient ${i}`,
        email: `patient${i}@test.com`,
        password: PASSWORD,
        role: 'patient',
        tenant: tenant.id,
        phone: `+91984755500${i}`,
        patientProfile: pat.id,
        active: true,
        emailVerified: true,
      } as never,
    })
  }

  console.log('JeevanCare Thrissur City UAT environment seeded successfully with verified doctors.')
}

seedTestUatData().then(() => {
  process.exit(0)
}).catch((err) => {
  console.error('Error seeding test data:', err)
  process.exit(1)
})
