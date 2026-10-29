import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET as getReminders } from '@/app/api/cron/appointment-reminders/route'
import { GET as getDigest } from '@/app/api/cron/daily-digest/route'
import { escapeHtml } from '@/lib/utils'
import { sendEmail } from '@/lib/email'
import { runDailyDigest } from '@/lib/digest'

// Mock payload and external mail/sms services
vi.mock('@/lib/auth', () => ({
  getPayloadClient: vi.fn().mockResolvedValue({
    find: vi.fn().mockResolvedValue({ docs: [{ id: 'appt_1', patient: { name: '<script>alert("XSS")</script>&\'test\'', phone: '+919847011111', email: 'patient@test.com' }, start: new Date().toISOString() }] }),
  }),
}))

vi.mock('@/lib/sms', () => ({
  sendSms: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ ok: true }),
}))

vi.mock('@/lib/digest', () => ({
  runDailyDigest: vi.fn().mockResolvedValue({ digestsSent: 1 }),
}))

vi.mock('@/lib/verification', () => ({
  purgeExpiredUnverifiedSignups: vi.fn().mockResolvedValue({ purged: [] }),
}))

describe('Cron Endpoint Authentication & HTML Safety Comprehensive Suite', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('escapes HTML-sensitive characters in patient name for email safety', () => {
    const maliciousName = '<script>alert("XSS")</script>&\'test\''
    const escaped = escapeHtml(maliciousName)
    expect(escaped).not.toContain('<script>')
    expect(escaped).toContain('&lt;script&gt;')
    expect(escaped).toContain('&amp;')
    expect(escaped).toContain('&#039;')
  })

  it('appointment-reminders returns 401 when CRON_SECRET is missing, empty, short, or placeholder in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    // 1. Missing secret
    vi.stubEnv('CRON_SECRET', '')
    let req = new Request('http://localhost/api/cron/appointment-reminders', { headers: { authorization: 'Bearer some-secret-32-chars-long-here-ok' } })
    let res = await getReminders(req)
    expect(res.status).toBe(401)

    // 2. Whitespace secret
    vi.stubEnv('CRON_SECRET', '   ')
    res = await getReminders(req)
    expect(res.status).toBe(401)

    // 3. Short secret (<32 chars)
    vi.stubEnv('CRON_SECRET', 'short-secret')
    res = await getReminders(req)
    expect(res.status).toBe(401)

    // 4. Placeholder secret
    vi.stubEnv('CRON_SECRET', 'jeevancare-cron-secret')
    res = await getReminders(req)
    expect(res.status).toBe(401)
  })

  it('appointment-reminders returns 401 when authorization header is missing', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CRON_SECRET', 'super-secure-production-cron-secret-2026-xyz')

    let req = new Request('http://localhost/api/cron/appointment-reminders')
    let res = await getReminders(req)
    expect(res.status).toBe(401)
  })

  it('appointment-reminders returns 401 when bearer token is incorrect', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CRON_SECRET', 'super-secure-production-cron-secret-2026-xyz')

    const req = new Request('http://localhost/api/cron/appointment-reminders', {
      headers: { authorization: 'Bearer wrong-token' },
    })

    const res = await getReminders(req)
    expect(res.status).toBe(401)
  })

  it('appointment-reminders succeeds with valid token and inspects actual mailer call for HTML escaping', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const secret = 'super-secure-production-cron-secret-2026-xyz'
    vi.stubEnv('CRON_SECRET', secret)

    const req = new Request('http://localhost/api/cron/appointment-reminders', {
      headers: { authorization: `Bearer ${secret}` },
    })

    const res = await getReminders(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)

    // Inspect mocked sendEmail call arguments
    expect(sendEmail).toHaveBeenCalled()
    const emailCallArgs = vi.mocked(sendEmail).mock.calls[0][0] as any
    expect(emailCallArgs.html).not.toContain('<script>')
    expect(emailCallArgs.html).toContain('&lt;script&gt;')
  })

  it('daily-digest returns 401 when CRON_SECRET is missing or invalid in production', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('CRON_SECRET', 'super-secure-production-cron-secret-2026-xyz')

    const req = new Request('http://localhost/api/cron/daily-digest', {
      headers: { authorization: 'Bearer wrong-secret' },
    })

    const res = await getDigest(req)
    expect(res.status).toBe(401)
  })

  it('daily-digest succeeds with valid token', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const secret = 'super-secure-production-cron-secret-2026-xyz'
    vi.stubEnv('CRON_SECRET', secret)

    const req = new Request('http://localhost/api/cron/daily-digest', {
      headers: { authorization: `Bearer ${secret}` },
    })

    const res = await getDigest(req)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
  })

  it('daily-digest returns generic 500 when main digest fails without leaking stack traces', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const secret = 'super-secure-production-cron-secret-2026-xyz'
    vi.stubEnv('CRON_SECRET', secret)

    vi.mocked(runDailyDigest).mockRejectedValueOnce(new Error('Digest SQL failure: sensitive_conn_info'))

    const req = new Request('http://localhost/api/cron/daily-digest', {
      headers: { authorization: `Bearer ${secret}` },
    })

    const res = await getDigest(req)
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(json.error).not.toContain('sensitive_conn_info')
    expect(json.error).toBe('Internal server error during daily digest execution')
  })

  it('appointment-reminders returns generic 500 when internal dependency fails without leaking stack traces', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const secret = 'super-secure-production-cron-secret-2026-xyz'
    vi.stubEnv('CRON_SECRET', secret)

    const { getPayloadClient } = await import('@/lib/auth')
    vi.mocked(getPayloadClient).mockRejectedValueOnce(new Error('Database connection failed: secret_db_conn_string_xyz'))

    const req = new Request('http://localhost/api/cron/appointment-reminders', {
      headers: { authorization: `Bearer ${secret}` },
    })

    const res = await getReminders(req)
    const json = await res.json()
    expect(res.status).toBe(500)
    expect(json.error).not.toContain('secret_db_conn_string_xyz')
    expect(json.error).toBe('Internal server error during appointment reminders execution')
  })
})
