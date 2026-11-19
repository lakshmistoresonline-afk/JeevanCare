import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDoctorName(name?: string | null): string {
  if (!name) return 'Doctor'
  const clean = name.trim().replace(/^(dr\.?\s*)+/i, '')
  return `Dr. ${clean}`
}

export function formatGreetingName(user?: { name?: string | null; role?: string } | null): string {
  if (!user || !user.name) return 'there'
  const clean = user.name.trim()

  if (user.role === 'doctor') {
    const nameWithoutDr = clean.replace(/^(dr\.?\s*)+/i, '').trim()
    return nameWithoutDr ? `Dr. ${nameWithoutDr}` : 'Doctor'
  }

  return clean || 'there'
}

export function relId(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    if ('id' in obj && obj.id != null) return String(obj.id)
    if ('_id' in obj && obj._id != null) return String(obj._id)
    if (typeof (value as any).toString === 'function') {
      const str = (value as any).toString()
      if (str !== '[object Object]') return str
    }
  }
  return String(value)
}

export function escapeHtml(str?: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
