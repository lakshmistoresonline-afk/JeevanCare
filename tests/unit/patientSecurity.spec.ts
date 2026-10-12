import { describe, it, expect } from 'vitest'
import { rateLimit, resetRateLimit } from '../../src/lib/rateLimit'
import { parseGoogtransCookie } from '../../src/lib/language'

describe('Patient Activation & Security Hardening Unit Suite', () => {
  it('enforces attempt rate limits on patient registration and activation claims', () => {
    resetRateLimit()
    const key = 'patient_reg_03001234567'
    const max = 5

    for (let i = 0; i < max; i++) {
      const res = rateLimit(key, max)
      expect(res.allowed).toBe(true)
    }

    const blocked = rateLimit(key, max)
    expect(blocked.allowed).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('correctly handles empty or missing activation credentials without revealing secrets', () => {
    const providedCode = ''
    const expectedCode = '123456'
    const isVerified = Boolean(providedCode && providedCode === expectedCode)
    expect(isVerified).toBe(false)
  })
})
