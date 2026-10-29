import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { validateProductionSecret } from '@/lib/secretValidation'

describe('Production Secret Validation Suite', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows any value in non-production environments', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const res = validateProductionSecret('PAYLOAD_SECRET', '')
    expect(res.ok).toBe(true)
  })

  it('rejects missing or empty secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = validateProductionSecret('PAYLOAD_SECRET', '')
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('missing or empty')
  })

  it('rejects secrets that are too short in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = validateProductionSecret('PAYLOAD_SECRET', 'shortsecret')
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('too short')
  })

  it('rejects known placeholders in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = validateProductionSecret('PAYLOAD_SECRET', 'jeevancare_dev_secret_fallback_key_minimum_32_chars_2026')
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('insecure placeholder')
  })

  it('accepts strong secure secret in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const res = validateProductionSecret('PAYLOAD_SECRET', 'super-secure-production-secret-key-2026-xyz-998877')
    expect(res.ok).toBe(true)
  })
})
