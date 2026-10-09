import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkSeedSafety } from '../../src/seedTest'

describe('checkSeedSafety', () => {
  const origNodeEnv = process.env.NODE_ENV
  const origDbUrl = process.env.DATABASE_URL
  const origForceSeed = process.env.FORCE_SEED

  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('refuses in production without FORCE_SEED', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/test-db')
    vi.stubEnv('FORCE_SEED', '')
    const result = checkSeedSafety()
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('production')
  })

  it('allows in production with FORCE_SEED=1 and test DB marker', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/test-db')
    vi.stubEnv('FORCE_SEED', '1')
    const result = checkSeedSafety()
    expect(result.ok).toBe(true)
  })

  it('refuses when DATABASE_URL has no test marker', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('DATABASE_URL', 'mongodb://prod-server:27017/jeevancare-prod')
    const result = checkSeedSafety()
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('test marker')
  })

  it('refuses when DATABASE_URL is empty', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('DATABASE_URL', '')
    const result = checkSeedSafety()
    expect(result.ok).toBe(false)
    expect(result.reason).toContain('test marker')
  })

  it('allows in development with a test-marker DB URL', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/jeevancare-test')
    const result = checkSeedSafety()
    expect(result.ok).toBe(true)
  })

  it('allows with uat marker', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/jeevancare-uat')
    const result = checkSeedSafety()
    expect(result.ok).toBe(true)
  })

  it('allows with sandbox marker', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/sandbox-instance')
    const result = checkSeedSafety()
    expect(result.ok).toBe(true)
  })

  it('allows with dev marker', () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('DATABASE_URL', 'mongodb://localhost:27017/dev-db')
    const result = checkSeedSafety()
    expect(result.ok).toBe(true)
  })
})
