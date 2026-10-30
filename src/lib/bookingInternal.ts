import crypto from 'crypto'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { getTenantID } from '@/access'
import { toActionError, type ActionResult } from '@/lib/errors'
import { wallTimeToUTC } from '@/lib/reports'
import { computeEnd, findConflict } from '@/lib/booking'
import { checkAvailability, windowsOf } from '@/lib/availability'
import { relId } from '@/lib/utils'
import { DEFAULT_TIMEZONE } from '@/lib/constants'
import type { Tenant, User } from '@/payload-types'

const STAFF_ROLES = ['owner', 'doctor', 'receptionist'] as const

export async function resolveActorTenantInternal(explicitUser?: User) {
  let user: User | null = null
  try {
    user = await getCurrentUser()
  } catch {
    user = null
  }
  if (!user && explicitUser) {
    user = explicitUser
  }
  if (!user) return null
  if (user.active === false) return null
  if (user.role === 'patient') return { user, isPatient: true, isSuperAdmin: false } as any
  const payload = await getPayloadClient()
  if (user.role === 'superAdmin') {
    return { user, payload, tenantID: null, tenant: null, isSuperAdmin: true, isPatient: false }
  }

  const tenantID = getTenantID(user)
  const tenant = tenantID
    ? await payload.findByID({ collection: 'tenants', id: tenantID, depth: 0, overrideAccess: true })
    : null
  if (tenant && tenant.status !== 'active') return null
  return { user, payload, tenantID: tenantID!, tenant: tenant as Tenant | null, isSuperAdmin: false, isPatient: false }
}

export async function internalIssuePatientActivationToken(
  patientId: string,
  explicitActor?: User,
): Promise<ActionResult<{ activationCode: string; expiresAt: string }>> {
  const ctx = await resolveActorTenantInternal(explicitActor)
  if (!ctx || (ctx as any).isPatient) {
    return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to issue activation codes." }
  }
  const { user, payload, tenantID, isSuperAdmin } = ctx
  if (!STAFF_ROLES.includes(user.role as any) && user.role !== 'superAdmin') {
    return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to issue activation codes." }
  }

  try {
    const patient = await payload.findByID({
      collection: 'patients',
      id: patientId,
      depth: 0,
      user,
      overrideAccess: isSuperAdmin,
    }).catch(() => null)

    if (!patient) {
      return { ok: false, code: 'FORBIDDEN', message: 'Patient not found in your clinic.' }
    }

    const patientTenantID = relId(patient.tenant) || ''
    if (!isSuperAdmin && (!tenantID || patientTenantID !== String(tenantID))) {
      return { ok: false, code: 'FORBIDDEN', message: 'Patient not found in your clinic.' }
    }

    const rawCode = String(crypto.randomInt(100000, 999999))
    const tokenHash = crypto.createHash('sha256').update(rawCode).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const db = (payload.db as any)?.connection?.db || (payload.db as any)?.collections?.patients?.collection?.db
    let updateSuccess = false

    if (db) {
      const queryId = (patient as any)._id || patient.id
      const updateRes = await db.collection('patients').updateOne(
        { _id: queryId },
        {
          $set: {
            activationTokenHash: tokenHash,
            activationTokenExp: expiresAt.toISOString(),
            activationAttempts: 0,
          },
          $unset: { activationCode: '', activeClaimId: '', claimedAt: '' },
        },
      )
      updateSuccess = updateRes.modifiedCount > 0
    } else {
      const updated = await payload.update({
        collection: 'patients',
        id: patientId,
        user,
        overrideAccess: isSuperAdmin,
        data: {
          activationCode: null,
          activationTokenHash: tokenHash,
          activationTokenExp: expiresAt.toISOString(),
          activationAttempts: 0,
        } as never,
      }).catch(() => null)
      updateSuccess = Boolean(updated)
    }

    if (!updateSuccess) {
      return { ok: false, code: 'NOT_FOUND', message: 'Patient record update failed.' }
    }

    await payload.create({
      collection: 'auditLogs',
      overrideAccess: true,
      data: {
        tenant: patientTenantID || tenantID,
        user: user.id,
        action: 'patient.activation_code_issued',
        summary: `Issued portal activation code for patient ${patient.name} (${patient.mrn})`,
        details: JSON.stringify({ patientId, expiresAt: expiresAt.toISOString() }),
      } as never,
    }).catch(() => {})

    return {
      ok: true,
      data: {
        activationCode: rawCode,
        expiresAt: expiresAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      },
    }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

export async function internalBookAppointment(
  formData: FormData,
  explicitActor?: User,
): Promise<ActionResult<{ id: string; token?: string }>> {
  const ctx = await resolveActorTenantInternal(explicitActor)

  if (ctx && (ctx as any).isPatient) {
    return { ok: false, code: 'FORBIDDEN', message: 'Patients must use the patient booking portal.' }
  }
  if (!ctx || (!ctx.isSuperAdmin && (!ctx.tenantID || !ctx.tenant))) {
    return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to book appointments or clinic is inactive." }
  }

  const { user, payload, tenantID, tenant, isSuperAdmin } = ctx

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

  const doctor = (await payload.findByID({ collection: 'users', id: doctorID, depth: 0, overrideAccess: true }).catch(() => null)) as User | null
  if (!doctor || doctor.role !== 'doctor' || doctor.active === false) {
    return { ok: false, code: 'VALIDATION', message: 'Selected doctor is inactive or not found.' }
  }
  const docTenantID = relId(doctor.tenant) || ''
  if (user.role !== 'superAdmin' && (!docTenantID || docTenantID !== tenantID)) {
    return { ok: false, code: 'FORBIDDEN', message: 'Doctor does not belong to your clinic.' }
  }

  const patientDoc = await payload.findByID({ collection: 'patients', id: patientID, depth: 0, overrideAccess: true }).catch(() => null)
  if (!patientDoc) {
    return { ok: false, code: 'VALIDATION', message: 'Patient not found.' }
  }
  const patTenantID = relId(patientDoc.tenant) || ''
  if (user.role !== 'superAdmin' && patTenantID !== tenantID) {
    return { ok: false, code: 'FORBIDDEN', message: 'Patient does not belong to your clinic.' }
  }

  // Cross-clinic doctor and patient matching validation
  if (docTenantID && patTenantID && docTenantID !== patTenantID) {
    return { ok: false, code: 'FORBIDDEN', message: 'Doctor and patient must belong to the same clinic.' }
  }

  const targetTenantID = docTenantID || patTenantID || tenantID!
  const targetTenant = (isSuperAdmin && targetTenantID
    ? await payload.findByID({ collection: 'tenants', id: targetTenantID, depth: 0, overrideAccess: true }).catch(() => null)
    : tenant) as Tenant | null

  if (targetTenant && targetTenant.status !== 'active') {
    return { ok: false, code: 'FORBIDDEN', message: 'Selected clinic is inactive.' }
  }

  const durationMins = Number(formData.get('durationMins') || targetTenant?.settings?.appointmentDurationMins || 15)
  const tz = targetTenant?.settings?.timezone || DEFAULT_TIMEZONE
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
    tenantID: targetTenantID,
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
        tenant: targetTenantID,
        patient: patientID,
        doctor: doctorID,
        start: start.toISOString(),
        durationMins,
        reason: reason || undefined,
        isWalkIn,
        status: isWalkIn ? 'checked-in' : 'scheduled',
      } as never,
    })
    return { ok: true, data: { id: String(appt.id), token: (appt as { tokenNumber?: string }).tokenNumber } }
  } catch (err: any) {
    if (err?.code === 11000) {
      return { ok: false, code: 'SLOT_TAKEN', message: 'This appointment slot is no longer available. Please select another time.' }
    }
    return { ok: false, ...toActionError(err) }
  }
}

export async function internalGetAvailableSlots(
  doctorId: string,
  date: string,
  explicitActor?: User,
): Promise<{ ok: boolean; slots?: string[]; message?: string }> {
  if (!doctorId || !date) return { ok: false, message: 'Doctor and date are required.' }

  let caller: User | null = null
  try {
    caller = await getCurrentUser()
  } catch {
    caller = null
  }
  if (!caller && explicitActor) {
    caller = explicitActor
  }
  if (!caller || caller.active === false) return { ok: false, message: 'Authentication required.' }

  const payload = await getPayloadClient()
  try {
    const doctor = (await payload.findByID({ collection: 'users', id: doctorId, depth: 0, overrideAccess: true })) as User
    if (!doctor || doctor.role !== 'doctor' || doctor.active === false) {
      return { ok: false, message: 'Doctor is inactive or not found.' }
    }

    const docTenantID = relId(doctor.tenant) || ''

    if (caller.role !== 'superAdmin') {
      const callerTenantID = getTenantID(caller)
      if (!callerTenantID || callerTenantID !== docTenantID) {
        return { ok: false, message: 'Doctor does not belong to your clinic.' }
      }
    }

    const tenant = docTenantID ? await payload.findByID({ collection: 'tenants', id: docTenantID, depth: 0, overrideAccess: true }) : null
    if (tenant && tenant.status !== 'active') {
      return { ok: false, message: 'Clinic account is not active.' }
    }

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
