import { describe, it, expect } from 'vitest'
import {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  findLanguageByCode,
  parseGoogtransCookie,
  formatGoogtransCookie,
} from '../../src/lib/language'

describe('Language Persistence Helpers', () => {
  it('supports English, Hindi, Malayalam, Tamil, and Telugu', () => {
    const codes = LANGUAGES.map((l) => l.code)
    expect(codes).toEqual(['en', 'hi', 'ml', 'ta', 'te'])
  })

  it('finds language option by code', () => {
    expect(findLanguageByCode('hi').label).toBe('हिन्दी (Hindi)')
    expect(findLanguageByCode('ml').label).toBe('മലയാളം (Malayalam)')
    expect(findLanguageByCode('ta').label).toBe('தமிழ் (Tamil)')
    expect(findLanguageByCode('te').label).toBe('తెలుగు (Telugu)')
    expect(findLanguageByCode('en').label).toBe('English')
    expect(findLanguageByCode('unknown')).toEqual(DEFAULT_LANGUAGE)
  })

  it('parses googtrans cookie correctly', () => {
    expect(parseGoogtransCookie('googtrans=/en/hi')).toBe('hi')
    expect(parseGoogtransCookie('foo=bar; googtrans=/en/ml; baz=1')).toBe('ml')
    expect(parseGoogtransCookie('googtrans=/en/ta')).toBe('ta')
    expect(parseGoogtransCookie('googtrans=/en/te')).toBe('te')
    expect(parseGoogtransCookie('')).toBe('en')
    expect(parseGoogtransCookie(undefined)).toBe('en')
  })

  it('formats googtrans cookie strings for setting non-English languages', () => {
    const cookies = formatGoogtransCookie('hi')
    expect(cookies[0]).toContain('googtrans=/en/hi; path=/;')
  })

  it('formats googtrans cookie strings for clearing/restoring English', () => {
    const cookies = formatGoogtransCookie('en')
    expect(cookies[0]).toContain('googtrans=; expires=Thu, 01 Jan 1970')
  })
})
