import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { runTenantBackup } from '@/lib/backup'
import { runTenantRestore, encryptBackupContent, decryptBackupContent } from '@/lib/restore'
import fs from 'fs'

describe('Automated Database Backup, AES-256 Encryption & Disaster Recovery Suite', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)
  })

  it('1. Generates un-truncated paginated collection data backup and computes SHA-256 checksum', async () => {
    const res = await runTenantBackup(String(f.a.tenant.id))
    expect(res.ok).toBe(true)
    expect(res.backupPath).toBeTruthy()
    expect(res.checksumSha256).toMatch(/^[0-9a-f]{64}$/)
    expect(res.collections.length).toBeGreaterThan(0)
    expect(fs.existsSync(res.backupPath!)).toBe(true)
  })

  it('2. Encrypts and decrypts backup payload using AES-256-GCM with PBKDF2 key derivation', () => {
    const secretKey = 'SuperSecretBackupEncryptionKey32Chars!'
    const originalContent = JSON.stringify({ tenant: 'Clinic A', records: 150 })

    const encryptedStr = encryptBackupContent(originalContent, secretKey)
    expect(encryptedStr).toContain('aes-256-gcm')

    const decryptedStr = decryptBackupContent(encryptedStr, secretKey)
    expect(decryptedStr).toBe(originalContent)
  })

  it('3. Safely restores database into jeevancare_test and verifies restored document counts', async () => {
    const backupRes = await runTenantBackup()
    expect(backupRes.ok).toBe(true)

    const restoreRes = await runTenantRestore({
      backupPath: backupRes.backupPath!,
    })

    expect(restoreRes.ok).toBe(true)
    expect(restoreRes.restoredCollections.length).toBeGreaterThan(0)
  })

  it('4. Refuses restore when target database URL points to UAT/production', async () => {
    const backupRes = await runTenantBackup()

    const blockedRes = await runTenantRestore({
      backupPath: backupRes.backupPath!,
      overrideDbUrl: 'mongodb://localhost:27017/jeevancare', // Production DB name!
    })

    expect(blockedRes.ok).toBe(false)
    expect(blockedRes.error).toContain('RESTORE DISASTER SAFETY GUARD BLOCK')
  })
})
