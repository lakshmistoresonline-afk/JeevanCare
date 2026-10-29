import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'
import { checkTestDatabaseSafety, validateE2EDatabaseUrl, getDatabaseNameFromUrl, APPROVED_TEST_DB_NAMES, PROHIBITED_DB_NAMES } from '@/lib/databaseSafety'

export { checkTestDatabaseSafety, validateE2EDatabaseUrl, getDatabaseNameFromUrl, APPROVED_TEST_DB_NAMES, PROHIBITED_DB_NAMES }

export type Fixture = Awaited<ReturnType<typeof seedFixture>>

let _payload: Payload | null = null

export async function getTestPayload(): Promise<Payload> {
  if (_payload) return _payload
  _payload = await getPayload({ config: await config })
  return _payload
}

// Delete children before parents so nothing dangles mid-wipe.
const COLLECTIONS = ['invoices', 'visits', 'appointments', 'patients', 'users', 'tenants'] as const

/** Wipe all data so each suite starts clean. */
export async function wipe(payload: Payload): Promise<void> {
  const safety = checkTestDatabaseSafety(process.env.DATABASE_URL, payload)
  if (!safety.ok) {
    throw new Error(`INTEGRATION TEST SAFETY GUARD BLOCK: ${safety.reason}`)
  }

  for (const collection of COLLECTIONS) {
    await payload.delete({ collection, where: {}, overrideAccess: true, disableTransaction: true })
  }
}

/**
 * Two isolated clinics + a super admin. Created with overrideAccess so the seed
 * itself isn't blocked; the tests then act *as* these users with access enforced.
 */
export async function seedFixture(payload: Payload) {
  await wipe(payload)

  const superAdmin = await payload.create({
    collection: 'users',
    data: {
      name: 'Super Admin',
      email: 'super@clinic.test',
      password: 'password123',
      role: 'superAdmin',
    },
    overrideAccess: true,
    disableTransaction: true,
  })

  const makeClinic = async (key: string, name: string) => {
    const tenant = await payload.create({
      collection: 'tenants',
      data: { name, phone: '03001234567', city: 'Testville', status: 'active', plan: 'plus' } as never,
      overrideAccess: true,
      disableTransaction: true,
    })
    const owner = await payload.create({
      collection: 'users',
      data: {
        name: `Owner ${key}`,
        email: `owner-${key}@clinic.test`,
        password: 'password123',
        role: 'owner',
        tenant: tenant.id,
      },
      overrideAccess: true,
      disableTransaction: true,
    })
    const doctor = await payload.create({
      collection: 'users',
      data: {
        name: `Doctor ${key}`,
        email: `doctor-${key}@clinic.test`,
        password: 'password123',
        role: 'doctor',
        tenant: tenant.id,
        specialty: 'General Medicine',
        qualification: 'MBBS, MD',
        medicalRegistrationNumber: `KMC-2026-${key}`,
        stateMedicalCouncil: 'Travancore Cochin Medical Council',
        consultationFee: 500,
        availabilityType: 'regular',
        availableDays: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],
        availableFrom: '09:00',
        availableTo: '17:00',
        active: true,
      },
      overrideAccess: true,
      disableTransaction: true,
    })
    const receptionist = await payload.create({
      collection: 'users',
      data: {
        name: `Receptionist ${key}`,
        email: `recept-${key}@clinic.test`,
        password: 'password123',
        role: 'receptionist',
        tenant: tenant.id,
      },
      overrideAccess: true,
      disableTransaction: true,
    })
    const patient = await payload.create({
      collection: 'patients',
      data: {
        tenant: tenant.id,
        name: `Patient ${key}`,
        phone: `0300000000${key}`,
        gender: 'female',
        ageYears: 30,
        mrn: `MRN-${key}`,
      },
      overrideAccess: true,
      disableTransaction: true,
    })
    return { tenant, owner, doctor, receptionist, patient }
  }

  const clinicA = await makeClinic('A', 'Clinic A')
  const clinicB = await makeClinic('B', 'Clinic B')

  return {
    superAdmin,
    a: clinicA,
    b: clinicB,
    clinicA,
    clinicB,
  }
}
