/**
 * JeevanCare Safe Test / UAT Dataset Seeder
 *
 * Command:
 *   npm run seed:test
 *
 * Deterministic, idempotent seeding script populating 10 Thrissur City clinics
 * and explicit UAT test scenarios across multiple tenant contexts:
 *   - Admin: admin@test.com
 *   - Owners: owner1@test.com to owner10@test.com
 *   - Staff: staff1@test.com to staff10@test.com
 *   - Doctors: doctor1@test.com to doctor5@test.com (plus other specialists)
 *   - Patients: patient1@test.com to patient10@test.com
 *   Password for all test accounts: Test@123
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from './payload.config'
import crypto from 'crypto'

const PASSWORD = 'Test@123'
const NO_TX = { req: { transactionID: null, overrideAccess: true } as any }

async function safeCreate(payload: any, options: any) {
  let retries = 5
  while (retries > 0) {
    try {
      return await payload.create(options)
    } catch (err: any) {
      if (
        err?.errorLabelSet?.has('TransientTransactionError') ||
        err?.codeName === 'WriteConflict' ||
        err?.code === 112 ||
        err?.code === 251
      ) {
        retries--
        await new Promise((resolve) => setTimeout(resolve, 150))
      } else {
        console.error('safeCreate error details:', JSON.stringify(err?.data?.errors || err, null, 2))
        throw err
      }
    }
  }
  return await payload.create(options)
}

export async function seedTestUatData() {
  const payload = await getPayload({ config: await config })
  console.log('Seeding JeevanCare Test/UAT environment with explicit test accounts (owner1@test.com, staff1@test.com, doctor1@test.com)...')

  const db = (payload.db as any).connection?.db
  async function nativeInsert(colName: string, docData: any) {
    const now = new Date()
    if (!docData.createdAt) docData.createdAt = now
    if (!docData.updatedAt) docData.updatedAt = now
    if (db) {
      const res = await db.collection(colName).insertOne(docData)
      return { ...docData, id: String(res.insertedId) }
    }
    return await safeCreate(payload, { collection: colName, overrideAccess: true, ...NO_TX, data: docData })
  }

  // Clear ALL existing collections natively via MongoDB driver
  const colsToWipe = ['invoices', 'visits', 'appointments', 'medical-documents', 'patients', 'users', 'tenants', 'payload-preferences', 'payload-migrations']
  for (const col of colsToWipe) {
    try {
      if (db) {
        await db.collection(col).deleteMany({})
      }
      const model = (payload.db as any).collections?.[col]
      if (model?.collection?.deleteMany) {
        await model.collection.deleteMany({})
      }
    } catch {
      // Ignore
    }
  }

  // 1. Super Admin
  const adminUser = await safeCreate(payload, {
    collection: 'users',
    overrideAccess: true,
    ...NO_TX,
    data: {
      name: 'Super Admin JeevanCare',
      email: 'admin@test.com',
      password: PASSWORD,
      role: 'superAdmin',
    },
  })

  const adminCtx = { user: adminUser, overrideAccess: true, req: { user: adminUser, transactionID: null, overrideAccess: true } as any }

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
  const ownerDocs = []
  const staffDocs = []

  for (let i = 0; i < clinics.length; i++) {
    const c = clinics[i]
    const t = await safeCreate(payload, {
      collection: 'tenants',
      ...adminCtx,
      data: {
        name: c.name,
        city: c.city,
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

    // Explicit Owner (owner1@test.com to owner10@test.com)
    const owner = await safeCreate(payload, {
      collection: 'users',
      ...adminCtx,
      data: {
        name: `Owner — ${c.name}`,
        email: `owner${i + 1}@test.com`,
        password: PASSWORD,
        role: 'owner',
        tenant: t.id,
        phone: c.phone,
      },
    })
    ownerDocs.push(owner)

    // Explicit Receptionist (staff1@test.com to staff10@test.com)
    const staff = await safeCreate(payload, {
      collection: 'users',
      ...adminCtx,
      data: {
        name: `Reception — ${c.name}`,
        email: `staff${i + 1}@test.com`,
        password: PASSWORD,
        role: 'receptionist',
        tenant: t.id,
        phone: c.phone,
      },
    })
    staffDocs.push(staff)
  }

  // 3. Specialist Doctors
  const doctorsData = [
    { name: 'Dr. Sabitha Krishnamoorthy', email: 'doctor1@test.com', specialty: 'Internal Medicine', fee: 800, regno: 'KMC-11223' },
    { name: 'Dr. Bins M John', email: 'doctor2@test.com', specialty: 'General Medicine', fee: 600, regno: 'KMC-11224' },
    { name: 'Dr. Vinaya Thekkethil', email: 'doctor3@test.com', specialty: 'Family Medicine', fee: 500, regno: 'KMC-11225' },
    { name: 'Dr. Iqbal', email: 'doctor4@test.com', specialty: 'General Practice', fee: 500, regno: 'KMC-11226' },
    { name: 'Dr. Varghees Chakola', email: 'doctor5@test.com', specialty: 'General Medicine', fee: 600, regno: 'KMC-11227' },
    { name: 'Dr. Unni Krishnan', email: 'dr.unni@test.com', specialty: 'General Medicine', fee: 500, regno: 'KMC-2026-101' },
    { name: 'Dr. Anitha Warrier', email: 'dr.anitha@test.com', specialty: 'Pediatrics', fee: 600, regno: 'KMC-2026-102' },
  ]

  const doctorDocs = []
  for (let i = 0; i < doctorsData.length; i++) {
    const doc = doctorsData[i]
    const tenant = tenantDocs[i % tenantDocs.length]
    const doctor = await safeCreate(payload, {
      collection: 'users',
      ...adminCtx,
      data: {
        name: doc.name,
        email: doc.email,
        password: PASSWORD,
        role: 'doctor',
        tenant: tenant.id,
        specialty: doc.specialty,
        qualification: 'MBBS, MD',
        medicalRegistrationNumber: doc.regno,
        stateMedicalCouncil: 'Travancore Cochin Medical Council',
        consultationFee: doc.fee,
        availabilityType: 'regular',
        availableDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        availableFrom: '09:00',
        availableTo: '17:00',
      } as never,
    })
    doctorDocs.push(doctor)
  }

  // 4. Test Patients & Portal Accounts (patient1@test.com to patient10@test.com)
  const patientDocs = []
  const patientUserDocs = []

  for (let i = 1; i <= 10; i++) {
    const clinicSpec = clinics[(i - 1) % clinics.length]
    const tenant = tenantDocs[(i - 1) % clinics.length]
    const pat = await safeCreate(payload, {
      collection: 'patients',
      ...adminCtx,
      data: {
        tenant: tenant.id,
        name: `Thrissur Patient ${i}`,
        phone: `+91984755500${i}`,
        email: `patient${i}@test.com`,
        dateOfBirth: '1990-01-01',
        gender: i % 2 === 0 ? 'female' : 'male',
        addressLine: 'Swaraj Round West',
        city: clinicSpec.city,
        state: clinicSpec.state,
        pinCode: clinicSpec.pin,
      } as never,
    })
    patientDocs.push(pat)

    const userPat = await safeCreate(payload, {
      collection: 'users',
      ...adminCtx,
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
    patientUserDocs.push(userPat)
  }

  // 5. Explicit UAT Scenarios

  // SCENARIO A: Patient 1 — PATIENT WITH HISTORY & PAID BILL
  const appt1 = await nativeInsert('appointments', {
    tenant: tenantDocs[0].id,
    patient: patientDocs[0].id,
    doctor: doctorDocs[0].id,
    start: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    durationMins: 15,
    status: 'completed',
    reason: 'Fever and cold',
  })

  const visit1 = await nativeInsert('visits', {
    tenant: tenantDocs[0].id,
    patient: patientDocs[0].id,
    doctor: doctorDocs[0].id,
    appointment: appt1.id,
    visitDate: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    symptoms: 'High fever, headache, body ache',
    diagnosis: 'Acute Viral Fever',
    vitals: {
      bpSystolic: 120,
      bpDiastolic: 80,
      temperatureC: 38.5,
      weightKg: 68,
      pulse: 84,
    },
    prescription: [
      { medicine: 'Paracetamol 650mg', dosage: '1 tablet', frequency: 'bd', durationDays: 5, instructions: 'After food' },
      { medicine: 'Vitamin C 500mg', dosage: '1 tablet', frequency: 'od', durationDays: 10, instructions: 'Morning' },
    ],
    followUpDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
  })

  await nativeInsert('invoices', {
    tenant: tenantDocs[0].id,
    patient: patientDocs[0].id,
    visit: visit1.id,
    invoiceNumber: 'INV-0001',
    currency: 'INR',
    lineItems: [
      { description: 'Consultation Fee — Dr. Sabitha', quantity: 1, unitAmount: 800, amount: 800 },
      { description: 'CBC Lab Test', quantity: 1, unitAmount: 300, amount: 300 },
    ],
    totalAmount: 1100,
    amountPaid: 1100,
    balanceDue: 0,
    paymentStatus: 'paid',
    payments: [
      { amount: 1100, method: 'cash', receivedAt: new Date().toISOString() },
    ],
    voided: false,
  })

  // SCENARIO B: Patient 2 — PATIENT WITH DOCUMENTS & UNPAID BILL
  const appt2 = await nativeInsert('appointments', {
    tenant: tenantDocs[1].id,
    patient: patientDocs[1].id,
    doctor: doctorDocs[1].id,
    start: new Date().toISOString(),
    durationMins: 15,
    status: 'checked-in',
    isWalkIn: true,
    tokenNumber: 'T-01',
    reason: 'Routine Health Review',
  })

  const dummyPdf = Buffer.from(
    '%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000015 00000 n\n0000000068 00000 n\n0000000125 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF',
  )
  await nativeInsert('medical-documents', {
    tenant: tenantDocs[1].id,
    patient: patientDocs[1].id,
    doctor: doctorDocs[1].id,
    appointment: appt2.id,
    title: 'Complete Blood Count (CBC) Report',
    documentType: 'LAB_REPORT',
    documentDate: new Date().toISOString(),
    status: 'active',
    filename: 'blood_report.pdf',
    checksum: crypto.createHash('sha256').update(dummyPdf).digest('hex'),
  })

  await nativeInsert('invoices', {
    tenant: tenantDocs[1].id,
    patient: patientDocs[1].id,
    invoiceNumber: 'INV-0002',
    currency: 'INR',
    lineItems: [
      { description: 'Consultation Fee — Dr. Bins', quantity: 1, unitAmount: 600, amount: 600 },
    ],
    totalAmount: 600,
    amountPaid: 0,
    balanceDue: 600,
    paymentStatus: 'unpaid',
    payments: [],
    voided: false,
  })

  // SCENARIO C: Patient 4 — CANCELLED & NO-SHOW APPOINTMENTS
  await nativeInsert('appointments', {
    tenant: tenantDocs[3].id,
    patient: patientDocs[3].id,
    doctor: doctorDocs[3].id,
    start: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    durationMins: 15,
    status: 'cancelled',
    cancellationReason: 'Patient called to cancel due to travel',
  })

  await nativeInsert('appointments', {
    tenant: tenantDocs[3].id,
    patient: patientDocs[3].id,
    doctor: doctorDocs[3].id,
    start: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    durationMins: 15,
    status: 'no-show',
  })

  // SCENARIO D: Patient 5 — NEW SCHEDULED PATIENT (FUTURE SLOT)
  await nativeInsert('appointments', {
    tenant: tenantDocs[4].id,
    patient: patientDocs[4].id,
    doctor: doctorDocs[4].id,
    start: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    durationMins: 15,
    status: 'scheduled',
    reason: 'General Checkup',
  })

  console.log('JeevanCare Thrissur City UAT environment seeded successfully with all explicit patient scenarios (owner1@test.com, staff1@test.com, doctor1@test.com, patient1@test.com).')
}

if (process.argv[1]?.includes('seedTest')) {
  seedTestUatData().then(() => {
    process.exit(0)
  }).catch((err) => {
    console.error('Error seeding test data:', err)
    process.exit(1)
  })
}
