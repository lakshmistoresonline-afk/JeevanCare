import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { relId } from '@/lib/utils'

describe('UAT Environment Hardening & Access Control Suite', () => {
  let payload: Payload
  let f: Fixture
  let patientUserA: any
  let patientUserB: any

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)

    patientUserA = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: f.a.patient.name,
        email: 'patA@test.com',
        password: 'password123',
        role: 'patient',
        tenant: f.a.tenant.id,
        patientProfile: f.a.patient.id,
      },
    })

    patientUserB = await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: f.b.patient.name,
        email: 'patB@test.com',
        password: 'password123',
        role: 'patient',
        tenant: f.b.tenant.id,
        patientProfile: f.b.patient.id,
      },
    })
  })

  // =========================================================================
  // 1. TENANT ISOLATION
  // =========================================================================

  it('prohibits Owner A from reading or modifying Clinic B patients', async () => {
    const res = await payload.find({
      collection: 'patients',
      user: f.a.owner,
      overrideAccess: false,
    })

    const foundClinicBPatient = res.docs.some((p) => relId(p.tenant) === String(f.b.tenant.id))
    expect(foundClinicBPatient).toBe(false)
  })

  // =========================================================================
  // 2. PATIENT OWNERSHIP & DATA BOUNDARY
  // =========================================================================

  it('restricts Patient A to reading ONLY their own patient record and appointments', async () => {
    const res = await payload.find({
      collection: 'appointments',
      user: patientUserA,
      overrideAccess: false,
    })

    const allBelongToPatientA = res.docs.every((a) => relId(a.patient) === String(f.a.patient.id))
    expect(allBelongToPatientA).toBe(true)
  })

  // =========================================================================
  // 3. DUPLICATE PORTAL PREVENTION
  // =========================================================================

  it('prevents creating duplicate portal accounts for an existing patient profile', async () => {
    const duplicateAttempt = payload.create({
      collection: 'users',
      overrideAccess: true,
      data: {
        name: 'Duplicate Patient User',
        email: 'duplicate@test.com',
        password: 'Test@123',
        role: 'patient',
        tenant: f.a.tenant.id,
        patientProfile: f.a.patient.id, // Linking to already-linked patientProfile
      } as any,
    })

    await expect(duplicateAttempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 4. MEDICAL DOCUMENT & INVOICE PROTECTION
  // =========================================================================

  it('denies Patient B from accessing or downloading Patient A medical documents', async () => {
    const VALID_PDF = Buffer.from(
      '%PDF-1.4\n%âãÏÓ\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000015 00000 n\n0000000068 00000 n\n0000000125 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF',
    )
    const docA = await payload.create({
      collection: 'medical-documents' as any,
      user: f.a.doctor,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        uploadedBy: f.a.doctor.id,
        title: 'Sensitive Blood Test',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        status: 'active',
      },
      file: {
        data: VALID_PDF,
        name: 'blood_test.pdf',
        mimetype: 'application/pdf',
        size: VALID_PDF.length,
      },
    })

    // Patient B attempts to query document
    const res = await payload.find({
      collection: 'medical-documents' as any,
      user: patientUserB,
      overrideAccess: false,
    })

    const containsDocA = res.docs.some((d: any) => String(d.id) === String(docA.id))
    expect(containsDocA).toBe(false)
  })
})
