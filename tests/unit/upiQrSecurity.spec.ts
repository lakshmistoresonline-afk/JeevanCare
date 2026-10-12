import { describe, it, expect } from 'vitest'

const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/

describe('UPI QR Code & Security Hardening Unit Suite', () => {
  it('validates authentic UPI ID formats', () => {
    expect(UPI_ID_REGEX.test('clinicname@upi')).toBe(true)
    expect(UPI_ID_REGEX.test('doctor.suresh@okicici')).toBe(true)
    expect(UPI_ID_REGEX.test('9847011111@ybl')).toBe(true)
  })

  it('rejects invalid or malicious UPI ID strings', () => {
    expect(UPI_ID_REGEX.test('<script>alert(1)</script>')).toBe(false)
    expect(UPI_ID_REGEX.test('javascript:alert(1)')).toBe(false)
    expect(UPI_ID_REGEX.test('invalid-upi-id-without-at')).toBe(false)
    expect(UPI_ID_REGEX.test('')).toBe(false)
  })
})
