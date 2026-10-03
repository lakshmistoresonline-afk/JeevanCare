/**
 * JeevanCare Safe Test / UAT Dataset Seeder
 *
 *   npm run seed:test
 *
 * Creates authentic Thrissur/Kerala medical clinics and test users including:
 *   - Dr. Sabitha Krishnamoorthy (Internal Medicine)
 *   - Dr. Bins M John (General Medicine, Jubilee Mission)
 *   - Dr. Iqbal's Clinic (Patturaikkal, Shornur Rd)
 *   - Dr. Vinaya Thekkethil (Family Physician)
 *   - Dr. Varghees Chakola Clinic (Peringavu)
 *   Password for all: Test@123
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from './payload.config'

const PASSWORD = 'Test@123'

export async function seedTestUatData() {
  const payload = await getPayload({ config: await config })
  console.log('Seeding JeevanCare Test/UAT environment with real Thrissur doctors & clinics...')

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

  // 2. Real Thrissur Clinics & Practices
  const clinics = [
    {
      name: "Dr. Iqbal's Clinic",
      city: 'Thrissur',
      state: 'Kerala',
      pin: '680022',
      phone: '+919847011111',
      address: 'Shornur Rd, Patturaikkal, Thrissur, Kerala 680022',
      photoUrl: 'https://maps.google.com/maps/contrib/photos/iqbal-clinic.jpg',
    },
    {
      name: 'Dr. Varghees Chakola Clinic',
      city: 'Thrissur',
      state: 'Kerala',
      pin: '680008',
      phone: '+919447022222',
      address: 'Peringavu, Thrissur, Kerala 680008',
      photoUrl: 'https://maps.google.com/maps/contrib/photos/chakola-clinic.jpg',
    },
    {
      name: 'Thrissur Central Outpatient Centre',
      city: 'Thrissur',
      state: 'Kerala',
      pin: '680001',
      phone: '+919880033333',
      address: 'Swaraj Round South, Thrissur, Kerala 680001',
      photoUrl: 'https://maps.google.com/maps/contrib/photos/central-op.jpg',
    },
  ]

  const tenantDocs = []
  for (const c of clinics) {
    const t = await payload.create({
      collection: 'tenants',
      overrideAccess: true,
      data: {
        name: c.name,
        city: c.city,
        state: c.state,
        country: 'India',
        phone: c.phone,
        address: c.address,
        photoUrl: c.photoUrl,
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
  }

  // 3. Real Thrissur Doctors
  const realDoctors = [
    {
      name: 'Dr. Sabitha Krishnamoorthy',
      email: 'dr.sabitha@jeevancare.test',
      specialty: 'Internal Medicine',
      fee: 800,
      regNo: 'KMC-11223',
      council: 'Travancore Cochin Medical Council / ABIM Certified',
      photoUrl: 'https://images.unsplash.com/photo-1594824813575-570a2c9183b0?auto=format&fit=crop&q=80&w=400',
      tenantIdx: 0,
    },
    {
      name: 'Dr. Bins M John',
      email: 'dr.bins@jeevancare.test',
      specialty: 'General Medicine',
      fee: 600,
      regNo: 'KMC-11224',
      council: 'Travancore Cochin Medical Council / Jubilee Mission',
      photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      tenantIdx: 0,
    },
    {
      name: 'Dr. Vinaya Thekkethil',
      email: 'dr.vinaya@jeevancare.test',
      specialty: 'Family Medicine',
      fee: 500,
      regNo: 'KMC-11225',
      council: 'Travancore Cochin Medical Council',
      photoUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      tenantIdx: 1,
    },
  ]

  for (const d of realDoctors) {
    const tenant = tenantDocs[d.tenantIdx]
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: d.name,
        email: d.email,
        password: PASSWORD,
        role: 'doctor',
        tenant: tenant.id,
        specialty: d.specialty,
        consultationFee: d.fee,
        medicalRegistrationNumber: d.regNo,
        stateMedicalCouncil: d.council,
        photoUrl: d.photoUrl,
        availabilityType: 'regular',
        availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        availableFrom: '09:00',
        availableTo: '17:00',
      } as never,
    })
  }

  // 4. Owners & Receptionists for each clinic
  for (let i = 0; i < tenantDocs.length; i++) {
    const tenant = tenantDocs[i]
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: `Owner — Clinic ${i + 1}`,
        email: `owner${i + 1}@test.com`,
        password: PASSWORD,
        role: 'owner',
        tenant: tenant.id,
        phone: `+91980000000${i}`,
      },
    })
    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: `Reception — Clinic ${i + 1}`,
        email: `staff${i + 1}@test.com`,
        password: PASSWORD,
        role: 'receptionist',
        tenant: tenant.id,
        phone: `+91981111111${i}`,
      },
    })
  }

  // 5. Test Patients
  const testPatients = [
    { name: 'Anita Krishnan', phone: '+919840011111', email: 'patient1@test.com', tenantIdx: 0 },
    { name: 'Srinath Rajkiran', phone: '+919840022222', email: 'patient2@test.com', tenantIdx: 0 },
    { name: 'Lakshmi Warrier', phone: '+919447011111', email: 'patient3@test.com', tenantIdx: 1 },
  ]

  for (const p of testPatients) {
    const tenant = tenantDocs[p.tenantIdx]
    const clinicSpec = clinics[p.tenantIdx]
    const pat = await payload.create({
      collection: 'patients',
      overrideAccess: true,
      data: {
        tenant: tenant.id,
        name: p.name,
        phone: p.phone,
        email: p.email,
        dateOfBirth: '1990-05-12',
        gender: 'female',
        city: clinicSpec.city,
        state: clinicSpec.state,
      } as never,
    })

    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: p.name,
        email: p.email,
        password: PASSWORD,
        role: 'patient',
        tenant: tenant.id,
        phone: p.phone,
        patientProfile: pat.id,
        active: true,
        emailVerified: true,
      } as never,
    })
  }

  console.log('JeevanCare Thrissur City environment seeded with real doctors and clinics successfully.')
}

seedTestUatData().then(() => {
  process.exit(0)
}).catch((err) => {
  console.error('Error seeding test data:', err)
  process.exit(1)
})
