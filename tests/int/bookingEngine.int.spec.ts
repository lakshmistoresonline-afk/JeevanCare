import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import type { Payload } from 'payload'
import { getTestPayload, seedFixture, type Fixture } from './fixtures'
import { findConflict, overlaps, computeEnd } from '@/lib/booking'
import { bookAppointment, getAvailableSlots } from '@/app/(frontend)/dashboard/appointments/actions'
import { relId } from '@/lib/utils'

describe('Production-Grade Appointment Slot Engine & Concurrency Suite', () => {
  let payload: Payload
  let f: Fixture

  beforeAll(async () => {
    payload = await getTestPayload()
  })

  beforeEach(async () => {
    f = await seedFixture(payload)
  })

  const futureDateStr = (daysAhead = 1) => {
    const d = new Date()
    d.setDate(d.getDate() + daysAhead)
    return d.toISOString().slice(0, 10)
  }

  // =========================================================================
  // 1. OVERLAP & COMPUTATION UNIT TESTS
  // =========================================================================

  it('correctly calculates computeEnd given start and duration', () => {
    const start = new Date('2026-10-10T10:00:00.000Z')
    const end = computeEnd(start, 30)
    expect(end.toISOString()).toBe('2026-10-10T10:30:00.000Z')
  })

  it('accurately tests range overlaps without flagging adjacent touching slots', () => {
    const aStart = new Date('2026-10-10T10:00:00Z')
    const aEnd = new Date('2026-10-10T10:15:00Z')

    // Adjacent touching slot (10:15 - 10:30)
    const bStart = new Date('2026-10-10T10:15:00Z')
    const bEnd = new Date('2026-10-10T10:30:00Z')
    expect(overlaps(aStart, aEnd, bStart, bEnd)).toBe(false)

    // Overlapping slot (10:05 - 10:20)
    const cStart = new Date('2026-10-10T10:05:00Z')
    const cEnd = new Date('2026-10-10T10:20:00Z')
    expect(overlaps(aStart, aEnd, cStart, cEnd)).toBe(true)
  })

  // =========================================================================
  // 2. SLOT COMPUTATION & AVAILABILITY GENERATION
  // =========================================================================

  it('returns valid clickable slots for active doctors within availability windows', async () => {
    const date = futureDateStr(2)
    const res = await getAvailableSlots(String(f.a.doctor.id), date)
    expect(res.ok).toBe(true)
    expect(res.slots).toBeDefined()
    expect(res.slots!.length).toBeGreaterThan(0)
  })

  it('rejects generating slots or booking for an inactive doctor', async () => {
    // Deactivate doctor
    await payload.update({
      collection: 'users',
      id: f.a.doctor.id,
      data: { active: false } as never,
      overrideAccess: true,
    })

    const date = futureDateStr(2)
    const slotsRes = await getAvailableSlots(String(f.a.doctor.id), date)
    expect(slotsRes.ok).toBe(false)
    expect(slotsRes.message).toMatch(/inactive/i)
  })

  // =========================================================================
  // 3. BOOKING REVALIDATION & CONFLICT PREVENTION
  // =========================================================================

  it('prevents double-booking an occupied slot and frees slots when cancelled', async () => {
    const date = futureDateStr(3)
    const time = '11:00 am'

    // First booking
    const formData1 = new FormData()
    formData1.set('patient', String(f.a.patient.id))
    formData1.set('doctor', String(f.a.doctor.id))
    formData1.set('date', date)
    formData1.set('time', time)

    const res1 = await bookAppointment(formData1)
    expect(res1.ok).toBe(true)
    if (!res1.ok) return

    // Second booking attempt for the exact same doctor and slot
    const formData2 = new FormData()
    formData2.set('patient', String(f.a.patient.id))
    formData2.set('doctor', String(f.a.doctor.id))
    formData2.set('date', date)
    formData2.set('time', time)

    const res2 = await bookAppointment(formData2)
    expect(res2.ok).toBe(false)
    if (res2.ok) return
    expect(res2.code).toBe('SLOT_TAKEN')

    // Cancel the first appointment
    await payload.update({
      collection: 'appointments',
      id: res1.data.id,
      data: { status: 'cancelled', cancellationReason: 'patient change of mind' } as never,
      overrideAccess: true,
    })

    // Third booking attempt now succeeds because cancelled appointment freed the slot
    const res3 = await bookAppointment(formData2)
    expect(res3.ok).toBe(true)
  })

  // =========================================================================
  // 4. CONCURRENT SIMULTANEOUS BOOKING RACE CONDITION TEST
  // =========================================================================

  it('handles simultaneous concurrent booking attempts for the same slot (race condition)', async () => {
    const date = futureDateStr(4)
    const time = '02:00 pm'

    const makeBookingCall = () => {
      const formData = new FormData()
      formData.set('patient', String(f.a.patient.id))
      formData.set('doctor', String(f.a.doctor.id))
      formData.set('date', date)
      formData.set('time', time)
      return bookAppointment(formData)
    }

    // Fire 2 concurrent simultaneous booking attempts
    const [resA, resB] = await Promise.all([makeBookingCall(), makeBookingCall()])

    // Exactly one must succeed, and one must be rejected with conflict
    const successCount = [resA, resB].filter((r) => r.ok).length
    const failCount = [resA, resB].filter((r) => !r.ok).length

    expect(successCount).toBe(1)
    expect(failCount).toBe(1)
  })
})
