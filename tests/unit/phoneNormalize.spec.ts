import { describe, it, expect } from 'vitest'
import { normalizePhone } from '../../src/lib/phone'

describe('normalizePhone', () => {
  it('strips spaces and dashes', () => {
    expect(normalizePhone('+91 98470 11111')).toBe('+919847011111')
    expect(normalizePhone('98470-11111')).toBe('9847011111')
  })

  it('preserves leading +', () => {
    expect(normalizePhone('+91 98470 11111')).toBe('+919847011111')
    expect(normalizePhone('+1 (555) 123-4567')).toBe('+15551234567')
  })

  it('handles plain digits without +', () => {
    expect(normalizePhone('9847011111')).toBe('9847011111')
  })

  it('trims whitespace', () => {
    expect(normalizePhone('  +91 98470 11111  ')).toBe('+919847011111')
  })

  it('removes parentheses', () => {
    expect(normalizePhone('+91 (98470) 11111')).toBe('+919847011111')
  })

  it('same input produces same output as Patients.ts normalizer', () => {
    // Verify the shared normalizer matches what Patients.ts used to inline
    const raw = '+91 98470-11111'
    const expected = '+919847011111'
    expect(normalizePhone(raw)).toBe(expected)
  })
})
