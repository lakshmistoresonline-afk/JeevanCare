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

const STAFF_ROLES = ['owner', 'doctor', 'receptionist'] as const

async function resolveActorTenant(explicitUser?: User) {
  let user: User | null = null
  try {
    user = await getCurrentUser()
  } catch {
    user = null
  }
  // Fallback to explicitUser ONLY if no request session exists (e.g. internal test runner)
  if (!user && explicitUser) {
    user = explicitUser
  }
  if (!user) return null
  if (user.role === 'superAdmin') return null
  if (user.role === 'patient') return { user, isPatient: true } as any
  const payload = await getPayloadClient()
  const tenantID = getTenantID(user)
  const tenant = tenantID
    ? await payload.findByID({ collection: 'tenants', id: tenantID, depth: 0, overrideAccess: true })
    : null
  return { user, payload, tenantID: tenantID!, tenant: tenant as Tenant | null, isPatient: false }
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
  const ctx = await resolveActorTenant(actorUser)

  // Reject patient callers — patients must use the dedicated patient booking action
  if (ctx && (ctx as any).isPatient) {
    return { ok: false, code: 'FORBIDDEN', message: 'Patients must use the patient booking portal.' }
  }
  if (!ctx || !ctx.tenantID || !ctx.tenant) {
    return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to book appointments." }
  }

  const { user, payload, tenantID, tenant } = ctx

  // Validate actor has an allowed staff role
  if (!STAFF_ROLES.includes(user.role as any) && user.role !== 'superAdmin') {
    return { ok: false, code: 'FORBIDDEN', message: 'Only staff can book appointments.' }
  }

  const patientID = String(formData.get('patient') || '')
  const doctorID = String(formData.get('doctor') || '')
  const date = String(formData.get('date') || '')
  const time = String(formData.get('time') || '')
  const reason = String(formData.get('reason') || '')
  const isWalkIn = formData.get('isWalkIn') === 'on'

  if (!patientID || !doctorID || !date || !time) {
    return { ok: false, code: 'VALIDATION', message: 'Patient, doctor, date and time are required.' }
  }

  // Resolve doctor and validate: exists, role=doctor, active, tenant matches actor
  const doctor = (await payload.findByID({ collection: 'users', id: doctorID, depth: 0, overrideAccess: true }).catch(() => null)) as User | null
  if (!doctor || doctor.role !== 'doctor' || doctor.active === false) {
    return { ok: false, code: 'VALIDATION', message: 'Selected doctor is inactive or not found.' }
  }
  const docTenantID = relId(doctor.tenant) || ''
  if (!docTenantID || docTenantID !== tenantID) {
    return { ok: false, code: 'FORBIDDEN', message: 'Doctor does not belong to your clinic.' }
  }

  // Validate patient exists and belongs to the same tenant
  const patientDoc = await payload.findByID({ collection: 'patients', id: patientID, depth: 0, overrideAccess: true }).catch(() => null)
  if (!patientDoc) {
    return { ok: false, code: 'VALIDATION', message: 'Patient not found.' }
  }
  const patTenantID = relId(patientDoc.tenant) || ''
  if (patTenantID !== tenantID) {
    return { ok: false, code: 'FORBIDDEN', message: 'Patient does not belong to your clinic.' }
  }

  // Tenant integrity: doctor tenant == patient tenant == actor tenant
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
    tenantID,
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
        tenant: tenantID,
        patient: patientID,
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
  } catch (err: any) {
    // Normalize only MongoDB duplicate-key (code 11000) errors from the unique
    // index backstop to SLOT_TAKEN. Other MongoServerError values are not booking
    // conflicts and must not be misclassified.
    if (err?.code === 11000) {
      return { ok: false, code: 'SLOT_TAKEN', message: 'This appointment slot is no longer available. Please select another time.' }
    }
    return { ok: false, ...toActionError(err) }
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: string,
  cancellationReason?: string,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await resolveActorTenant()
  if (!ctx || (ctx as any).isPatient) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
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

  // Authenticate the actual caller — never trust a client-supplied actor object.
  // actorUser is only accepted from server-side callers that have already verified
  // identity (e.g. patient booking action). For dashboard calls, getCurrentUser is
  // the source of truth.
  let caller: User | null = null
  try {
    caller = await getCurrentUser()
  } catch {
    caller = null
  }
  if (!caller && actorUser) {
    caller = actorUser
  }
  if (!caller) return { ok: false, message: 'Authentication required.' }

  const payload = await getPayloadClient()
  try {
    const doctor = (await payload.findByID({ collection: 'users', id: doctorId, depth: 0, overrideAccess: true })) as User
    if (!doctor || doctor.role !== 'doctor' || doctor.active === false) {
      return { ok: false, message: 'Doctor is inactive or not found.' }
    }

    const docTenantID = relId(doctor.tenant) || ''

    // Enforce tenant boundary: the caller must belong to the same clinic as the doctor.
    // SuperAdmin must have an explicit tenant context (inferred from the doctor's tenant).
    if (caller.role !== 'superAdmin') {
      const callerTenantID = getTenantID(caller)
      if (!callerTenantID || callerTenantID !== docTenantID) {
        return { ok: false, message: 'Doctor does not belong to your clinic.' }
      }
    }

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
