// Shared Fail-Closed Database Safety & Isolation Guard (v3 spec §1.1)
import type { Payload } from 'payload'

export const APPROVED_TEST_DB_NAMES = ['jeevancare_test', 'jeevancare-test', 'jeevancare_test_db'] as const
export const PROHIBITED_DB_NAMES = ['jeevancare', 'production', 'prod', 'jeevancare_prod', 'jeevancare_uat'] as const

/** Approved dedicated test hosts (exact match only — no wildcarding or suffix matching) */
const APPROVED_TEST_HOSTS = ['localhost', '127.0.0.1'] as const

/** Parse database name and hosts from MongoDB connection string safely with rigorous syntax validation */
export function parseMongoUrl(urlStr: string): { dbName: string | null; hosts: string[]; valid: boolean } {
  if (!urlStr || typeof urlStr !== 'string') return { dbName: null, hosts: [], valid: false }
  try {
    const cleanUrl = urlStr.trim()
    if (!cleanUrl.startsWith('mongodb://') && !cleanUrl.startsWith('mongodb+srv://')) {
      return { dbName: null, hosts: [], valid: false }
    }

    if (/\s/.test(cleanUrl) || cleanUrl.includes('#')) {
      return { dbName: null, hosts: [], valid: false }
    }

    const [urlWithoutQuery, queryString] = cleanUrl.split('?')
    if (queryString !== undefined && !queryString.trim()) {
      return { dbName: null, hosts: [], valid: false }
    }

    const pathParts = urlWithoutQuery.replace(/^mongodb(?:\+srv)?:\/\//i, '').split('/')
    if (pathParts.length < 2) {
      return { dbName: null, hosts: [], valid: false }
    }

    const dbName = pathParts[pathParts.length - 1].toLowerCase().trim()
    if (!dbName || dbName.includes('@') || dbName.includes(':') || dbName.includes(',')) {
      return { dbName: null, hosts: [], valid: false }
    }

    const authority = pathParts[0]
    if (!authority) {
      return { dbName: null, hosts: [], valid: false }
    }

    const hostPortSection = authority.includes('@') ? authority.split('@').pop()! : authority
    if (!hostPortSection) {
      return { dbName: null, hosts: [], valid: false }
    }

    const hostPortPairs = hostPortSection.split(',')
    const hosts: string[] = []

    for (const hp of hostPortPairs) {
      const trimmedHp = hp.trim()
      if (!trimmedHp) return { dbName: null, hosts: [], valid: false }

      let hostname = ''
      if (trimmedHp.startsWith('[')) {
        const closeBracketIdx = trimmedHp.indexOf(']')
        if (closeBracketIdx === -1) return { dbName: null, hosts: [], valid: false }
        hostname = trimmedHp.slice(1, closeBracketIdx).toLowerCase().trim()
        const remainder = trimmedHp.slice(closeBracketIdx + 1)
        if (remainder) {
          if (!remainder.startsWith(':')) return { dbName: null, hosts: [], valid: false }
          const portStr = remainder.slice(1)
          if (!/^\d+$/.test(portStr)) return { dbName: null, hosts: [], valid: false }
          const port = Number(portStr)
          if (port <= 0 || port > 65535) return { dbName: null, hosts: [], valid: false }
        }
      } else {
        const colonSplit = trimmedHp.split(':')
        hostname = colonSplit[0].toLowerCase().trim()
        if (colonSplit.length > 2) return { dbName: null, hosts: [], valid: false }
        if (colonSplit.length === 2) {
          const portStr = colonSplit[1]
          if (!/^\d+$/.test(portStr)) return { dbName: null, hosts: [], valid: false }
          const port = Number(portStr)
          if (port <= 0 || port > 65535) return { dbName: null, hosts: [], valid: false }
        }
      }

      if (!hostname || hostname.includes('/') || hostname.includes('?')) {
        return { dbName: null, hosts: [], valid: false }
      }
      hosts.push(hostname)
    }

    return { dbName, hosts, valid: true }
  } catch (_) {
    return { dbName: null, hosts: [], valid: false }
  }
}

export function isAllowedTestHost(host: string | null): boolean {
  if (!host) return false
  return APPROVED_TEST_HOSTS.some((h) => host === h)
}

export function getDatabaseNameFromUrl(urlStr: string): string | null {
  return parseMongoUrl(urlStr).dbName
}

export function validateDatabaseUrlSafety(rawUrl?: string): { ok: boolean; reason?: string; dbName?: string } {
  // 1. Unconditional production runtime block
  if (process.env.NODE_ENV === 'production') {
    return { ok: false, reason: 'Refusing operation: Seeding or destructive database actions are unconditionally blocked in production runtime.' }
  }

  const urlToTest = rawUrl ?? process.env.DATABASE_URL ?? ''
  if (!urlToTest) {
    return { ok: false, reason: 'Refusing operation: DATABASE_URL environment variable is empty or undefined.' }
  }

  const parsed = parseMongoUrl(urlToTest)
  if (!parsed.valid || !parsed.dbName || parsed.hosts.length === 0) {
    return { ok: false, reason: 'Refusing operation: MongoDB URI is malformed, ambiguous, or unparseable.' }
  }

  const { dbName, hosts } = parsed

  if (PROHIBITED_DB_NAMES.includes(dbName as any) || dbName === 'jeevancare') {
    return {
      ok: false,
      dbName,
      reason: `Refusing operation: Database '${dbName}' is a protected UAT/Production database.`,
    }
  }

  if (!APPROVED_TEST_DB_NAMES.includes(dbName as any)) {
    return {
      ok: false,
      dbName,
      reason: `Refusing operation: Configured database '${dbName}' is not in approved dedicated test database allowlist (${APPROVED_TEST_DB_NAMES.join(', ')}).`,
    }
  }

  for (const host of hosts) {
    if (!isAllowedTestHost(host)) {
      return {
        ok: false,
        dbName,
        reason: `Refusing operation: Target host '${host}' is not in approved test host policy (${APPROVED_TEST_HOSTS.join(', ')}).`,
      }
    }
  }

  return { ok: true, dbName }
}

export function checkTestDatabaseSafety(rawUrl?: string, payload?: Payload): { ok: boolean; reason?: string; dbName?: string; liveDbName?: string } {
  const urlSafety = validateDatabaseUrlSafety(rawUrl)
  if (!urlSafety.ok) {
    return { ok: false, reason: urlSafety.reason, dbName: urlSafety.dbName }
  }

  const dbName = urlSafety.dbName!
  if (payload) {
    return checkDestructiveDatabaseSafety(payload, rawUrl)
  }

  return { ok: true, dbName }
}

export function checkDestructiveDatabaseSafety(payload: Payload, rawUrl?: string): { ok: boolean; reason?: string; dbName?: string; liveDbName?: string } {
  if (!payload || !payload.db) {
    return { ok: false, reason: 'Refusing destructive operation: Valid Payload instance with active database connection is strictly required.' }
  }

  const urlSafety = validateDatabaseUrlSafety(rawUrl)
  if (!urlSafety.ok) {
    return { ok: false, reason: urlSafety.reason, dbName: urlSafety.dbName }
  }
  const dbName = urlSafety.dbName!

  const liveDbName = ((payload.db as any)?.connection?.db?.databaseName || (payload.db as any)?.connection?.name || '').toLowerCase().trim()
  if (!liveDbName) {
    return {
      ok: false,
      dbName,
      reason: 'Refusing destructive operation: Live connected database name could not be verified on the Payload instance.',
    }
  }

  const liveHost = ((payload.db as any)?.connection?.host || (payload.db as any)?.connection?.client?.options?.host || '').toLowerCase().trim()
  if (!liveHost || !isAllowedTestHost(liveHost)) {
    return {
      ok: false,
      dbName,
      reason: `Refusing destructive operation: Live connected host identity '${liveHost || 'missing'}' is not in approved test host policy.`,
    }
  }

  if (PROHIBITED_DB_NAMES.includes(liveDbName as any) || liveDbName === 'jeevancare') {
    return {
      ok: false,
      dbName,
      liveDbName,
      reason: `Refusing destructive operation: Connected live database '${liveDbName}' is a protected UAT/Production database.`,
    }
  }

  if (!APPROVED_TEST_DB_NAMES.includes(liveDbName as any)) {
    return {
      ok: false,
      dbName,
      liveDbName,
      reason: `Refusing destructive operation: Connected live database '${liveDbName}' is not in approved dedicated test database allowlist.`,
    }
  }

  if (dbName !== liveDbName) {
    return {
      ok: false,
      dbName,
      liveDbName,
      reason: `Refusing destructive operation: Configured database name ('${dbName}') does not match live connected database name ('${liveDbName}').`,
    }
  }

  return { ok: true, dbName, liveDbName }
}

export function validateE2EDatabaseUrl(rawUrl?: string): string {
  const res = validateDatabaseUrlSafety(rawUrl)
  if (!res.ok) {
    throw new Error(`PLAYWRIGHT E2E SAFETY BLOCK: ${res.reason}`)
  }
  return rawUrl ?? process.env.DATABASE_URL ?? ''
}
