// Production Secret Validation & Fail-Closed Guard (v3 spec §2.1)

const KNOWN_PLACEHOLDERS = [
  '',
  'CHANGEME',
  'YOUR_SECRET_HERE',
  'SECRET',
  'PAYLOAD_SECRET',
  'CRON_SECRET',
  'jeevancare_dev_secret_fallback_key_minimum_32_chars_2026',
  'jeevancare-cron-secret',
]

export function validateProductionSecret(secretName: string, secretValue?: string, minLength = 32): { ok: boolean; reason?: string } {
  if (process.env.NODE_ENV !== 'production') {
    return { ok: true }
  }

  if (!secretValue || !secretValue.trim()) {
    return { ok: false, reason: `Production startup failed: Required environment variable ${secretName} is missing or empty.` }
  }

  const clean = secretValue.trim()
  if (clean.length < minLength) {
    return { ok: false, reason: `Production startup failed: Environment variable ${secretName} is too short (must be at least ${minLength} characters).` }
  }

  const upperClean = clean.toUpperCase()
  if (KNOWN_PLACEHOLDERS.some((p) => p && upperClean === p.toUpperCase())) {
    return { ok: false, reason: `Production startup failed: Environment variable ${secretName} uses a known insecure placeholder or default value.` }
  }

  return { ok: true }
}
