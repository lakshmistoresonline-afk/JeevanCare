/** Strip spaces/dashes; keep leading + and digits. Market-agnostic. */
export function normalizePhone(raw: string): string {
  const trimmed = raw.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/[^0-9]/g, '')
  return hasPlus ? `+${digits}` : digits
}
