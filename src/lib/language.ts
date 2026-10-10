/**
 * Language Persistence & Cookie Helpers for JeevanCare
 * Supports English (en), Hindi (hi), Malayalam (ml), Tamil (ta), and Telugu (te).
 */

export type LanguageOption = {
  label: string
  code: string
}

export const LANGUAGES: LanguageOption[] = [
  { label: 'English', code: 'en' },
  { label: 'हिन्दी (Hindi)', code: 'hi' },
  { label: 'മലയാളം (Malayalam)', code: 'ml' },
  { label: 'தமிழ் (Tamil)', code: 'ta' },
  { label: 'తెలుగు (Telugu)', code: 'te' },
]

export const DEFAULT_LANGUAGE = LANGUAGES[0]

export function findLanguageByCode(code?: string | null): LanguageOption {
  if (!code) return DEFAULT_LANGUAGE
  const normalized = code.trim().toLowerCase()
  return LANGUAGES.find((l) => l.code === normalized) || DEFAULT_LANGUAGE
}

/**
 * Parses the active language code from a `googtrans` cookie string.
 * Example cookie string: `googtrans=/en/hi` => returns `'hi'`
 */
export function parseGoogtransCookie(cookieStr?: string): string {
  if (!cookieStr) return 'en'
  const match = cookieStr.match(/googtrans=\/en\/([a-z]{2})/i)
  return match ? match[1].toLowerCase() : 'en'
}

/**
 * Generates cookie set/clear strings for `googtrans`.
 */
export function formatGoogtransCookie(code: string, hostname?: string): string[] {
  const norm = code.trim().toLowerCase()
  if (norm === 'en') {
    const cookies = [
      'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;',
    ]
    if (hostname && hostname !== 'localhost') {
      cookies.push(`googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${hostname};`)
    }
    return cookies
  }

  const value = `/en/${norm}`
  const cookies = [`googtrans=${value}; path=/;`]
  if (hostname && hostname !== 'localhost') {
    cookies.push(`googtrans=${value}; path=/; domain=${hostname};`)
  }
  return cookies
}
