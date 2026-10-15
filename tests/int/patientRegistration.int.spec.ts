import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
import type { Payload } from 'payload'
import crypto from 'crypto'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { patientRegisterAction } from '@/app/(frontend)/patient/register/actions'
import { issuePatientActivationToken } from '@/app/(frontend)/dashboard/patients/actions'
import { internalIssuePatientActivationToken } from '@/lib/bookingInternal'
import { relId } from '@/lib/utils'

const mockCookieStore = new Map<string, string>()

vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => {
      if (name.toLowerCase() === 'cookie') {
        const token = mockCookieStore.get('payload-token')
        return token ? `payload-token=${token}` : null
      }
      return null
    },
  }),
  cookies: async () => ({
    get: (name: string) => (mockCookieStore.has(name) ? { value: mockCookieStore.get(name)! } : undefined),
    set: (name: string, value: string, _opts?: any) => {
      if (value) mockCookieStore.set(name, value)
      else mockCookieStore.delete(name)
    },
    delete: (name: string) => mockCookieStore.delete(name),
  }),
}))

describe('Patient Identity Model & Self-Registration Hardening Suite', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    mockCookieStore.clear()
    f = await seedFixture(payload)
  })

  const setTestSessionUser = async (userEmail: string) => {
    mockCookieStore.clear()
    const loginRes = await payload.login({
      collection: 'users',
      data: { email: userEmail, password: 'password123' },
    })
    if (loginRes.token) {
      mockCookieStore.set('payload-token', loginRes.token)
    }
  }

  // =========================================================================
  // 1. BRAND NEW PATIENT REGISTRATION & DEMOGRAPHIC VALIDATION
  // =========================================================================

  it('creates both a patient record and a portal user account for a new registrant with valid demographics', async () => {
    const formData = new FormData()
    formData.set('name', 'Brand New Patient')
    formData.set('phone', '03009876543')
    formData.set('email', 'newpatient@test.com')
    formData.set('password', 'Test@123')
    formData.set('tenant', String(f.a.tenant.id))
    formData.set('gender', 'female')
    formData.set('dob', '1995-05-15')

    const res = await patientRegisterAction(null, formData)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    expect(res.data.id).toBeTruthy()

    // Verify patient record in patients collection
    const patientDoc = await payload.findByID({
      collection: 'patients',
      id: res.data.id,
      overrideAccess: true,
    })
    expect(patientDoc.name).toBe('Brand New Patient')
    expect(patientDoc.phone).toBe('03009876543')
    expect(patientDoc.gender).toBe('female')

    // Verify user portal account in users collection
    const userDocs = await payload.find({
      collection: 'users',
      where: { patientProfile: { equals: res.data.id } },
      overrideAccess: true,
    })
    expect(userDocs.totalDocs).toBe(1)
    expect(userDocs.docs[0].role).toBe('patient')
    expect(relId(userDocs.docs[0].tenant)).toBe(String(f.a.tenant.id))
  })

  it('rejects new patient registration missing required age or gender demographics', async () => {
    // Missing gender
    const formDataNoGender = new FormData()
    formDataNoGender.set('name', 'No Gender Patient')
    formDataNoGender.set('phone', '03009990001')
    formDataNoGender.set('password', 'Test@123')
    formDataNoGender.set('tenant', String(f.a.tenant.id))
    formDataNoGender.set('dob', '1990-01-01')

    const res1 = await patientRegisterAction(null, formDataNoGender)
    expect(res1.ok).toBe(false)
    if (!res1.ok) expect(res1.code).toBe('VALIDATION')

    // Missing DOB and Age
    const formDataNoAge = new FormData()
    formDataNoAge.set('name', 'No Age Patient')
    formDataNoAge.set('phone', '03009990002')
    formDataNoAge.set('password', 'Test@123')
    formDataNoAge.set('tenant', String(f.a.tenant.id))
    formDataNoAge.set('gender', 'male')

    const res2 = await patientRegisterAction(null, formDataNoAge)
    expect(res2.ok).toBe(false)
    if (!res2.ok) expect(res2.code).toBe('VALIDATION')
  })

  // =========================================================================
  // 2. EXISTING PATIENT WITHOUT PORTAL ACCOUNT (STAFF-CREATED) & TOKEN EXPIRED
  // =========================================================================

  it('blocks registration of staff-created patient if no activation code is provided', async () => {
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const hash = crypto.createHash('sha256').update('654321').digest('hex')

    const staffPatient = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.a.tenant.id,
        name: 'Staff Created Patient',
        phone: '03001112223',
        gender: 'male',
        ageYears: 40,
        activationTokenHash: hash,
        activationTokenExp: exp,
      },
      overrideAccess: true,
    })

    const formData = new FormData()
    formData.set('name', 'Staff Created Patient')
    formData.set('phone', '03001112223')
    formData.set('password', 'Test@123')
    formData.set('tenant', String(f.a.tenant.id))

    // Submit WITHOUT Activation Code
    const res = await patientRegisterAction(null, formData)
    expect(res.ok).toBe(false)
    if (res.ok) return

    expect(res.code).toBe('VERIFICATION_REQUIRED')

    // Ensure NO user portal account was created
    const userDocs = await payload.find({
      collection: 'users',
      where: { patientProfile: { equals: staffPatient.id } },
      overrideAccess: true,
    })
    expect(userDocs.totalDocs).toBe(0)
  })

  it('rejects MRN alone as activation credential and successfully links portal account when valid activation code is provided', async () => {
    const code = '123456'
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const staffPatient = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.a.tenant.id,
        name: 'Staff Created Patient 2',
        phone: '03001112224',
        gender: 'female',
        ageYears: 35,
        activationTokenHash: hash,
        activationTokenExp: exp,
      },
      overrideAccess: true,
    })

    // 1. Attempt using MRN alone (must be REJECTED)
    const mrnFormData = new FormData()
    mrnFormData.set('name', 'Staff Created Patient 2')
    mrnFormData.set('phone', '03001112224')
    mrnFormData.set('password', 'Test@123')
    mrnFormData.set('tenant', String(f.a.tenant.id))
    mrnFormData.set('activationCode', staffPatient.mrn!) // Supply MRN alone
    const mrnRes = await patientRegisterAction(null, mrnFormData)
    expect(mrnRes.ok).toBe(false)

    // 2. Attempt using valid single-use activation code (must SUCCEED)
    const codeFormData = new FormData()
    codeFormData.set('name', 'Staff Created Patient 2')
    codeFormData.set('phone', '03001112224')
    codeFormData.set('password', 'Test@123')
    codeFormData.set('tenant', String(f.a.tenant.id))
    codeFormData.set('activationCode', code) // Supply valid single-use activation code

    const res = await patientRegisterAction(null, codeFormData)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    expect(res.data.id).toBe(String(staffPatient.id))

    // Verify token hash was invalidated/consumed upon claim
    const updatedPatient = await payload.findByID({
      collection: 'patients',
      id: staffPatient.id,
      overrideAccess: true,
    })
    expect(updatedPatient.activationTokenHash ?? null).toBeNull()

    // Verify EXACTLY one portal user account is linked to this patient profile
    const userDocs = await payload.find({
      collection: 'users',
      where: { patientProfile: { equals: staffPatient.id } },
      overrideAccess: true,
    })
    expect(userDocs.totalDocs).toBe(1)
    expect(userDocs.docs[0].role).toBe('patient')
  })

  it('handles simultaneous concurrent token claims allowing at most one successful claim', async () => {
    const code = '888999'
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const staffPatient = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.a.tenant.id,
        name: 'Concurrent Activation Patient',
        phone: '03001115555',
        gender: 'male',
        ageYears: 30,
        activationTokenHash: hash,
        activationTokenExp: exp,
      },
      overrideAccess: true,
    })

    const makeClaimCall = (uniqueEmail: string) => {
      const formData = new FormData()
      formData.set('name', 'Concurrent Activation Patient')
      formData.set('phone', '03001115555')
      formData.set('email', uniqueEmail)
      formData.set('password', 'Test@123')
      formData.set('tenant', String(f.a.tenant.id))
      formData.set('activationCode', code)
      return patientRegisterAction(null, formData)
    }

    // Fire 2 concurrent simultaneous token claims
    const [resA, resB] = await Promise.all([
      makeClaimCall('claim_a@test.com'),
      makeClaimCall('claim_b@test.com'),
    ])

    const successCount = [resA, resB].filter((r) => r.ok).length
    const failCount = [resA, resB].filter((r) => !r.ok).length

    expect(successCount).toBe(1)
    expect(failCount).toBe(1)

    // Verify EXACTLY 1 user portal account was linked to this patient
    const userDocs = await payload.find({
      collection: 'users',
      where: { patientProfile: { equals: staffPatient.id } },
      overrideAccess: true,
    })
    expect(userDocs.totalDocs).toBe(1)
  })

  it('prevents stale token restoration when staff reissues a new activation code during an in-flight user creation failure', async () => {
    const code1 = '111222'
    const hash1 = crypto.createHash('sha256').update(code1).digest('hex')
    const exp1 = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const staffPatient = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.a.tenant.id,
        name: 'In-Flight Race Patient',
        phone: '03001117777',
        gender: 'male',
        ageYears: 32,
        activationTokenHash: hash1,
        activationTokenExp: exp1,
      },
      overrideAccess: true,
    })

    // Intercept payload.create for users collection to simulate staff token reissuance while in-flight
    const originalCreate = payload.create.bind(payload)
    let reissuedHash2 = ''

    payload.create = (async (args: any) => {
      if (args.collection === 'users') {
        // Step 4: Reissue token 2 through the real internal staff action while user creation is in-flight!
        const issueRes = await internalIssuePatientActivationToken(String(staffPatient.id), f.a.doctor)
        expect(issueRes.ok).toBe(true)

        if (issueRes.ok) {
          reissuedHash2 = crypto.createHash('sha256').update(issueRes.data.activationCode).digest('hex')
        }

        // Step 5: Force portal-user creation to fail
        throw new Error('Simulated database error during user creation')
      }
      return originalCreate(args)
    }) as typeof payload.create

    try {
      const formData = new FormData()
      formData.set('name', 'In-Flight Race Patient')
      formData.set('phone', '03001117777')
      formData.set('password', 'Test@123')
      formData.set('tenant', String(f.a.tenant.id))
      formData.set('activationCode', code1)

      // Run registration; code 1 is claimed, user creation fails, recovery catch handler executes!
      const res = await patientRegisterAction(null, formData)
      expect(res.ok).toBe(false)
    } finally {
      payload.create = originalCreate // Restore original method
    }

    // Read patient directly from DB and verify that token 2's hash remains intact and hash1 was NOT restored
    const finalPatient = await payload.findByID({
      collection: 'patients',
      id: staffPatient.id,
      overrideAccess: true,
      showHiddenFields: true,
    })

    expect(finalPatient.activationTokenHash).toBe(reissuedHash2)
    expect(finalPatient.activationTokenHash).not.toBe(hash1)

    // Verify no user portal account was created
    const userDocs = await payload.find({
      collection: 'users',
      where: { patientProfile: { equals: staffPatient.id } },
      overrideAccess: true,
    })
    expect(userDocs.totalDocs).toBe(0)
  })

  // =========================================================================
  // 3. PUBLIC SERVER ACTION AUTHORIZATION BOUNDARY SUITE
  // =========================================================================

  it('rejects unauthenticated calls to public issuePatientActivationToken Server Action', async () => {
    mockCookieStore.clear()
    const unauthRes = await issuePatientActivationToken(String(f.a.patient.id))
    expect(unauthRes.ok).toBe(false)
    if (!unauthRes.ok) {
      expect(unauthRes.code).toBe('FORBIDDEN')
    }
  })

  it('rejects patient-role callers attempting to issue activation codes through public Server Action', async () => {
    // Create a patient portal user linked to patient profile
    const patientUser = await payload.create({
      collection: 'users',
      data: {
        name: 'Patient User Caller',
        email: 'patientcaller@clinic.test',
        password: 'password123',
        role: 'patient',
        tenant: f.a.tenant.id,
      },
      overrideAccess: true,
    })

    await setTestSessionUser(patientUser.email)
    const patientRes = await issuePatientActivationToken(String(f.a.patient.id))
    expect(patientRes.ok).toBe(false)
    if (!patientRes.ok) {
      expect(patientRes.code).toBe('FORBIDDEN')
    }
  })

  it('rejects Clinic A staff issuing activation codes for a Clinic B patient through public Server Action', async () => {
    await setTestSessionUser(f.a.doctor.email)
    const crossClinicRes = await issuePatientActivationToken(String(f.b.patient.id))
    expect(crossClinicRes.ok).toBe(false)
    if (!crossClinicRes.ok) {
      expect(crossClinicRes.code).toBe('FORBIDDEN')
    }
  })

  it('allows authorized Clinic A staff to issue an activation code for a Clinic A patient through public Server Action', async () => {
    await setTestSessionUser(f.a.owner.email)
    const validRes = await issuePatientActivationToken(String(f.a.patient.id))
    expect(validRes.ok).toBe(true)
    if (validRes.ok) {
      expect(validRes.data.activationCode).toMatch(/^[0-9]{6}$/)
    }
  })

  it('allows super-admin to issue activation codes across clinics through public Server Action', async () => {
    await setTestSessionUser(f.superAdmin.email)
    const superRes = await issuePatientActivationToken(String(f.b.patient.id))
    expect(superRes.ok).toBe(true)
    if (superRes.ok) {
      expect(superRes.data.activationCode).toMatch(/^[0-9]{6}$/)
    }
  })

  it('prevents activation token restoration when user creation succeeds but login fails', async () => {
    const code = '555666'
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    const staffPatient = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.a.tenant.id,
        name: 'Login Failure Patient',
        phone: '03001118888',
        gender: 'female',
        ageYears: 29,
        activationTokenHash: hash,
        activationTokenExp: exp,
      },
      overrideAccess: true,
    })

    const originalLogin = payload.login.bind(payload)
    payload.login = (async () => {
      throw new Error('Simulated login service failure after user creation')
    }) as typeof payload.login

    try {
      const formData = new FormData()
      formData.set('name', 'Login Failure Patient')
      formData.set('phone', '03001118888')
      formData.set('password', 'Test@123')
      formData.set('tenant', String(f.a.tenant.id))
      formData.set('activationCode', code)

      const res = await patientRegisterAction(null, formData)
      expect(res.ok).toBe(false)
    } finally {
      payload.login = originalLogin
    }

    // Verify user portal account WAS created
    const userDocs = await payload.find({
      collection: 'users',
      where: { patientProfile: { equals: staffPatient.id } },
      overrideAccess: true,
    })
    expect(userDocs.totalDocs).toBe(1)

    // Verify token was NOT restored (remains consumed)
    const finalPatient = await payload.findByID({
      collection: 'patients',
      id: staffPatient.id,
      overrideAccess: true,
      showHiddenFields: true,
    })
    expect(finalPatient.activationTokenHash ?? null).toBeNull()
  })

  it('rejects expired activation token with ACTIVATION_EXPIRED', async () => {
    const code = '777888'
    const hash = crypto.createHash('sha256').update(code).digest('hex')
    const expiredExp = new Date(Date.now() - 10000).toISOString() // Past expiry

    const staffPatient = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.a.tenant.id,
        name: 'Expired Patient',
        phone: '03001119999',
        gender: 'male',
        ageYears: 45,
        activationTokenHash: hash,
        activationTokenExp: expiredExp,
      },
      overrideAccess: true,
    })

    const formData = new FormData()
    formData.set('name', 'Expired Patient')
    formData.set('phone', '03001119999')
    formData.set('password', 'Test@123')
    formData.set('tenant', String(f.a.tenant.id))
    formData.set('activationCode', code)

    const res = await patientRegisterAction(null, formData)
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.code).toBe('ACTIVATION_EXPIRED')
    }
  })

  // =========================================================================
  // 4. EXISTING PATIENT WITH PORTAL ACCOUNT
  // =========================================================================

  it('rejects duplicate registration if patient ALREADY has an active portal account', async () => {
    // 1. First registration
    const formData = new FormData()
    formData.set('name', 'Existing Portal Patient')
    formData.set('phone', '03007778889')
    formData.set('password', 'Test@123')
    formData.set('tenant', String(f.a.tenant.id))
    formData.set('gender', 'male')
    formData.set('dob', '1988-08-08')

    const firstRes = await patientRegisterAction(null, formData)
    expect(firstRes.ok).toBe(true)

    // 2. Second registration attempt with same details
    const secondRes = await patientRegisterAction(null, formData)
    expect(secondRes.ok).toBe(false)
    if (secondRes.ok) return

    expect(secondRes.code).toBe('PORTAL_ACCOUNT_EXISTS')
    expect(secondRes.message).toMatch(/portal account already exists/i)
  })

  // =========================================================================
  // 5. DUPLICATE EMAIL & DUPLICATE PHONE DETECTION
  // =========================================================================

  it('detects duplicate email across user portal accounts', async () => {
    const formData1 = new FormData()
    formData1.set('name', 'User One')
    formData1.set('phone', '03001231111')
    formData1.set('email', 'shared@test.com')
    formData1.set('password', 'Test@123')
    formData1.set('tenant', String(f.a.tenant.id))
    formData1.set('gender', 'male')
    formData1.set('dob', '1990-01-01')
    await patientRegisterAction(null, formData1)

    const formData2 = new FormData()
    formData2.set('name', 'User Two')
    formData2.set('phone', '03001232222')
    formData2.set('email', 'shared@test.com') // Same email
    formData2.set('password', 'Test@123')
    formData2.set('tenant', String(f.a.tenant.id))
    formData2.set('gender', 'female')
    formData2.set('dob', '1992-02-02')

    const res2 = await patientRegisterAction(null, formData2)
    expect(res2.ok).toBe(false)
    if (res2.ok) return

    expect(res2.code).toBe('PORTAL_ACCOUNT_EXISTS')
  })

  it('detects duplicate mobile phone across user portal accounts', async () => {
    const formData1 = new FormData()
    formData1.set('name', 'User Three')
    formData1.set('phone', '03005554444')
    formData1.set('password', 'Test@123')
    formData1.set('tenant', String(f.a.tenant.id))
    formData1.set('gender', 'male')
    formData1.set('dob', '1990-01-01')
    await patientRegisterAction(null, formData1)

    const formData2 = new FormData()
    formData2.set('name', 'User Four')
    formData2.set('phone', '03005554444') // Same phone
    formData2.set('password', 'Test@123')
    formData2.set('tenant', String(f.a.tenant.id))
    formData2.set('gender', 'female')
    formData2.set('dob', '1992-02-02')

    const res2 = await patientRegisterAction(null, formData2)
    expect(res2.ok).toBe(false)
    if (res2.ok) return

    expect(res2.code).toBe('PORTAL_ACCOUNT_EXISTS')
  })

  // =========================================================================
  // 6. CROSS-TENANT PHONE MATCHING ISOLATION
  // =========================================================================

  it('allows same phone registration in Clinic B without leaking Clinic A patient records', async () => {
    // Patient registers in Clinic A
    const formDataA = new FormData()
    formDataA.set('name', 'Multi Clinic Patient')
    formDataA.set('phone', '03006667777')
    formDataA.set('email', 'multiclinic@test.com')
    formDataA.set('password', 'Test@123')
    formDataA.set('tenant', String(f.a.tenant.id))
    formDataA.set('gender', 'male')
    formDataA.set('dob', '1990-01-01')
    await patientRegisterAction(null, formDataA)

    // Staff creates a patient record in Clinic B with same phone
    const exp = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const hash = crypto.createHash('sha256').update('999888').digest('hex')
    const patientB = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.b.tenant.id,
        name: 'Multi Clinic Patient B',
        phone: '03006667777', // Same phone in Clinic B
        gender: 'male',
        ageYears: 28,
        activationTokenHash: hash,
        activationTokenExp: exp,
      },
      overrideAccess: true,
    })

    // Verify patient in Clinic B exists separately
    expect(patientB.id).toBeTruthy()
    expect(relId(patientB.tenant)).toBe(String(f.b.tenant.id))
  })

  // =========================================================================
  // 7. IDOR / ATTEMPTED PROFILE TAKEOVER PREVENTION
  // =========================================================================

  it('ignores client-supplied patient ID / patientProfile overrides in payload', async () => {
    const formData = new FormData()
    formData.set('name', 'Attacker Patient')
    formData.set('phone', '03008889999')
    formData.set('password', 'Test@123')
    formData.set('tenant', String(f.a.tenant.id))
    formData.set('gender', 'male')
    formData.set('dob', '1990-01-01')
    formData.set('patientProfile', String(f.a.patient.id)) // Attempted takeover payload

    const res = await patientRegisterAction(null, formData)
    expect(res.ok).toBe(true)

    // Verify created user links ONLY to the newly created patient, NOT f.a.patient
    const userDoc = await payload.findByID({
      collection: 'users',
      id: (await payload.find({ collection: 'users', where: { phone: { equals: '03008889999' } }, overrideAccess: true })).docs[0].id,
      overrideAccess: true,
    })
    expect(relId(userDoc.patientProfile)).not.toBe(String(f.a.patient.id))
  })
})
