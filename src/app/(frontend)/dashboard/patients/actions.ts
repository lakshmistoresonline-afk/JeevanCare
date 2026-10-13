'use server'

import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { getTenantID } from '@/access'
import { toActionError, type ActionResult } from '@/lib/errors'

export type PatientHit = { id: string; name: string; phone: string; mrn: string }

async function ctx() {
  const user = await getCurrentUser()
  if (!user || user.role === 'superAdmin') return null
  const payload = await getPayloadClient()
  return { user, payload, tenantID: getTenantID(user) }
}

/** Search patients by name / phone / MRN within the user's tenant. */
export async function searchPatients(query: string): Promise<PatientHit[]> {
  const c = await ctx()
  if (!c || !query.trim()) return []
  const q = query.trim()
  const res = await c.payload.find({
    collection: 'patients',
    where: {
      or: [
        { name: { like: q } },
        { phone: { like: q } },
        { mrn: { like: q } },
      ],
    },
    user: c.user,
    overrideAccess: false,
    limit: 8,
    depth: 0,
  })
  return res.docs.map((p) => ({
    id: String(p.id),
    name: p.name,
    phone: p.phone,
    mrn: p.mrn ?? '',
  }))
}

/** Find patients sharing a phone (dedupe warning). */
export async function findByPhone(phone: string): Promise<PatientHit[]> {
  const c = await ctx()
  if (!c || !phone.trim()) return []
  const res = await c.payload.find({
    collection: 'patients',
    where: { phone: { equals: phone.trim() } },
    user: c.user,
    overrideAccess: false,
    limit: 5,
    depth: 0,
  })
  return res.docs.map((p) => ({ id: String(p.id), name: p.name, phone: p.phone, mrn: p.mrn ?? '' }))
}

type PatientInput = {
  name: string
  phone: string
  gender: string
  ageYears?: number
  dateOfBirth?: string
  bloodGroup?: string
  allergies?: string
  notes?: string
}

export async function updatePatient(
  id: string,
  input: PatientInput,
): Promise<ActionResult<PatientHit>> {
  const c = await ctx()
  if (!c) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
  if (!input.name || !input.phone || !input.gender) {
    return { ok: false, code: 'VALIDATION', message: 'Name, phone and gender are required.' }
  }
  try {
    const p = await c.payload.update({
      collection: 'patients',
      id,
      user: c.user,
      overrideAccess: false,
      data: {
        name: input.name,
        phone: input.phone,
        gender: input.gender,
        ageYears: input.ageYears ?? null,
        dateOfBirth: input.dateOfBirth || null,
        bloodGroup: input.bloodGroup || null,
        allergies: input.allergies || null,
        notes: input.notes || null,
      } as never,
    })
    revalidatePath('/dashboard/patients')
    revalidatePath(`/dashboard/patients/${id}`)
    return { ok: true, data: { id: String(p.id), name: p.name, phone: p.phone, mrn: p.mrn ?? '' } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

export async function createPatient(input: PatientInput): Promise<ActionResult<PatientHit>> {
  const c = await ctx()
  if (!c) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to do that." }
  if (!input.name || !input.phone || !input.gender) {
    return { ok: false, code: 'VALIDATION', message: 'Name, phone and gender are required.' }
  }
  try {
    const p = await c.payload.create({
      collection: 'patients',
      user: c.user,
      overrideAccess: false,
      data: {
        name: input.name,
        phone: input.phone,
        gender: input.gender,
        ageYears: input.ageYears,
        dateOfBirth: input.dateOfBirth || undefined,
        bloodGroup: input.bloodGroup || undefined,
        allergies: input.allergies || undefined,
        notes: input.notes || undefined,
      } as never,
    })
    revalidatePath('/dashboard/patients')
    return { ok: true, data: { id: String(p.id), name: p.name, phone: p.phone, mrn: p.mrn ?? '' } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}

/** Issue or reissue a cryptographically secure 6-digit activation code for a patient.
 * Generates a 6-digit code, hashes it with SHA-256, sets a 24-hour expiry, resets attempts,
 * and logs an audit record.
 */
export async function issuePatientActivationToken(
  patientId: string,
): Promise<ActionResult<{ activationCode: string; expiresAt: string }>> {
  const c = await ctx()
  if (!c) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission to issue activation codes." }

  try {
    const patient = await c.payload.findByID({
      collection: 'patients',
      id: patientId,
      depth: 0,
      user: c.user,
      overrideAccess: false,
    })

    if (!patient || String((patient as any).tenant) !== String(c.tenantID)) {
      return { ok: false, code: 'FORBIDDEN', message: 'Patient not found in your clinic.' }
    }

    const rawCode = String(crypto.randomInt(100000, 999999))
    const tokenHash = crypto.createHash('sha256').update(rawCode).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await c.payload.update({
      collection: 'patients',
      id: patientId,
      user: c.user,
      overrideAccess: false,
      data: {
        activationCode: null, // Plaintext is NEVER stored in MongoDB; hash-only
        activationTokenHash: tokenHash,
        activationTokenExp: expiresAt.toISOString(),
        activationAttempts: 0,
      } as never,
    })

    await c.payload.create({
      collection: 'auditLogs',
      overrideAccess: true,
      data: {
        tenant: c.tenantID,
        user: c.user.id,
        action: 'patient.activation_code_issued',
        summary: `Issued portal activation code for patient ${patient.name} (${patient.mrn})`,
        details: JSON.stringify({ patientId, expiresAt: expiresAt.toISOString() }),
      } as never,
    }).catch(() => {})

    revalidatePath(`/dashboard/patients/${patientId}`)
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

export async function uploadMedicalDocument(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const c = await ctx()
  if (!c) return { ok: false, code: 'FORBIDDEN', message: "You don't have permission." }
  const patientID = formData.get('patientID') as string
  const visitID = formData.get('visitID') as string
  const appointmentID = formData.get('appointmentID') as string
  const title = formData.get('title') as string
  const documentType = formData.get('documentType') as string
  const description = formData.get('description') as string
  const file = formData.get('file') as File

  if (!patientID || !title || !documentType || !file) {
    return { ok: false, code: 'VALIDATION', message: 'Patient, title, document type and file are required.' }
  }

  try {
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await c.payload.create({
      collection: 'medical-documents' as any,
      user: c.user,
      overrideAccess: false,
      data: {
        tenant: c.tenantID,
        patient: patientID,
        visit: visitID || undefined,
        appointment: appointmentID || undefined,
        title,
        documentType,
        description: description || undefined,
        documentDate: new Date().toISOString(),
        status: 'active',
      },
      file: {
        data: buffer,
        name: file.name,
        mimetype: file.type,
        size: file.size,
      },
    })

    revalidatePath(`/dashboard/patients/${patientID}`)
    return { ok: true, data: { id: 'success' } }
  } catch (err) {
    return { ok: false, ...toActionError(err) }
  }
}
