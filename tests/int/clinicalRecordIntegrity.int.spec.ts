import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'

describe('Clinical Record Integrity & Immutability Hardening Suite', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)
  })

  // =========================================================================
  // 1. ONE VISIT PER APPOINTMENT GUARD
  // =========================================================================

  it('prohibits creating multiple visits for a single appointment', async () => {
    // 1. Create and check in an appointment
    const appt = await payload.create({
      collection: 'appointments',
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        start: new Date().toISOString(),
        durationMins: 15,
        status: 'checked-in',
      },
      overrideAccess: true,
    })

    // 2. Record first visit
    const visit1 = await payload.create({
      collection: 'visits',
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        appointment: appt.id,
        symptoms: 'Fever and chills',
        diagnosis: 'Acute Viral Fever',
      } as any,
      overrideAccess: true,
    })
    expect(visit1.id).toBeTruthy()

    // 3. Attempt second visit for the exact same appointment
    const secondAttempt = payload.create({
      collection: 'visits',
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        appointment: appt.id,
        symptoms: 'Fever again',
        diagnosis: 'Duplicate visit attempt',
      } as any,
      overrideAccess: true,
    })

    await expect(secondAttempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 2. AUDIT LOG IMMUTABILITY (REST / API MUTATION DENIAL)
  // =========================================================================

  it('denies direct creation, modification, or deletion of audit logs over REST/API', async () => {
    // Attempt direct audit log creation without overrideAccess
    const createAttempt = payload.create({
      collection: 'auditLogs',
      user: f.a.owner,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        user: f.a.owner.id,
        action: 'user.created',
        targetCollection: 'users',
        targetId: 'fake-id',
        summary: 'Forged audit log entry',
      },
    })
    await expect(createAttempt).rejects.toBeTruthy()

    // Attempt direct audit log update without overrideAccess
    const existingLogs = await payload.find({
      collection: 'auditLogs',
      overrideAccess: true,
      limit: 1,
    })

    if (existingLogs.docs.length > 0) {
      const logId = existingLogs.docs[0].id
      const updateAttempt = payload.update({
        collection: 'auditLogs',
        id: logId,
        user: f.a.owner,
        overrideAccess: false,
        data: { summary: 'Tampered summary' } as never,
      })
      await expect(updateAttempt).rejects.toBeTruthy()

      const deleteAttempt = payload.delete({
        collection: 'auditLogs',
        id: logId,
        user: f.a.owner,
        overrideAccess: false,
      })
      await expect(deleteAttempt).rejects.toBeTruthy()
    }
  })

  // =========================================================================
  // 3. CANCELLED / NO-SHOW APPOINTMENT VISIT BLOCK
  // =========================================================================

  it('rejects recording a visit for cancelled or no-show appointments', async () => {
    const cancelledAppt = await payload.create({
      collection: 'appointments',
      user: f.a.owner,
      context: { disableVerification: true },
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        start: new Date().toISOString(),
        durationMins: 15,
        status: 'cancelled',
        cancellationReason: 'Patient called to cancel',
      },
      overrideAccess: true,
    })

    const attempt = payload.create({
      collection: 'visits',
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        appointment: cancelledAppt.id,
        symptoms: 'Headache',
        diagnosis: 'Migraine',
      } as any,
      overrideAccess: true,
    })

    await expect(attempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 4. CROSS-PATIENT & CROSS-TENANT RECORD ATTACHMENT PREVENTION
  // =========================================================================

  it('rejects recording a visit attaching to another clinic or patient appointment', async () => {
    // Appointment in Clinic B
    const apptB = await payload.create({
      collection: 'appointments',
      data: {
        tenant: f.b.tenant.id,
        patient: f.b.patient.id,
        doctor: f.b.doctor.id,
        start: new Date().toISOString(),
        durationMins: 15,
        status: 'checked-in',
      },
      overrideAccess: true,
    })

    // Clinic A doctor attempts to record visit for Clinic B appointment
    const attempt = payload.create({
      collection: 'visits',
      user: f.a.doctor,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        appointment: apptB.id,
        symptoms: 'Cross tenant attempt',
        diagnosis: 'Invalid',
      } as any,
    })

    await expect(attempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 5. TIMELINE CHRONOLOGICAL ORDERING
  // =========================================================================

  it('retrieves patient clinical timeline in descending chronological order (-visitDate)', async () => {
    const appt = await payload.create({
      collection: 'appointments',
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        start: new Date().toISOString(),
        durationMins: 15,
        status: 'checked-in',
      },
      overrideAccess: true,
    })

    await payload.create({
      collection: 'visits',
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        appointment: appt.id,
        visitDate: '2026-05-10T10:00:00.000Z',
        symptoms: 'Older Visit',
        diagnosis: 'Diagnosis A',
      } as any,
      overrideAccess: true,
    })

    const visits = await payload.find({
      collection: 'visits',
      where: { patient: { equals: f.a.patient.id } },
      sort: '-visitDate',
      overrideAccess: true,
    })

    expect(visits.docs.length).toBeGreaterThan(0)
    for (let i = 0; i < visits.docs.length - 1; i++) {
      const current = new Date(visits.docs[i].visitDate).getTime()
      const next = new Date(visits.docs[i + 1].visitDate).getTime()
      expect(current).toBeGreaterThanOrEqual(next)
    }
  })
})
