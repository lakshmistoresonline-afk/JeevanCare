import { describe, it, expect } from 'vitest'
import {
  saveToLocalDoctorPC,
  readFromLocalDoctorPC,
  verifyDoctorPCAgentStatus,
  getDoctorPCStorageDir,
} from '@/lib/localDocAgent'

describe('Doctor PC Windows Local Storage Companion Agent Suite', () => {
  it('1. Verifies doctor PC workstation storage directory path construction', () => {
    const dir = getDoctorPCStorageDir('tenant_clinic_a', 'doctor_123')
    expect(dir).toContain('tenant_clinic_a')
    expect(dir).toContain('doctor_123')
  })

  it('2. Saves medical PDF document to doctor local PC storage directory and verifies SHA-256 checksum', async () => {
    const dummyPdf = Buffer.from('%PDF-1.4 Fake Medical Scan Data For Unit Test')
    const filename = 'test_doctor_scan.pdf'
    const tenantId = 'tenant_clinic_a'
    const doctorId = 'doctor_123'

    const saveRes = await saveToLocalDoctorPC(dummyPdf, filename, tenantId, doctorId)
    expect(saveRes.ok).toBe(true)
    expect(saveRes.localStoragePath).toBeTruthy()
    expect(saveRes.checksumSha256).toMatch(/^[0-9a-f]{64}$/)
    expect(saveRes.agentId).toContain('agent_win_')

    // Read back and verify
    const readRes = await readFromLocalDoctorPC(saveRes.localStoragePath!)
    expect(readRes.ok).toBe(true)
    expect(readRes.checksumSha256).toBe(saveRes.checksumSha256)
    expect(readRes.buffer?.toString()).toBe(dummyPdf.toString())
  })

  it('3. Prevents path traversal attempts during file retrieval', async () => {
    const invalidPath = '../../../../Windows/System32/cmd.exe'
    const readRes = await readFromLocalDoctorPC(invalidPath)
    expect(readRes.ok).toBe(false)
    expect(readRes.error).toContain('Path traversal')
  })

  it('4. Reports active status and storage directory for loopback agent health check', async () => {
    const status = await verifyDoctorPCAgentStatus()
    expect(status.active).toBe(true)
    expect(status.loopbackPort).toBe(9443)
    expect(status.agentVersion).toBe('1.0.4-win64')
    expect(status.storageDir).toBeTruthy()
  })
})
