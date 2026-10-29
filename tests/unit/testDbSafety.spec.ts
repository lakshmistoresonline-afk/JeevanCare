import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { checkTestDatabaseSafety, checkDestructiveDatabaseSafety, parseMongoUrl, validateDatabaseUrlSafety, isAllowedTestHost } from '@/lib/databaseSafety'

describe('Fail-Closed Test Database Safety Guard Suite (P0 Final Closure)', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('correctly parses database names and multi-hosts from complex MongoDB URIs and rejects malformed/unsupported URIs', () => {
    expect(parseMongoUrl('mongodb://user:pass@127.0.0.1:27017,127.0.0.1:27018/jeevancare_test?replicaSet=rs0')).toEqual({
      dbName: 'jeevancare_test',
      hosts: ['127.0.0.1', '127.0.0.1'],
      valid: true,
    })
    expect(parseMongoUrl('malformed-uri-string')).toEqual({
      dbName: null,
      hosts: [],
      valid: false,
    })
    expect(parseMongoUrl('http://unsupported-scheme.com/db')).toEqual({
      dbName: null,
      hosts: [],
      valid: false,
    })
  })

  it('rejects multi-host URIs when any host is unapproved', () => {
    const res = validateDatabaseUrlSafety('mongodb://127.0.0.1:27017,malicious-remote.com:27017/jeevancare_test?replicaSet=rs0')
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('Target host')
  })

  it('rejects protected UAT/Production databases', () => {
    for (const db of ['jeevancare', 'production', 'prod', 'jeevancare_prod', 'jeevancare_uat']) {
      const res = checkTestDatabaseSafety(`mongodb://127.0.0.1:27017/${db}?replicaSet=rs0`)
      expect(res.ok).toBe(false)
      expect(res.reason).toBeTruthy()
    }
  })

  it('rejects unapproved hosts', () => {
    const res = checkTestDatabaseSafety('mongodb://malicious-server.com:27017/jeevancare_test?replicaSet=rs0')
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('Target host')
  })

  it('rejects production environment unconditionally even if FORCE_SEED=1 is provided', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('FORCE_SEED', '1')

    const res = validateDatabaseUrlSafety('mongodb://127.0.0.1:27017/jeevancare_test?replicaSet=rs0')
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('unconditionally blocked in production runtime')
  })

  it('rejects when live connected host is missing or unapproved', () => {
    const mockPayloadMissingHost = {
      db: {
        connection: {
          db: { databaseName: 'jeevancare_test' },
        },
      },
    } as any

    const res1 = checkDestructiveDatabaseSafety(mockPayloadMissingHost, 'mongodb://127.0.0.1:27017/jeevancare_test?replicaSet=rs0')
    expect(res1.ok).toBe(false)
    expect(res1.reason).toContain('Live connected host identity')
  })

  it('rejects when configured and live connected database names do not match', () => {
    const mockPayload = {
      db: {
        connection: {
          host: '127.0.0.1',
          db: { databaseName: 'jeevancare_test_db' },
        },
      },
    } as any

    const res = checkDestructiveDatabaseSafety(mockPayload, 'mongodb://127.0.0.1:27017/jeevancare_test?replicaSet=rs0')
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('does not match live connected database name')
  })

  it('invokes payload.delete ZERO times when safety check fails during wipe(payload)', async () => {
    const { wipe } = await import('../int/fixtures')
    let deleteCallCount = 0
    const mockProtectedPayload = {
      delete: () => {
        deleteCallCount++
        return Promise.resolve({ docs: [], totalDocs: 0 })
      },
      db: {
        connection: {
          host: 'malicious-host.com',
          db: { databaseName: 'jeevancare' },
        },
      },
    } as any

    await expect(wipe(mockProtectedPayload)).rejects.toThrow('INTEGRATION TEST SAFETY GUARD BLOCK')
    expect(deleteCallCount).toBe(0)
  })
})
