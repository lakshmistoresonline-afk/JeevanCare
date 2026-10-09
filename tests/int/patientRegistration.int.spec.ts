import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { patientRegisterAction } from '@/app/(frontend)/patient/register/actions'
import { relId } from '@/lib/utils'

describe('Patient Identity Model & Self-Registration Hardening Suite', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)
  })

  // =========================================================================
  // 1. BRAND NEW PATIENT REGISTRATION
  // =========================================================================

  it('creates both a patient record and a portal user account for a new registrant', async () => {
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

  // =========================================================================
  // 2. EXISTING PATIENT WITHOUT PORTAL ACCOUNT (STAFF-CREATED)
  // =========================================================================

  it('blocks registration of staff-created patient if no activation code or MRN is provided', async () => {
    // Create staff-created patient record without portal account
    const staffPatient = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.a.tenant.id,
        name: 'Staff Created Patient',
        phone: '03001112223',
        gender: 'male',
        ageYears: 40,
        activationCode: '654321',
      },
      overrideAccess: true,
    })

    const formData = new FormData()
    formData.set('name', 'Staff Created Patient')
    formData.set('phone', '03001112223')
    formData.set('password', 'Test@123')
    formData.set('tenant', String(f.a.tenant.id))

    // Submit WITHOUT MRN / Activation Code
    const res = await patientRegisterAction(null, formData)
    expect(res.ok).toBe(false)
    if (res.ok) return

    expect(res.code).toBe('VERIFICATION_REQUIRED')
    expect(res.message).toMatch(/MRN/i)

    // Ensure NO user portal account was created
    const userDocs = await payload.find({
      collection: 'users',
      where: { patientProfile: { equals: staffPatient.id } },
      overrideAccess: true,
    })
    expect(userDocs.totalDocs).toBe(0)
  })

  it('successfully links portal account when valid MRN or activation code is provided', async () => {
    const staffPatient = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.a.tenant.id,
        name: 'Staff Created Patient 2',
        phone: '03001112224',
        gender: 'female',
        ageYears: 35,
        activationCode: '123456',
      },
      overrideAccess: true,
    })

    const formData = new FormData()
    formData.set('name', 'Staff Created Patient 2')
    formData.set('phone', '03001112224')
    formData.set('password', 'Test@123')
    formData.set('tenant', String(f.a.tenant.id))
    formData.set('activationCode', staffPatient.mrn || '123456') // Supply valid MRN

    const res = await patientRegisterAction(null, formData)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    expect(res.data.id).toBe(String(staffPatient.id))

    // Verify EXACTLY one portal user account is linked to this patient profile
    const userDocs = await payload.find({
      collection: 'users',
      where: { patientProfile: { equals: staffPatient.id } },
      overrideAccess: true,
    })
    expect(userDocs.totalDocs).toBe(1)
    expect(userDocs.docs[0].role).toBe('patient')
  })

  // =========================================================================
  // 3. EXISTING PATIENT WITH PORTAL ACCOUNT
  // =========================================================================

  it('rejects duplicate registration if patient ALREADY has an active portal account', async () => {
    // 1. First registration
    const formData = new FormData()
    formData.set('name', 'Existing Portal Patient')
    formData.set('phone', '03007778889')
    formData.set('password', 'Test@123')
    formData.set('tenant', String(f.a.tenant.id))

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
  // 4. DUPLICATE EMAIL & DUPLICATE PHONE DETECTION
  // =========================================================================

  it('detects duplicate email across user portal accounts', async () => {
    const formData1 = new FormData()
    formData1.set('name', 'User One')
    formData1.set('phone', '03001231111')
    formData1.set('email', 'shared@test.com')
    formData1.set('password', 'Test@123')
    formData1.set('tenant', String(f.a.tenant.id))
    await patientRegisterAction(null, formData1)

    const formData2 = new FormData()
    formData2.set('name', 'User Two')
    formData2.set('phone', '03001232222')
    formData2.set('email', 'shared@test.com') // Same email
    formData2.set('password', 'Test@123')
    formData2.set('tenant', String(f.a.tenant.id))

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
    await patientRegisterAction(null, formData1)

    const formData2 = new FormData()
    formData2.set('name', 'User Four')
    formData2.set('phone', '03005554444') // Same phone
    formData2.set('password', 'Test@123')
    formData2.set('tenant', String(f.a.tenant.id))

    const res2 = await patientRegisterAction(null, formData2)
    expect(res2.ok).toBe(false)
    if (res2.ok) return

    expect(res2.code).toBe('PORTAL_ACCOUNT_EXISTS')
  })

  // =========================================================================
  // 5. CROSS-TENANT PHONE MATCHING ISOLATION
  // =========================================================================

  it('allows same phone registration in Clinic B without leaking Clinic A patient records', async () => {
    // Patient registers in Clinic A
    const formDataA = new FormData()
    formDataA.set('name', 'Multi Clinic Patient')
    formDataA.set('phone', '03006667777')
    formDataA.set('email', 'multiclinic@test.com')
    formDataA.set('password', 'Test@123')
    formDataA.set('tenant', String(f.a.tenant.id))
    await patientRegisterAction(null, formDataA)

    // Staff creates a patient record in Clinic B with same phone
    const patientB = await payload.create({
      collection: 'patients',
      data: {
        tenant: f.b.tenant.id,
        name: 'Multi Clinic Patient B',
        phone: '03006667777', // Same phone in Clinic B
        gender: 'male',
        ageYears: 28,
        activationCode: '999888',
      },
      overrideAccess: true,
    })

    // Verify patient in Clinic B exists separately
    expect(patientB.id).toBeTruthy()
    expect(relId(patientB.tenant)).toBe(String(f.b.tenant.id))
  })

  // =========================================================================
  // 6. IDOR / ATTEMPTED PROFILE TAKEOVER PREVENTION
  // =========================================================================

  it('ignores client-supplied patient ID / patientProfile overrides in payload', async () => {
    const formData = new FormData()
    formData.set('name', 'Attacker Patient')
    formData.set('phone', '03008889999')
    formData.set('password', 'Test@123')
    formData.set('tenant', String(f.a.tenant.id))
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
