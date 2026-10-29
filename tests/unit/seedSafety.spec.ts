import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkSeedSafety } from '../../src/seedTest'

describe('checkSeedSafety (Strict Fail-Closed Seeder Safety Guard)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('rejects protected UAT/Production database jeevancare even with FORCE_SEED=1', () => {
    vi.stubEnv('DATABASE_URL', 'mongodb://127.0.0.1:27017/jeevancare?replicaSet=rs0')
    vi.stubEnv('FORCE_SEED', '1')
    const result = checkSeedSafety()
    expect(result.ok).toBe(false)
    expect(result.reason).toContain("Database 'jeevancare' is a protected UAT/Production database")
  })

  it('rejects production and unapproved database names', () => {
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/production')
    const result = checkSeedSafety()
    expect(result.ok).toBe(false)
    expect(result.reason).toBeTruthy()
  })

  it('rejects empty or unparseable database URLs', () => {
    vi.stubEnv('DATABASE_URL', '')
    const result1 = checkSeedSafety()
    expect(result1.ok).toBe(false)

    vi.stubEnv('DATABASE_URL', 'invalid-uri')
    const result2 = checkSeedSafety()
    expect(result2.ok).toBe(false)
  })

  it('accepts explicitly approved dedicated test database jeevancare_test', () => {
    vi.stubEnv('DATABASE_URL', 'mongodb://127.0.0.1:27017/jeevancare_test?replicaSet=rs0')
    const result = checkSeedSafety()
    expect(result.ok).toBe(true)
  })
})
