import { describe, it, expect } from 'vitest'
import { checkTestDatabaseSafety, getDatabaseNameFromUrl } from '../int/fixtures'

describe('Fail-Closed Test Database Safety Guard Suite', () => {
  it('correctly parses database names from MongoDB URIs', () => {
    expect(getDatabaseNameFromUrl('mongodb://127.0.0.1:27017/jeevancare?replicaSet=rs0')).toBe('jeevancare')
    expect(getDatabaseNameFromUrl('mongodb://localhost:27017/jeevancare_test?replicaSet=rs0')).toBe('jeevancare_test')
    expect(getDatabaseNameFromUrl('mongodb+srv://user:pass@cluster.mongodb.net/production?retryWrites=true')).toBe('production')
    expect(getDatabaseNameFromUrl('invalid-uri')).toBeNull()
    expect(getDatabaseNameFromUrl('')).toBeNull()
  })

  it('rejects protected UAT/Production database jeevancare', () => {
    const res = checkTestDatabaseSafety('mongodb://127.0.0.1:27017/jeevancare?replicaSet=rs0')
    expect(res.ok).toBe(false)
    expect(res.dbName).toBe('jeevancare')
    expect(res.reason).toContain("Database 'jeevancare' is a protected UAT/Production database")
  })

  it('rejects databases named production or prod', () => {
    const res1 = checkTestDatabaseSafety('mongodb://localhost:27017/production')
    expect(res1.ok).toBe(false)
    expect(res1.reason).toContain('protected UAT/Production database')

    const res2 = checkTestDatabaseSafety('mongodb://localhost:27017/prod')
    expect(res2.ok).toBe(false)
    expect(res2.reason).toContain('protected UAT/Production database')
  })

  it('rejects empty, missing, or unparseable database URLs', () => {
    const res1 = checkTestDatabaseSafety('')
    expect(res1.ok).toBe(false)
    expect(res1.reason).toContain('DATABASE_URL environment variable is empty or undefined')

    const res2 = checkTestDatabaseSafety('mongodb://127.0.0.1:27017')
    expect(res2.ok).toBe(false)
    expect(res2.reason).toContain('Could not parse database name from DATABASE_URL')
  })

  it('rejects unapproved database names', () => {
    const res = checkTestDatabaseSafety('mongodb://127.0.0.1:27017/random_db')
    expect(res.ok).toBe(false)
    expect(res.reason).toContain("is not in approved dedicated test database allowlist")
  })

  it('accepts explicitly approved dedicated test database jeevancare_test when configured and live match', () => {
    const mockPayload = {
      db: {
        connection: {
          db: { databaseName: 'jeevancare_test' },
          name: 'jeevancare_test',
        },
      },
    } as any

    const res = checkTestDatabaseSafety('mongodb://127.0.0.1:27017/jeevancare_test?replicaSet=rs0', mockPayload)
    expect(res.ok).toBe(true)
    expect(res.dbName).toBe('jeevancare_test')
    expect(res.liveDbName).toBe('jeevancare_test')
  })

  it('rejects when live connected database name cannot be obtained on payload instance', () => {
    const mockEmptyPayload = {
      db: {
        connection: {},
      },
    } as any

    const res = checkTestDatabaseSafety('mongodb://127.0.0.1:27017/jeevancare_test?replicaSet=rs0', mockEmptyPayload)
    expect(res.ok).toBe(false)
    expect(res.reason).toContain('Live connected database name could not be verified on the Payload instance')
  })

  it('rejects when live connected database points to protected jeevancare even if env url says jeevancare_test', () => {
    const mockMismatchedPayload = {
      db: {
        connection: {
          db: { databaseName: 'jeevancare' },
        },
      },
    } as any

    const res = checkTestDatabaseSafety('mongodb://127.0.0.1:27017/jeevancare_test?replicaSet=rs0', mockMismatchedPayload)
    expect(res.ok).toBe(false)
    expect(res.reason).toContain("Connected live database 'jeevancare' is a protected UAT/Production database")
  })

  it('rejects when configured and live connected database names do not match', () => {
    const mockMismatchedPayload = {
      db: {
        connection: {
          db: { databaseName: 'other_db' },
        },
      },
    } as any

    const res = checkTestDatabaseSafety('mongodb://127.0.0.1:27017/jeevancare_test?replicaSet=rs0', mockMismatchedPayload)
    expect(res.ok).toBe(false)
    expect(res.reason).toContain("is not in approved dedicated test database allowlist")
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
          db: { databaseName: 'jeevancare' },
        },
      },
    } as any

    await expect(wipe(mockProtectedPayload)).rejects.toThrow('INTEGRATION TEST SAFETY GUARD BLOCK')
    expect(deleteCallCount).toBe(0)
  })
})
