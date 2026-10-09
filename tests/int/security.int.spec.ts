import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { relId } from '@/lib/utils'

describe('Security Hardening & Tenant Isolation Suite (OWASP ASVS Aligned)', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)
  })

  const tomorrowAt = (hour: number) => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(hour, 0, 0, 0)
    return d.toISOString()
  }

  // Helper to create a patient portal user for Patient A
  async function makePatientUser(patientDoc: any, tenantDoc: any) {
    return payload.create({
      collection: 'users',
      data: {
        name: patientDoc.name,
        email: `portal-${patientDoc.id}@patient.test`,
        password: 'password123',
        role: 'patient',
        tenant: tenantDoc.id,
        patientProfile: patientDoc.id,
      },
      overrideAccess: true,
    })
  }

  // =========================================================================
  // 1. TENANT ISOLATION (Tenant A ➔ Tenant B Cross-Boundary Prohibitions)
  // =========================================================================

  it('prohibits Owner A from reading Clinic B patients', async () => {
    const patients = await payload.find({
      collection: 'patients',
      user: f.a.owner,
      overrideAccess: false,
    })
    expect(patients.docs.every((p) => relId(p.tenant) === String(f.a.tenant.id))).toBe(true)
  })

  it('prohibits Owner A from updating Clinic B patient details (IDOR/BOLA Prevention)', async () => {
    const updateAttempt = payload.update({
      collection: 'patients',
      id: f.b.patient.id,
      user: f.a.owner,
      overrideAccess: false,
      data: { name: 'Tampered Patient Name' } as never,
    })
    await expect(updateAttempt).rejects.toBeTruthy()
  })

  it('prohibits Doctor A from reading Clinic B appointments', async () => {
    // Book an appointment in Clinic B
    await payload.create({
      collection: 'appointments',
      user: f.b.owner,
      overrideAccess: true,
      data: {
        tenant: f.b.tenant.id,
        patient: f.b.patient.id,
        doctor: f.b.doctor.id,
        start: tomorrowAt(10),
        durationMins: 15,
        status: 'scheduled',
      } as never,
    })

    const appts = await payload.find({
      collection: 'appointments',
      user: f.a.doctor,
      overrideAccess: false,
    })
    expect(appts.docs.every((a) => relId(a.tenant) === String(f.a.tenant.id))).toBe(true)
  })

  // =========================================================================
  // 2. PATIENT AUTHORIZATION & SELF-ACCESS (Patient A ➔ Patient B Isolation)
  // =========================================================================

  it('restricts Patient A to reading ONLY their own appointments within the clinic', async () => {
    // Patient A user
    const patientUserA = await makePatientUser(f.a.patient, f.a.tenant)

    // Create a second patient (Patient A2) in Clinic A
    const patientA2 = await payload.create({
      collection: 'patients',
      data: { tenant: f.a.tenant.id, name: 'Patient A2', phone: '03009999999', gender: 'female', ageYears: 25 },
      overrideAccess: true,
    })

    // Book appointment for Patient A
    const apptA = await payload.create({
      collection: 'appointments',
      user: f.a.owner,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        start: tomorrowAt(10),
        durationMins: 15,
        status: 'scheduled',
      } as never,
    })

    // Book appointment for Patient A2
    await payload.create({
      collection: 'appointments',
      user: f.a.owner,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: patientA2.id,
        doctor: f.a.doctor.id,
        start: tomorrowAt(11),
        durationMins: 15,
        status: 'scheduled',
      } as never,
    })

    // Query appointments AS Patient A user with access control enforced
    const apptsAsPatientA = await payload.find({
      collection: 'appointments',
      user: patientUserA,
      overrideAccess: false,
      depth: 0,
    })

    expect(apptsAsPatientA.docs.length).toBe(1)
    expect(String(apptsAsPatientA.docs[0].id)).toBe(String(apptA.id))
    expect(relId(apptsAsPatientA.docs[0].patient)).toBe(String(f.a.patient.id))
  })

  it('restricts Patient A from reading another patient medical history or visits', async () => {
    const patientUserA = await makePatientUser(f.a.patient, f.a.tenant)

    const apptB = await payload.create({
      collection: 'appointments',
      user: f.a.owner,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        start: tomorrowAt(12),
        durationMins: 15,
        status: 'checked-in',
      } as never,
    })

    const visitB = await payload.create({
      collection: 'visits',
      user: f.a.doctor,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        appointment: apptB.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        diagnosis: 'Private Clinical Diagnosis',
        visitDate: new Date().toISOString(),
      } as never,
    })

    // Patient A2 tries to read visits
    const patientA2 = await payload.create({
      collection: 'patients',
      data: { tenant: f.a.tenant.id, name: 'Patient A2', phone: '03008888888', gender: 'male', ageYears: 28 },
      overrideAccess: true,
    })
    const patientUserA2 = await makePatientUser(patientA2, f.a.tenant)

    const visitsAsA2 = await payload.find({
      collection: 'visits',
      user: patientUserA2,
      overrideAccess: false,
    })

    expect(visitsAsA2.docs.length).toBe(0)
  })

  // =========================================================================
  // 3. PRIVILEGE ESCALATION & MASS ASSIGNMENT PREVENTION
  // =========================================================================

  it('prohibits clinic Owner A from creating a superAdmin user', async () => {
    const attempt = payload.create({
      collection: 'users',
      user: f.a.owner,
      overrideAccess: false,
      data: {
        name: 'Escalated Admin',
        email: 'attacker@clinic.test',
        password: 'password123',
        role: 'superAdmin',
      } as never,
    })
    await expect(attempt).rejects.toBeTruthy()
  })

  it('prohibits non-superAdmin users from changing their clinic tenant association', async () => {
    const attempt = payload.update({
      collection: 'users',
      id: f.a.owner.id,
      user: f.a.owner,
      overrideAccess: false,
      data: { tenant: f.b.tenant.id } as never,
    })
    await expect(attempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 4. IMMUTABILITY OF AUDIT LOGS
  // =========================================================================

  it('prohibits any user (including super admin) from tampering with audit log entries', async () => {
    const logs = await payload.find({ collection: 'auditLogs', limit: 1, overrideAccess: true })
    if (logs.docs.length > 0) {
      const id = logs.docs[0].id
      const attempt = payload.update({
        collection: 'auditLogs',
        id,
        user: f.superAdmin,
        overrideAccess: false,
        data: { summary: 'Tampered' } as never,
      })
      await expect(attempt).rejects.toBeTruthy()
    }
  })
})
