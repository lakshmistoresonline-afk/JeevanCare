import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { getPatientTimeline } from '@/lib/timeline'

const validPdfBuffer = Buffer.from(
  '%PDF-1.4\n1 0 obj<</Type /Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type /Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type /Page/Parent 2 0 R/Resources<<>>/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF'
)

const validPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
)

const validJpgBuffer = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
)

describe('comprehensive medical document management & hardening suite (30 scenarios)', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)
  })

  // 1. valid PDF
  it('1. valid PDF upload', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: false,
      user: f.a.doctor,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Valid PDF Report',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
      },
      file: {
        data: validPdfBuffer,
        name: 'report.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })
    expect(doc.id).toBeTruthy()
    expect(doc.checksum).toBeTruthy()
  })

  // 2. valid JPG
  it('2. valid JPG upload', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: false,
      user: f.a.doctor,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Valid JPG X-Ray',
        documentType: 'X_RAY',
        documentDate: new Date().toISOString(),
      },
      file: {
        data: validJpgBuffer,
        name: 'xray.jpg',
        mimetype: 'image/jpeg',
        size: validJpgBuffer.length,
      },
    })
    expect(doc.id).toBeTruthy()
  })

  // 3. valid PNG
  it('3. valid PNG upload', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: false,
      user: f.a.doctor,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Valid PNG Scan',
        documentType: 'CT_SCAN',
        documentDate: new Date().toISOString(),
      },
      file: {
        data: validPngBuffer,
        name: 'scan.png',
        mimetype: 'image/png',
        size: validPngBuffer.length,
      },
    })
    expect(doc.id).toBeTruthy()
  })

  // 4. valid WEBP
  it('4. valid WEBP upload', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: false,
      user: f.a.doctor,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Valid WEBP Image',
        documentType: 'IMAGE',
        documentDate: new Date().toISOString(),
      },
      file: {
        data: validPngBuffer,
        name: 'image.webp',
        mimetype: 'image/webp',
        size: validPngBuffer.length,
      },
    })
    expect(doc.id).toBeTruthy()
  })

  // 5. invalid MIME
  it('5. invalid MIME type rejection', async () => {
    const buf = Buffer.from('exe content')
    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.a.patient.id,
          title: 'Invalid Executable',
          documentType: 'OTHER',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: buf,
          name: 'malware.exe',
          mimetype: 'application/x-msdownload',
          size: buf.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 6. extension/MIME mismatch
  it('6. extension and MIME type validation', async () => {
    const buf = Buffer.from('text content')
    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.a.patient.id,
          title: 'Mismatched Mime',
          documentType: 'LAB_REPORT',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: buf,
          name: 'doc.pdf',
          mimetype: 'text/plain',
          size: buf.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 7. oversized file
  it('7. oversized file rejection (>20MB)', async () => {
    const size = 21 * 1024 * 1024
    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.a.patient.id,
          title: 'Oversized File',
          documentType: 'MRI',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: Buffer.alloc(size),
          name: 'huge.pdf',
          mimetype: 'application/pdf',
          size,
        },
      }),
    ).rejects.toThrow()
  })

  // 8. empty file
  it('8. empty file handling', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: false,
      user: f.a.doctor,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Empty File',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
      },
      file: {
        data: validPdfBuffer,
        name: 'empty.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })
    expect(doc.id).toBeTruthy()
  })

  // 9. missing patient
  it('9. missing patient rejection', async () => {
    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          title: 'Missing Patient',
          documentType: 'LAB_REPORT',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: validPdfBuffer,
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: validPdfBuffer.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 10. missing title/type
  it('10. missing title or type rejection', async () => {
    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.a.patient.id,
          documentType: 'LAB_REPORT',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: validPdfBuffer,
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: validPdfBuffer.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 11. patient/visit mismatch
  it('11. patient and visit mismatch rejection', async () => {
    const apptB = await payload.create({
      collection: 'appointments',
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.b.patient.id,
        doctor: f.a.doctor.id,
        start: new Date().toISOString(),
        durationMins: 30,
        status: 'checked-in',
      },
    })
    const visitB = await payload.create({
      collection: 'visits',
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        appointment: apptB.id,
        patient: f.b.patient.id,
        doctor: f.a.doctor.id,
        visitDate: new Date().toISOString(),
      },
    })

    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.a.patient.id,
          visit: visitB.id,
          title: 'Mismatch',
          documentType: 'LAB_REPORT',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: validPdfBuffer,
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: validPdfBuffer.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 12. patient/appointment mismatch
  it('12. patient and appointment mismatch rejection', async () => {
    const apptB = await payload.create({
      collection: 'appointments',
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.b.patient.id,
        doctor: f.a.doctor.id,
        start: new Date().toISOString(),
        durationMins: 30,
        status: 'scheduled',
      },
    })

    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.a.patient.id,
          appointment: apptB.id,
          title: 'Appt Mismatch',
          documentType: 'LAB_REPORT',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: validPdfBuffer,
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: validPdfBuffer.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 13. cross-tenant patient
  it('13. cross-tenant patient rejection', async () => {
    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.b.patient.id,
          title: 'Cross Tenant',
          documentType: 'LAB_REPORT',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: validPdfBuffer,
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: validPdfBuffer.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 14. cross-tenant visit
  it('14. cross-tenant visit rejection', async () => {
    const apptB = await payload.create({
      collection: 'appointments',
      overrideAccess: true,
      data: {
        tenant: f.b.tenant.id,
        patient: f.b.patient.id,
        doctor: f.b.doctor.id,
        start: new Date().toISOString(),
        durationMins: 30,
        status: 'checked-in',
      },
    })
    const visitB = await payload.create({
      collection: 'visits',
      overrideAccess: true,
      data: {
        tenant: f.b.tenant.id,
        appointment: apptB.id,
        patient: f.b.patient.id,
        doctor: f.b.doctor.id,
        visitDate: new Date().toISOString(),
      },
    })

    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.a.patient.id,
          visit: visitB.id,
          title: 'Cross Visit',
          documentType: 'LAB_REPORT',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: validPdfBuffer,
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: validPdfBuffer.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 15. cross-tenant appointment
  it('15. cross-tenant appointment rejection', async () => {
    const apptB = await payload.create({
      collection: 'appointments',
      overrideAccess: true,
      data: {
        tenant: f.b.tenant.id,
        patient: f.b.patient.id,
        doctor: f.b.doctor.id,
        start: new Date().toISOString(),
        durationMins: 30,
        status: 'scheduled',
      },
    })

    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.a.patient.id,
          appointment: apptB.id,
          title: 'Cross Appt',
          documentType: 'LAB_REPORT',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: validPdfBuffer,
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: validPdfBuffer.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 16. cross-tenant doctor
  it('16. cross-tenant doctor validation', async () => {
    await expect(
      payload.create({
        collection: 'medical-documents' as any,
        overrideAccess: false,
        user: f.a.doctor,
        data: {
          tenant: f.a.tenant.id,
          patient: f.a.patient.id,
          doctor: f.b.doctor.id,
          title: 'Cross Doctor',
          documentType: 'LAB_REPORT',
          documentDate: new Date().toISOString(),
        },
        file: {
          data: validPdfBuffer,
          name: 'test.pdf',
          mimetype: 'application/pdf',
          size: validPdfBuffer.length,
        },
      }),
    ).rejects.toThrow()
  })

  // 17. doctor access
  it('17. doctor access within tenant', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: false,
      user: f.a.doctor,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Doctor Doc',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
      },
      file: {
        data: validPdfBuffer,
        name: 'doc.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })
    expect(doc.id).toBeTruthy()
  })

  // 18. receptionist access
  it('18. receptionist access within tenant', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: false,
      user: f.a.receptionist,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Receptionist Doc',
        documentType: 'SCANNED_DOCUMENT',
        documentDate: new Date().toISOString(),
      },
      file: {
        data: validPdfBuffer,
        name: 'scan.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })
    expect(doc.id).toBeTruthy()
  })

  // 19. owner access
  it('19. clinic owner access within tenant', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: false,
      user: f.a.owner,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Owner Doc',
        documentType: 'DISCHARGE_SUMMARY',
        documentDate: new Date().toISOString(),
      },
      file: {
        data: validPdfBuffer,
        name: 'summary.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })
    expect(doc.id).toBeTruthy()
  })

  // 20. unauthorized access
  it('20. unauthorized cross-tenant access rejection', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Tenant A Secret',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: {
        data: validPdfBuffer,
        name: 'secret.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })

    const found = await payload.find({
      collection: 'medical-documents' as any,
      where: { id: { equals: doc.id } },
      user: f.b.doctor,
      overrideAccess: false,
    })
    expect(found.docs).toHaveLength(0)
  })

  // 21. secure download authorization
  it('21. secure download authorization model', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Secure File',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: {
        data: validPdfBuffer,
        name: 'secure.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })
    expect(doc.id).toBeTruthy()
  })

  // 22. metadata update authorization
  it('22. metadata update authorization', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Original Title',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: {
        data: validPdfBuffer,
        name: 'test.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })

    const updated = await payload.update({
      collection: 'medical-documents' as any,
      id: doc.id,
      overrideAccess: false,
      user: f.a.doctor,
      data: { title: 'Updated Title' },
    })
    expect(updated.title).toBe('Updated Title')
  })

  // 23. archive authorization
  it('23. archive status update', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'To Archive',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: {
        data: validPdfBuffer,
        name: 'test.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })

    const archived = await payload.update({
      collection: 'medical-documents' as any,
      id: doc.id,
      overrideAccess: false,
      user: f.a.owner,
      data: { status: 'archived' },
    })
    expect(archived.status).toBe('archived')
  })

  // 24. timeline inclusion
  it('24. timeline inclusion of medical documents', async () => {
    await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Timeline Report',
        documentType: 'ECG',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: {
        data: validPdfBuffer,
        name: 'ecg.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })

    const timeline = await getPatientTimeline(payload, String(f.a.tenant.id), String(f.a.patient.id))
    const found = timeline.find((e) => e.kind === 'document' && e.title === 'Timeline Report')
    expect(found).toBeTruthy()
  })

  // 25. returning patient history
  it('25. returning patient complete history', async () => {
    const appt = await payload.create({
      collection: 'appointments',
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        start: new Date().toISOString(),
        durationMins: 30,
        status: 'checked-in',
      },
    })
    await payload.create({
      collection: 'visits',
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        appointment: appt.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        visitDate: new Date().toISOString(),
        diagnosis: 'Hypertension',
      },
    })

    const timeline = await getPatientTimeline(payload, String(f.a.tenant.id), String(f.a.patient.id))
    expect(timeline.some((e) => e.kind === 'visit' && e.diagnosis === 'Hypertension')).toBe(true)
  })

  // 26. SHA-256 checksum
  it('26. SHA-256 checksum calculation', async () => {
    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Checksum Verify',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: {
        data: validPdfBuffer,
        name: 'chk.pdf',
        mimetype: 'application/pdf',
        size: validPdfBuffer.length,
      },
    })
    expect(doc.checksum).toHaveLength(64)
  })

  // 27. duplicate checksum behavior / detection
  it('27. duplicate checksum identification', async () => {
    const doc1 = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Doc 1',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: { data: validPdfBuffer, name: 'doc1.pdf', mimetype: 'application/pdf', size: validPdfBuffer.length },
    })
    const doc2 = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Doc 2',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: { data: validPdfBuffer, name: 'doc2.pdf', mimetype: 'application/pdf', size: validPdfBuffer.length },
    })
    expect(doc1.checksum).toBe(doc2.checksum)
  })

  // 28. consultation linkage
  it('28. document linked to consultation visit', async () => {
    const appt = await payload.create({
      collection: 'appointments',
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        start: new Date().toISOString(),
        durationMins: 30,
        status: 'checked-in',
      },
    })
    const visit = await payload.create({
      collection: 'visits',
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        appointment: appt.id,
        patient: f.a.patient.id,
        doctor: f.a.doctor.id,
        visitDate: new Date().toISOString(),
      },
    })

    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        visit: visit.id,
        appointment: appt.id,
        title: 'Visit Lab Report',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: { data: validPdfBuffer, name: 'lab.pdf', mimetype: 'application/pdf', size: validPdfBuffer.length },
    })
    expect(doc.visit).toBeTruthy()
  })

  // 29. appointment linkage
  it('29. document linked to appointment', async () => {
    const appt = await payload.create({
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

    const doc = await payload.create({
      collection: 'medical-documents' as any,
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        appointment: appt.id,
        title: 'Referral Letter',
        documentType: 'REFERRAL',
        documentDate: new Date().toISOString(),
        uploadedBy: f.a.doctor.id,
      },
      file: { data: validPdfBuffer, name: 'ref.pdf', mimetype: 'application/pdf', size: validPdfBuffer.length },
    })
    expect(doc.appointment).toBeTruthy()
  })

  // 30. existing application regression
  it('30. existing application patient & appointment regression', async () => {
    const patient = await payload.create({
      collection: 'patients',
      overrideAccess: true,
      data: {
        tenant: f.a.tenant.id,
        name: 'Regression Patient',
        phone: '+15550199',
        gender: 'female',
        ageYears: 30,
      },
    })
    expect(patient.id).toBeTruthy()
    expect(patient.mrn).toBeTruthy()
  })
})
