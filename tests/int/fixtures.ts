import { getPayload, type Payload } from 'payload'
import config from '@/payload.config'

export type Fixture = Awaited<ReturnType<typeof seedFixture>>

let _payload: Payload | null = null

export async function getTestPayload(): Promise<Payload> {
  if (_payload) return _payload
  _payload = await getPayload({ config: await config })
  return _payload
}

// Delete children before parents so nothing dangles mid-wipe.
const COLLECTIONS = ['invoices', 'visits', 'appointments', 'patients', 'users', 'tenants'] as const

/** Approved dedicated test database names */
const APPROVED_TEST_DB_NAMES = ['jeevancare_test', 'jeevancare-test', 'jeevancare_test_db'] as const

/** Prohibited production/UAT database names */
const PROHIBITED_DB_NAMES = ['jeevancare', 'production', 'prod', 'jeevancare_prod', 'jeevancare_uat'] as const

/** Parse database name from MongoDB connection string */
export function getDatabaseNameFromUrl(urlStr: string): string | null {
  if (!urlStr || typeof urlStr !== 'string') return null
  try {
    const cleanUrl = urlStr.trim()
    const match = cleanUrl.match(/mongodb(?:\+srv)?:\/\/[^\/]+\/([^?#]+)/i)
    if (match && match[1]) {
      return match[1].toLowerCase()
    }
  } catch (_) {}
  return null
}

/**
 * Validates database URL for E2E browser testing.
 * Fails closed if rawUrl is empty, unparseable, or targets any protected/unapproved database.
 */
export function validateE2EDatabaseUrl(rawUrl?: string): string {
  const urlToTest = rawUrl ?? process.env.DATABASE_URL ?? ''
  const DEFAULT_E2E_TEST_URL = 'mongodb://127.0.0.1:27017/jeevancare_test?replicaSet=rs0'

  if (!urlToTest) {
    return DEFAULT_E2E_TEST_URL
  }

  const dbName = getDatabaseNameFromUrl(urlToTest)
  if (!dbName) {
    throw new Error('PLAYWRIGHT E2E SAFETY BLOCK: Could not parse database name from DATABASE_URL.')
  }

  if (PROHIBITED_DB_NAMES.includes(dbName as any) || !APPROVED_TEST_DB_NAMES.includes(dbName as any)) {
    throw new Error(`PLAYWRIGHT E2E SAFETY BLOCK: Configured database '${dbName}' is a protected or unapproved database. E2E browser testing must target 'jeevancare_test'.`)
  }

  return urlToTest
}

/** Fail-closed database safety guard for integration test wipes */
export function checkTestDatabaseSafety(rawUrl?: string, payload?: Payload): { ok: boolean; reason?: string; dbName?: string; liveDbName?: string } {
  const urlToTest = rawUrl ?? (process.env.DATABASE_URL || '')
  if (!urlToTest) {
    return { ok: false, reason: 'Refusing to run integration test wipes: DATABASE_URL environment variable is empty or undefined.' }
  }

  const dbName = getDatabaseNameFromUrl(urlToTest)
  if (!dbName) {
    return { ok: false, reason: 'Refusing to run integration test wipes: Could not parse database name from DATABASE_URL.' }
  }

  if (PROHIBITED_DB_NAMES.includes(dbName as any)) {
    return {
      ok: false,
      dbName,
      reason: `Refusing to run destructive integration test wipes: Database '${dbName}' is a protected UAT/Production database.`,
    }
  }

  if (!APPROVED_TEST_DB_NAMES.includes(dbName as any)) {
    return {
      ok: false,
      dbName,
      reason: `Refusing to run destructive integration test wipes: Configured database '${dbName}' is not in approved dedicated test database allowlist (${APPROVED_TEST_DB_NAMES.join(', ')}).`,
    }
  }

  if (payload) {
    const liveDbName = ((payload.db as any)?.connection?.db?.databaseName || (payload.db as any)?.connection?.name || '').toLowerCase()
    if (!liveDbName) {
      return {
        ok: false,
        dbName,
        reason: 'Refusing to run destructive integration test wipes: Live connected database name could not be verified on the Payload instance.',
      }
    }

    if (PROHIBITED_DB_NAMES.includes(liveDbName as any)) {
      return {
        ok: false,
        dbName,
        liveDbName,
        reason: `Refusing to run destructive integration test wipes: Connected live database '${liveDbName}' is a protected UAT/Production database.`,
      }
    }

    if (!APPROVED_TEST_DB_NAMES.includes(liveDbName as any)) {
      return {
        ok: false,
        dbName,
        liveDbName,
        reason: `Refusing to run destructive integration test wipes: Connected live database '${liveDbName}' is not in approved dedicated test database allowlist (${APPROVED_TEST_DB_NAMES.join(', ')}).`,
      }
    }

    if (liveDbName !== dbName) {
      return {
        ok: false,
        dbName,
        liveDbName,
        reason: `Refusing to run destructive integration test wipes: Configured database ('${dbName}') and live connected database ('${liveDbName}') do not match.`,
      }
    }
  }

  return { ok: true, dbName, liveDbName: payload ? (((payload.db as any)?.connection?.db?.databaseName || (payload.db as any)?.connection?.name || '').toLowerCase()) : undefined }
}

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
      // Default the shared fixture to the unlimited plan so unrelated suites (which
      // add several doctors/patients) aren't constrained; the plan-limit suite sets
      // the plan it needs explicitly.
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
        phone: `0300000000${key === 'A' ? '1' : '2'}`,
        gender: 'male',
        ageYears: 30,
      },
      overrideAccess: true,
      disableTransaction: true,
    })
    return { tenant, owner, doctor, receptionist, patient }
  }

  const a = await makeClinic('A', 'City Care Clinic')
  const b = await makeClinic('B', 'Shifa Family Clinic')

  return { superAdmin, a, b }
}
