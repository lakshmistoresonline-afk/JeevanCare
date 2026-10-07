import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { validateFileMagicBytes, computeSha256, sanitizePathFilename } from '@/lib/fileSecurity'
import { relId } from '@/lib/utils'

describe('Medical Document Security & File Validation Suite', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)
  })

  // Valid Magic Byte Buffers
  const VALID_PDF = Buffer.from('%PDF-1.4 Header Content for Medical Report Sample Data')
  const VALID_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x00, 0x01])
  const VALID_PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52])

  // Malicious / Invalid Buffers
  const MALICIOUS_EXE = Buffer.from('4d5a90000300000004000000ffff0000b8000000000000004000000000000000', 'hex')
  const SCRIPT_BYTES = Buffer.from('<script>alert("xss")</script>')

  // =========================================================================
  // 1. MAGIC BYTE & FILE CONTENT VALIDATION
  // =========================================================================

  it('validates authentic PDF, JPEG, PNG buffers via magic bytes', () => {
    expect(validateFileMagicBytes(VALID_PDF).valid).toBe(true)
    expect(validateFileMagicBytes(VALID_PDF).mime).toBe('application/pdf')

    expect(validateFileMagicBytes(VALID_JPEG).valid).toBe(true)
    expect(validateFileMagicBytes(VALID_JPEG).mime).toBe('image/jpeg')

    expect(validateFileMagicBytes(VALID_PNG).valid).toBe(true)
    expect(validateFileMagicBytes(VALID_PNG).mime).toBe('image/png')
  })

  it('rejects executable content and script tags disguised with image/pdf extension', () => {
    expect(validateFileMagicBytes(MALICIOUS_EXE).valid).toBe(false)
    expect(validateFileMagicBytes(SCRIPT_BYTES).valid).toBe(false)
  })

  it('rejects upload of malicious executable bytes disguised as PDF via collection hook', async () => {
    const uploadAttempt = payload.create({
      collection: 'medical-documents' as any,
      user: f.a.doctor,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Malicious Report',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        status: 'active',
      },
      file: {
        data: MALICIOUS_EXE,
        name: 'report.pdf',
        mimetype: 'application/pdf',
        size: MALICIOUS_EXE.length,
      },
    })

    await expect(uploadAttempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 2. OVERSIZED FILE REJECTION (>10MB)
  // =========================================================================

  it('rejects upload of oversized files exceeding the 10MB limit', async () => {
    const oversizedBuffer = Buffer.alloc(11 * 1024 * 1024, 0x25) // 11MB
    // Make first bytes valid PDF header
    VALID_PDF.copy(oversizedBuffer, 0)

    const uploadAttempt = payload.create({
      collection: 'medical-documents' as any,
      user: f.a.doctor,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Oversized Scan',
        documentType: 'X_RAY',
        documentDate: new Date().toISOString(),
        status: 'active',
      },
      file: {
        data: oversizedBuffer,
        name: 'large_scan.pdf',
        mimetype: 'application/pdf',
        size: oversizedBuffer.length,
      },
    })

    await expect(uploadAttempt).rejects.toBeTruthy()
  })

  // =========================================================================
  // 3. PATH TRAVERSAL PREVENTATIVE SANITIZATION
  // =========================================================================

  it('sanitizes untrusted filenames and removes path traversal patterns', () => {
    expect(sanitizePathFilename('../../etc/passwd')).toBe('passwd')
    expect(sanitizePathFilename('..\\..\\windows\\system32\\cmd.exe')).toBe('cmd.exe')
    expect(sanitizePathFilename('report\0.pdf')).toBe('report.pdf')
  })

  // =========================================================================
  // 4. SHA-256 CHECKSUM COMPUTATION
  // =========================================================================

  it('computes accurate SHA-256 checksum on document upload', async () => {
    const expectedHash = computeSha256(VALID_PDF)

    const doc = await payload.create({
      collection: 'medical-documents' as any,
      user: f.a.doctor,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.a.patient.id,
        title: 'Valid PDF Report',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        status: 'active',
      },
      file: {
        data: VALID_PDF,
        name: 'report.pdf',
        mimetype: 'application/pdf',
        size: VALID_PDF.length,
      },
    })

    expect(doc.checksum).toBe(expectedHash)
  })

  // =========================================================================
  // 5. CROSS-TENANT & CROSS-PATIENT RELATIONSHIP VALIDATION
  // =========================================================================

  it('rejects attaching a document to a patient belonging to another clinic', async () => {
    const attempt = payload.create({
      collection: 'medical-documents' as any,
      user: f.a.doctor,
      overrideAccess: false,
      data: {
        tenant: f.a.tenant.id,
        patient: f.b.patient.id, // Patient from Clinic B
        title: 'Cross Tenant Attempt',
        documentType: 'LAB_REPORT',
        documentDate: new Date().toISOString(),
        status: 'active',
      },
      file: {
        data: VALID_PDF,
        name: 'report.pdf',
        mimetype: 'application/pdf',
        size: VALID_PDF.length,
      },
    })

    await expect(attempt).rejects.toBeTruthy()
  })
})
