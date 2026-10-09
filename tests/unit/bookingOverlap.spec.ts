import { describe, it, expect } from 'vitest'
import { overlaps, computeEnd } from '../../src/lib/booking'

describe('overlaps', () => {
  const make = (h: number, m: number) => new Date(`2026-01-15T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`)

  it('detects fully overlapping intervals', () => {
    expect(overlaps(make(10, 0), make(10, 30), make(10, 0), make(10, 30))).toBe(true)
  })

  it('detects partial overlap (different start times)', () => {
    // 10:00-10:30 vs 10:15-10:45 — overlap
    expect(overlaps(make(10, 0), make(10, 30), make(10, 15), make(10, 45))).toBe(true)
  })

  it('does NOT conflict on touching edges', () => {
    // 10:00-10:15 then 10:15-10:30 — no overlap
    expect(overlaps(make(10, 0), make(10, 15), make(10, 15), make(10, 30))).toBe(false)
  })

  it('does NOT conflict on fully separate intervals', () => {
    expect(overlaps(make(10, 0), make(10, 15), make(11, 0), make(11, 15))).toBe(false)
  })

  it('detects containment (one inside the other)', () => {
    expect(overlaps(make(10, 0), make(11, 0), make(10, 15), make(10, 45))).toBe(true)
  })

  it('detects overlap when new starts before existing', () => {
    // New: 09:45-10:15, Existing: 10:00-10:30
    expect(overlaps(make(9, 45), make(10, 15), make(10, 0), make(10, 30))).toBe(true)
  })
})

describe('computeEnd', () => {
  it('adds minutes correctly', () => {
    const start = new Date('2026-01-15T10:00:00Z')
    const end = computeEnd(start, 15)
    expect(end.toISOString()).toBe('2026-01-15T10:15:00.000Z')
  })

  it('handles 0 duration', () => {
    const start = new Date('2026-01-15T10:00:00Z')
    const end = computeEnd(start, 0)
    expect(end.getTime()).toBe(start.getTime())
  })
})
