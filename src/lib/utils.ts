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

export function relId(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'id' in (value as Record<string, unknown>)) {
    return String((value as { id: string | number }).id)
  }
  return String(value)
}
