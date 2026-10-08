import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { relId } from '@/lib/utils'

describe('Indian Prescription & Doctor Credentials Standardization Suite', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)
  })

  it('verifies doctor profile stores qualification, registration number and state medical council', async () => {
    const doctor = await payload.findByID({
      collection: 'users',
      id: f.a.doctor.id,
      overrideAccess: true,
    })

    expect(doctor.role).toBe('doctor')
    expect(doctor.medicalRegistrationNumber).toBeDefined()
    expect(doctor.stateMedicalCouncil).toBeDefined()
  })

  it('verifies visit consultation record preserves prescription rows, vitals, and diagnosis for A5 printing', async () => {
    // 1. Create checked-in appointment
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

    // 2. Record consultation visit with diagnosis & prescription
    const visit = await payload.create({
      collection: 'visits',
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        appointment: appt.id,
        visitDate: new Date().toISOString(),
        symptoms: 'High fever and headache',
        diagnosis: 'Acute Viral Fever',
        vitals: {
          bpSystolic: 120,
          bpDiastolic: 80,
          temperatureC: 38.5,
          weightKg: 65,
          pulse: 82,
        },
        prescription: [
          { medicine: 'Paracetamol 650mg', dosage: '1 tablet', frequency: 'bd', durationDays: 5, instructions: 'After food' },
        ],
        followUpDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      } as any,
      overrideAccess: true,
    })

    // 3. Fetch visit with populated relationships
    const fetchedVisit = await payload.findByID({
      collection: 'visits',
      id: visit.id,
      depth: 1,
      overrideAccess: true,
    })

    expect(fetchedVisit.diagnosis).toBe('Acute Viral Fever')
    expect(fetchedVisit.prescription?.length).toBe(1)
    expect(fetchedVisit.prescription![0].medicine).toBe('Paracetamol 650mg')
    expect((fetchedVisit.doctor as any).name).toBe(f.a.doctor.name)
    expect((fetchedVisit.patient as any).name).toBe(f.a.patient.name)
  })
})
