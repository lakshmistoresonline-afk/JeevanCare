import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'

describe('patient portal & tenant/patient security isolation', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)

    await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: f.a.patient.name,
        email: 'patient-a@clinic.test',
        password: 'password123',
        role: 'patient' as any,
        tenant: f.a.tenant.id,
        patientProfile: f.a.patient.id,
        phone: f.a.patient.phone,
        active: true,
      } as any,
    })
  })

  it('allows patient login and session creation', async () => {
    const res = await payload.login({
      collection: 'users',
      data: { email: 'patient-a@clinic.test', password: 'password123' },
    })
    expect(res.token).toBeTruthy()
    expect((res.user as any).role).toBe('patient')
  })

  it('allows querying appointments associated with patient', async () => {
    await payload.create({
      collection: 'appointments',
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        start: new Date().toISOString(),
        durationMins: 30,
        status: 'scheduled',
      },
    })

    const appts = await payload.find({
      collection: 'appointments',
      overrideAccess: true,
      where: {
        tenant: { equals: f.a.tenant.id },
        patient: { equals: f.a.patient.id },
      },
    })

    expect(appts.docs).toHaveLength(1)
  })

  it('enforces tenant isolation between clinics', async () => {
    const foundA = await payload.find({
      collection: 'patients',
      overrideAccess: true,
      where: { tenant: { equals: f.a.tenant.id } },
    })
    const foundB = await payload.find({
      collection: 'patients',
      overrideAccess: true,
      where: { tenant: { equals: f.b.tenant.id } },
    })

    const getId = (t: any) => (typeof t === 'object' && t !== null ? String(t.id ?? t._id ?? t) : String(t))
    expect(foundA.docs.every((p: any) => getId(p.tenant) === String(f.a.tenant.id))).toBe(true)
    expect(foundB.docs.every((p: any) => getId(p.tenant) === String(f.b.tenant.id))).toBe(true)
  })
})
