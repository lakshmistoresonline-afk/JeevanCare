'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { getTenantID } from '@/access'
import { toActionError, type ActionResult } from '@/lib/errors'
import { wallTimeToUTC } from '@/lib/reports'
import { computeEnd, findConflict } from '@/lib/booking'
import { checkAvailability, formatWindow, windowOf, windowsOf, type AvailabilityTag } from '@/lib/availability'
import { relId } from '@/lib/utils'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import type { Tenant, User } from '@/payload-types'

async function resolveActorTenant(explicitUser?: User) {
  let user: User | null = explicitUser ?? null
  if (!user) {
    try {
      user = await getCurrentUser()
    } catch {
      user = null
    }
  }
  if (!user || user.role === 'superAdmin') return null
  const payload = await getPayloadClient()
  const tenantID = getTenantID(user)
  const tenant = tenantID
    ? await payload.findByID({ collection: 'tenants', id: tenantID, depth: 0, overrideAccess: true })
    : null
  return { user, payload, tenantID: tenantID!, tenant: tenant as Tenant | null }
}

export type DoctorAvailabilityHit = {
  id: string
  name: string
  tag: AvailabilityTag
  note: string
  free: boolean
}

export async function availableDoctorsAt(
  date: string,
  time: string,
  durationMins: number,
): Promise<DoctorAvailabilityHit[]> {
  const ctx = await resolveActorTenant()
  if (!ctx || !date || !time) return []
  const { payload, tenantID, tenant } = ctx
  const tz = tenant?.settings?.timezone || DEFAULT_TIMEZONE
  const start = wallTimeToUTC(tz, date, time)
  const end = computeEnd(start, durationMins || tenant?.settings?.appointmentDurationMins || 15)

  const docs = await payload.find({
    collection: 'users',
    where: { tenant: { equals: tenantID }, role: { equals: 'doctor' }, active: { equals: true } },
    limit: 50,
    sort: 'name',
    overrideAccess: true,
  })

  const hits: DoctorAvailabilityHit[] = []
  for (const d of docs.docs as User[]) {
    const a = checkAvailability(d, start, end, tz)
    if (!a.inFinder) continue
    let free = a.bookable
    if (free) {
      const clash = await findConflict({
        payload,
        tenantID,
        doctorID: String(d.id),
        start,
        end,
      })
      if (clash) free = false
    }
    hits.push({
      id: String(d.id),
      name: d.name,
      tag: a.tag,
      note: a.tag === 'onCall' ? 'On call' : a.reason || formatWindow(windowOf(d)),
      free,
    })
  }
  return hits
}

export async function bookAppointment(
  formData: FormData,
  actorUser?: User,
): Promise<ActionResult<{ id: string; token?: string }>> {
  let ctx = await resolveActorTenant(actorUser)
  const payload = await getPayloadClient()

  const patient = String(formData.get('patient') || '')
  const doctorID = String(formData.get('doctor') || '')
  const date = String(formData.get('date') || '')
  const time = String(formData.get('time') || '')
  const reason = String(formData.get('reason') || '')
  const isWalkIn = formData.get('isWalkIn') === 'on'

  if (!patient || !doctorID || !date || !time) {
    return { ok: false, code: 'VALIDATION', message: 'Patient, doctor, date and time are required.' }
  }

  // Resolve doctor
  const doctor = (await payload.findByID({ collection: 'users', id: doctorID, depth: 0, overrideAccess: true }).catch(() => null)) as User | null
  if (!doctor || doctor.role !== 'doctor' || doctor.active === false) {
    return { ok: false, code: 'VALIDATION', message: 'Selected doctor is inactive or not found.' }
  }

  const docTenantID = relId(doctor.tenant) || ''

  if (!ctx) {
    const tenant = docTenantID ? await payload.findByID({ collection: 'tenants', id: docTenantID, depth: 0, overrideAccess: true }) : null
    ctx = { user: doctor, payload, tenantID: docTenantID, tenant }
  }

  const { user, tenant } = ctx
  const durationMins = Number(formData.get('durationMins') || tenant?.settings?.appointmentDurationMins || 15)
  const tz = tenant?.settings?.timezone || DEFAULT_TIMEZONE
  const start = wallTimeToUTC(tz, date, time)
  const end = computeEnd(start, durationMins)

  if (!isWalkIn && start < new Date()) {
    return { ok: false, code: 'VALIDATION', message: 'Cannot book appointments in the past.' }
  }

  const avail = checkAvailability(doctor, start, end, tz)
  if (!avail.bookable) {
    return {
      ok: false,
      code: 'VALIDATION',
      message: `${doctor.name} can't be booked then — ${avail.reason}.`,
    }
  }

  const conflict = await findConflict({
    payload,
    tenantID: docTenantID,
    doctorID,
    start,
    end,
  })
  if (conflict) {
    return {
      ok: false,
      code: 'SLOT_TAKEN',
      message: 'This appointment slot is no longer available. Please select another time.',
    }
  }

  try {
    const appt = await payload.create({
      collection: 'appointments',
      user,
      overrideAccess: true,
      data: {
        tenant: docTenantID,
        patient,
        doctor: doctorID,
        start: start.toISOString(),
        durationMins,
        reason: reason || undefined,
        isWalkIn,
        status: isWalkIn ? 'checked-in' : 'scheduled',
      } as never,
    })
    try { revalidatePath('/dashboard/appointments') } catch {}
    return { ok: true, data: { id: String(appt.id), token: (appt as { tokenNumber?: string }).tokenNumber } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: string,
  cancellationReason?: string,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await resolveActorTenant()
  if (!ctx) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
  const { user, payload } = ctx

  try {
    await payload.update({
      collection: 'appointments',
      id,
      user,
      overrideAccess: false,
      data: { status, ...(cancellationReason ? { cancellationReason } : {}) } as never,
    })
    try { revalidatePath('/dashboard/appointments') } catch {}
    try { revalidatePath('/dashboard') } catch {}
    return { ok: true, data: { id } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

export async function getAvailableSlots(
  doctorId: string,
  date: string,
  actorUser?: User,
): Promise<{ ok: boolean; slots?: string[]; message?: string }> {
  if (!doctorId || !date) return { ok: false, message: 'Doctor and date are required.' }

  const payload = await getPayloadClient()
  try {
    const doctor = (await payload.findByID({ collection: 'users', id: doctorId, depth: 0, overrideAccess: true })) as User
    if (!doctor || doctor.role !== 'doctor' || doctor.active === false) {
      return { ok: false, message: 'Doctor is inactive or not found.' }
    }

    const docTenantID = relId(doctor.tenant) || ''
    const tenant = docTenantID ? await payload.findByID({ collection: 'tenants', id: docTenantID, depth: 0, overrideAccess: true }) : null

    const tz = tenant?.settings?.timezone || DEFAULT_TIMEZONE
    const durationMins = tenant?.settings?.appointmentDurationMins || 15
    const wins = windowsOf(doctor)

    const now = new Date()
    const slots: string[] = []

    for (const win of wins) {
      const [fromH, fromM] = win.from.split(':').map(Number)
      const [toH, toM] = win.to.split(':').map(Number)

      let currentMinutes = fromH * 60 + fromM
      const endMinutes = toH * 60 + toM

      while (currentMinutes + durationMins <= endMinutes) {
        const h = Math.floor(currentMinutes / 60)
        const m = currentMinutes % 60
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

        const start = wallTimeToUTC(tz, date, timeStr)
        const end = computeEnd(start, durationMins)

        if (start > now) {
          const avail = checkAvailability(doctor, start, end, tz)
          if (avail.bookable) {
            const conflict = await findConflict({
              payload,
              tenantID: docTenantID,
              doctorID: String(doctorId),
              start,
              end,
            })
            if (!conflict) {
              const displayTime = start.toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
                timeZone: tz,
              }).toLowerCase()
              slots.push(displayTime)
            }
          }
        }
        currentMinutes += durationMins
      }
    }

    return { ok: true, slots }
  } catch {
    return { ok: false, message: 'Could not compute available slots.' }
  }
}
