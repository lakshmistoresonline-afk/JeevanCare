import { getPayload } from 'payload'
import config from '@payload-config'
import { isSuperAdmin, getTenantID } from '@/access'
import type { User } from '@/payload-types'
import { relId } from '@/lib/utils'
import crypto from 'crypto'

const ALLOWED_STAFF_ROLES = ['doctor', 'receptionist'] as const
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024 // 15MB
const MAX_ROW_COUNT = 60000

function parseCSVLine(textLine: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < textLine.length; i++) {
    const char = textLine[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''))
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''))
  return result
}

async function resolveTenantID(payload: any, isSuper: boolean, actor: any, row: Record<string, string>, rowIndex?: number): Promise<string | null> {
  const rawClinicKey = row.clinic_name || row['clinic name'] || row.clinic || row.tenantid || row.clinic_id || ''

  if (rawClinicKey) {
    if (/^[0-9a-fA-F]{24}$/.test(rawClinicKey)) {
      try {
        const exists = await payload.findByID({ collection: 'tenants', id: rawClinicKey, depth: 0, overrideAccess: true }).catch(() => null)
        if (exists) return String(exists.id)
      } catch {}
    }

    const targetName = rawClinicKey.trim().toLowerCase()
    const allTenants = await payload.find({
      collection: 'tenants',
      limit: 100,
      overrideAccess: true,
    })
    const matched = allTenants.docs.find((t: any) => t.name.trim().toLowerCase() === targetName)
    if (matched) {
      return String(matched.id)
    }
  }

  const allTenants = await payload.find({
    collection: 'tenants',
    limit: 100,
    overrideAccess: true,
  })
  if (allTenants.docs.length > 0) {
    const index = (rowIndex !== undefined ? rowIndex : 0) % allTenants.docs.length
    return String(allTenants.docs[index].id)
  }

  const actorTenant = getTenantID(actor)
  if (actorTenant) return String(actorTenant)

  return null
}

export async function POST(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const normalizedType = type === 'clinics' ? 'tenants' : type
  if (!['tenants', 'staff', 'patients', 'appointments', 'medicines'].includes(normalizedType)) {
    return Response.json({ error: 'Unknown or unsupported import type.' }, { status: 404 })
  }

  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: req.headers as never })
  if (!user) return Response.json({ error: 'Sign in to import data.' }, { status: 401 })

  const actor = user as unknown as User
  const isSuper = isSuperAdmin(actor)

  if (normalizedType === 'tenants') {
    if (!isSuper) {
      return Response.json({ error: 'Only super-admins can import clinic tenants.' }, { status: 403 })
    }
  } else if (normalizedType === 'staff' || normalizedType === 'patients' || normalizedType === 'appointments') {
    if (!isSuper && !['owner', 'receptionist', 'doctor'].includes(actor.role)) {
      return Response.json({ error: 'Only authorized clinic staff can import data.' }, { status: 403 })
    }
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return Response.json({ error: 'No CSV file uploaded.' }, { status: 400 })

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return Response.json({ error: 'File size exceeds maximum limit of 2MB.' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (lines.length < 2) {
      return Response.json({ error: 'CSV file is empty or missing header.' }, { status: 400 })
    }

    if (lines.length - 1 > MAX_ROW_COUNT) {
      return Response.json({ error: `CSV exceeds maximum row limit of ${MAX_ROW_COUNT} records.` }, { status: 400 })
    }

    const rawHeaders = parseCSVLine(lines[0])
    const headers = rawHeaders.map((h, idx) => {
      let clean = h.trim().toLowerCase().replace(/^"|"$/g, '')
      if (idx === 0) {
        clean = clean.replace(/^\uFEFF/, '')
      }
      return clean
    })
    let importedCount = 0
    const errors: { row: number; reason: string }[] = []
    const tenantPatientsCache = new Map<string, any[]>()
    const tenantDoctorsCache = new Map<string, any[]>()
    const tenantApptsCache = new Map<string, any[]>()
    const medicinesToInsert: any[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i])
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ''
      })

      if (normalizedType === 'tenants') {
        if (!row.name || !row.phone) {
          errors.push({ row: i, reason: 'Missing required clinic name or phone.' })
          continue
        }
        try {
          const existingTenantRes = await payload.find({
            collection: 'tenants',
            where: { name: { equals: row.name } },
            limit: 1,
            overrideAccess: true,
          })

          let tenant: any
          if (existingTenantRes.docs.length > 0) {
            tenant = await payload.update({
              collection: 'tenants',
              id: existingTenantRes.docs[0].id,
              overrideAccess: true,
              data: {
                phone: row.phone,
                city: row.city || 'Thrissur',
                state: row.state || 'Kerala',
                status: 'active',
                plan: row.plan || 'plus',
              } as never,
            })
          } else {
            tenant = await payload.create({
              collection: 'tenants',
              overrideAccess: true,
              data: {
                name: row.name,
                phone: row.phone,
                city: row.city || 'Thrissur',
                state: row.state || 'Kerala',
                country: 'India',
                status: 'active',
                plan: row.plan || 'plus',
                settings: {
                  currency: 'INR',
                  timezone: 'Asia/Kolkata',
                  appointmentDurationMins: 15,
                  openTime: '09:00',
                  closeTime: '17:00',
                },
              } as never,
            })
          }

          if (row.owner_email) {
            const ownerPassword = row.owner_password || `Tmp#${crypto.randomBytes(6).toString('hex')}!`
            const existingOwner = await payload.find({
              collection: 'users',
              where: { email: { equals: row.owner_email.toLowerCase() } },
              limit: 1,
              overrideAccess: true,
            })
            if (existingOwner.docs.length === 0) {
              await payload.create({
                collection: 'users',
                overrideAccess: true,
                data: {
                  name: row.owner_name || `Owner — ${row.name}`,
                  email: row.owner_email.toLowerCase(),
                  password: ownerPassword,
                  role: 'owner',
                  tenant: tenant.id,
                  phone: row.phone,
                  active: true,
                } as never,
              }).catch(() => {})
            }
          }

          importedCount++
        } catch (err: any) {
          errors.push({ row: i, reason: err.message || 'Failed to create or update clinic record.' })
        }
      } else if (normalizedType === 'staff') {
        if (!row.name || !row.email || !row.role) {
          errors.push({ row: i, reason: 'Missing required name, email, or role.' })
          continue
        }

        const role = row.role.toLowerCase()
        if (!ALLOWED_STAFF_ROLES.includes(role as any)) {
          errors.push({ row: i, reason: `Invalid role '${row.role}'. Allowed staff roles: doctor, receptionist.` })
          continue
        }

        const targetTenantID = await resolveTenantID(payload, isSuper, actor, row, i)
        if (!targetTenantID) {
          errors.push({ row: i, reason: `Could not determine target clinic tenant for row ${i}. Please check clinic name.` })
          continue
        }

        const initialPassword = row.password || `Tmp#${crypto.randomBytes(6).toString('hex')}!`
        const rawPhone = row.phone || ''
        const cleanPhone = /^\+?[0-9]{7,15}$/.test(rawPhone.replace(/[\s-]/g, '')) ? rawPhone : undefined
        const feeVal = row.fee || row.consultationfee || row.consultation_fee
        const consultationFee = feeVal ? Number(feeVal) : 800

        try {
          const existingUser = await payload.find({
            collection: 'users',
            where: { email: { equals: row.email.toLowerCase() } },
            limit: 1,
            overrideAccess: true,
          })

          if (existingUser.docs.length > 0) {
            await payload.update({
              collection: 'users',
              id: existingUser.docs[0].id,
              overrideAccess: true,
              data: {
                name: row.name,
                role: role as any,
                tenant: targetTenantID,
                phone: cleanPhone,
                specialty: row.specialty || undefined,
                consultationFee,
                medicalRegistrationNumber: row.regno || undefined,
                active: true,
              } as never,
            })
          } else {
            await payload.create({
              collection: 'users',
              overrideAccess: true,
              data: {
                name: row.name,
                email: row.email.toLowerCase(),
                password: initialPassword,
                role: role as any,
                tenant: targetTenantID,
                phone: cleanPhone,
                specialty: row.specialty || undefined,
                consultationFee,
                medicalRegistrationNumber: row.regno || undefined,
                active: true,
              } as never,
            })
          }
          importedCount++
        } catch (err: any) {
          errors.push({ row: i, reason: err.message || 'Failed to create or update staff record.' })
        }
      } else if (normalizedType === 'patients') {
        if (!row.name || !row.phone) {
          errors.push({ row: i, reason: 'Missing required patient name or phone.' })
          continue
        }

        const targetTenantID = await resolveTenantID(payload, isSuper, actor, row, i)
        if (!targetTenantID) {
          errors.push({ row: i, reason: `Could not determine target clinic tenant for row ${i}. Please check clinic name.` })
          continue
        }

        const ageYears = row.ageyears || row.age ? Number(row.ageyears || row.age) : 30
        const gender = row.gender ? row.gender.toLowerCase() : 'other'
        const rawPhone = row.phone || ''
        const cleanPhone = /^\+?[0-9]{7,15}$/.test(rawPhone.replace(/[\s-]/g, '')) ? rawPhone : undefined
        const patientPassword = row.password || 'Test@123'

        try {
          let patient: any
          if (cleanPhone) {
            const existingPat = await payload.find({
              collection: 'patients',
              where: { tenant: { equals: targetTenantID }, phone: { equals: cleanPhone } },
              limit: 1,
              overrideAccess: true,
            })
            if (existingPat.docs.length > 0) {
              patient = await payload.update({
                collection: 'patients',
                id: existingPat.docs[0].id,
                overrideAccess: true,
                data: {
                  name: row.name,
                  gender: ['male', 'female', 'other'].includes(gender) ? gender : 'other',
                  ageYears,
                } as never,
              })
            }
          }

          if (!patient) {
            patient = await payload.create({
              collection: 'patients',
              overrideAccess: true,
              data: {
                tenant: targetTenantID,
                name: row.name,
                phone: cleanPhone,
                gender: ['male', 'female', 'other'].includes(gender) ? gender : 'other',
                ageYears,
                mrn: row.mrn || undefined,
              } as never,
            })
          }

          if (row.email) {
            const existingUser = await payload.find({
              collection: 'users',
              where: { email: { equals: row.email.toLowerCase() } },
              limit: 1,
              overrideAccess: true,
            })
            if (existingUser.docs.length === 0) {
              await payload.create({
                collection: 'users',
                overrideAccess: true,
                data: {
                  name: row.name,
                  email: row.email.toLowerCase(),
                  password: patientPassword,
                  role: 'patient',
                  tenant: targetTenantID,
                  phone: cleanPhone,
                  patientProfile: patient.id,
                  active: true,
                  emailVerified: true,
                } as never,
              }).catch(() => {})
            }
          }

          importedCount++
        } catch (err: any) {
          errors.push({ row: i, reason: err.message || 'Failed to create or update patient record.' })
        }
      } else if (normalizedType === 'appointments') {
        if (!row.patient_email || !row.doctor_email || !row.start) {
          errors.push({ row: i, reason: 'Missing required patient_email, doctor_email, or start time.' })
          continue
        }

        const targetTenantID = await resolveTenantID(payload, isSuper, actor, row, i)
        if (!targetTenantID) {
          errors.push({ row: i, reason: `Could not determine target clinic tenant for row ${i}.` })
          continue
        }

        if (!tenantPatientsCache.has(targetTenantID)) {
          const patRes = await payload.find({
            collection: 'patients',
            where: { tenant: { equals: targetTenantID } },
            limit: 200,
            overrideAccess: true,
          })
          tenantPatientsCache.set(targetTenantID, patRes.docs)
        }

        if (!tenantDoctorsCache.has(targetTenantID)) {
          const docRes = await payload.find({
            collection: 'users',
            where: { tenant: { equals: targetTenantID }, role: { equals: 'doctor' } },
            limit: 100,
            overrideAccess: true,
          })
          tenantDoctorsCache.set(targetTenantID, docRes.docs)
        }

        const clinicPatients = tenantPatientsCache.get(targetTenantID) || []
        const clinicDoctors = tenantDoctorsCache.get(targetTenantID) || []

        const targetPatEmail = row.patient_email ? row.patient_email.toLowerCase() : ''
        const targetPatName = (row.patient_name || '').trim().toLowerCase()

        let matchedPat = clinicPatients.find(
          (p: any) => targetPatName && p.name && p.name.trim().toLowerCase() === targetPatName
        )

        let patientID: string | null = matchedPat ? String(matchedPat.id) : null

        if (!patientID) {
          const patientName = row.patient_name || targetPatEmail.split('@')[0].replace(/[^a-zA-Z]/g, ' ') || 'Patient'
          const newPat = await payload.create({
            collection: 'patients',
            overrideAccess: true,
            data: {
              tenant: targetTenantID,
              name: patientName,
              phone: `+9198470${Math.floor(100000 + Math.random() * 900000)}`,
              gender: 'other',
              ageYears: 30,
            } as never,
          })
          patientID = String(newPat.id)
          clinicPatients.push(newPat)
        }

        const targetDocEmail = row.doctor_email.toLowerCase()
        const matchedDoc = clinicDoctors.find((d: any) => d.email && d.email.toLowerCase() === targetDocEmail) || clinicDoctors[0]

        if (!matchedDoc) {
          errors.push({ row: i, reason: `Doctor with email '${row.doctor_email}' not found in clinic.` })
          continue
        }

        const startDate = new Date(row.start)
        if (isNaN(startDate.getTime())) {
          errors.push({ row: i, reason: `Invalid start time format '${row.start}'. Use ISO format (e.g. 2026-03-30T10:00:00.000Z).` })
          continue
        }

        const duration = row.durationmins ? Number(row.durationmins) : 15
        const status = ['scheduled', 'checked-in', 'completed', 'cancelled', 'no-show'].includes(row.status) ? row.status : 'scheduled'

        if (!tenantApptsCache.has(targetTenantID)) {
          const apptsRes = await payload.find({
            collection: 'appointments',
            where: { tenant: { equals: targetTenantID } },
            limit: 300,
            overrideAccess: true,
          })
          tenantApptsCache.set(targetTenantID, apptsRes.docs)
        }
        const clinicAppts = tenantApptsCache.get(targetTenantID) || []

        const matchedAppt = clinicAppts.find(
          (a: any) =>
            String(relId(a.doctor)) === String(matchedDoc.id) &&
            new Date(a.start).toISOString() === startDate.toISOString()
        )

        try {
          if (matchedAppt) {
            await payload.update({
              collection: 'appointments',
              id: matchedAppt.id,
              overrideAccess: true,
              data: {
                patient: patientID,
                durationMins: duration,
                status: status as any,
                reason: row.reason || 'General Consultation',
              } as never,
            })
          } else {
            const newAppt = await payload.create({
              collection: 'appointments',
              overrideAccess: true,
              data: {
                tenant: targetTenantID,
                patient: patientID,
                doctor: matchedDoc.id,
                start: startDate.toISOString(),
                durationMins: duration,
                status: status as any,
                reason: row.reason || 'General Consultation',
              } as never,
            })
            clinicAppts.push(newAppt)
          }
          importedCount++
        } catch (err: any) {
          errors.push({ row: i, reason: err.message || 'Failed to create appointment record.' })
        }
      } else if (normalizedType === 'medicines') {
        const brandName = row.brandname || row['brand name'] || row.brand || row.name
        const genericName = row.genericname || row['generic name'] || row.generic || row.composition || brandName

        if (!brandName) {
          errors.push({ row: i, reason: 'Missing required brand name or medicine name.' })
          continue
        }

        medicinesToInsert.push({
          brandName,
          genericName,
          category: row.category || undefined,
          formulation: row.formulation || row.type || undefined,
          strength: row.strength || undefined,
          defaultFrequency: row.defaultfrequency || row.frequency || undefined,
          defaultDurationDays: row.defaultdurationdays || row.duration ? Number(row.defaultdurationdays || row.duration) : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        importedCount++
      }
    }

    if (normalizedType === 'medicines' && medicinesToInsert.length > 0) {
      try {
        const db = (payload.db as any)?.connection?.db || (payload.db as any)?.collections?.medicines?.collection?.db
        if (db) {
          const bulkOps = medicinesToInsert.map((doc) => ({
            updateOne: {
              filter: { brandName: doc.brandName },
              update: { $set: doc },
              upsert: true,
            },
          }))
          for (let b = 0; b < bulkOps.length; b += 2000) {
            const batch = bulkOps.slice(b, b + 2000)
            await db.collection('medicines').bulkWrite(batch, { ordered: false }).catch(() => {})
          }
        } else {
          for (let b = 0; b < medicinesToInsert.length; b += 100) {
            const batch = medicinesToInsert.slice(b, b + 100)
            await Promise.all(
              batch.map((m) =>
                (payload as any).create({
                  collection: 'medicines',
                  overrideAccess: true,
                  data: m as never,
                }).catch(() => null)
              )
            )
          }
        }
      } catch {}
    }

    const tenantForAudit = getTenantID(actor)
    if (tenantForAudit) {
      await (payload.create as any)({
        collection: 'auditLogs',
        overrideAccess: true,
        data: {
          tenant: tenantForAudit,
          user: actor.id,
          action: 'user.created' as any,
          summary: `Imported ${importedCount} ${normalizedType} records from CSV (${errors.length} failed rows)`,
        },
      }).catch(() => {})
    }

    return Response.json({ ok: true, importedCount, errorsCount: errors.length, errors })
  } catch (err: any) {
    return Response.json({ error: err.message || 'Import failed due to processing error.' }, { status: 500 })
  }
}
