import { getPayload } from 'payload'
import config from '@payload-config'
import { isSuperAdmin, getTenantID } from '@/access'
import type { User } from '@/payload-types'
import { relId } from '@/lib/utils'
import crypto from 'crypto'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

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

function getMongoDbInstance(payload: any): any {
  if (!payload || !payload.db) return null
  const db = payload.db
  return (
    db.connection?.db ||
    db.mongoose?.connection?.db ||
    db.collections?.appointments?.collection?.db ||
    db.collections?.users?.collection?.db ||
    db.models?.appointments?.collection?.db ||
    db.client?.db() ||
    null
  )
}

function toBsonId(idStr?: any): any {
  if (!idStr) return crypto.randomBytes(12).toString('hex')
  const str = String(idStr.id || idStr._id || idStr)
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    try {
      const mongoose = require('mongoose')
      return new mongoose.Types.ObjectId(str)
    } catch {
      return str
    }
  }
  return str
}

async function resolveTenantID(
  payload: any,
  isSuper: boolean,
  actor: any,
  row: Record<string, string>,
  rowIndex?: number,
  cachedTenantsDocs?: any[],
): Promise<string | null> {
  // Non-superadmin staff are strictly bound to their own authenticated session tenant ID
  if (!isSuper) {
    const actorTenant = getTenantID(actor)
    return actorTenant ? String(actorTenant) : null
  }

  const rawClinicKey = row.clinic_name || row['clinic name'] || row.clinic || row.tenantid || row.clinic_id || ''

  const allTenantsDocs = cachedTenantsDocs || (
    await payload.find({
      collection: 'tenants',
      limit: 100,
      overrideAccess: true,
    })
  ).docs

  if (rawClinicKey) {
    const targetName = rawClinicKey.trim().toLowerCase()
    const matched = allTenantsDocs.find((t: any) => String(t.id) === rawClinicKey || t.name.trim().toLowerCase() === targetName)
    if (matched) {
      return String(matched.id)
    }
  }

  if (allTenantsDocs.length > 0) {
    const index = (rowIndex !== undefined ? rowIndex : 0) % allTenantsDocs.length
    return String(allTenantsDocs[index].id)
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
    const appointmentsToInsert: any[] = []
    const patientsToInsert: any[] = []
    const patientUsersToInsert: any[] = []
    const walkInTokenTracker = new Map<string, number>()

    const cachedTenantsRes = await payload.find({
      collection: 'tenants',
      limit: 100,
      overrideAccess: true,
    })
    const cachedTenantsDocs = cachedTenantsRes.docs

    const allPatientsRes = await payload.find({
      collection: 'patients',
      limit: 1000,
      overrideAccess: true,
    })
    const globalPatients = allPatientsRes.docs

    const allDoctorsRes = await payload.find({
      collection: 'users',
      where: { role: { equals: 'doctor' } },
      limit: 200,
      overrideAccess: true,
    })
    const globalDoctors = allDoctorsRes.docs

    const allUsersRes = await payload.find({
      collection: 'users',
      limit: 1000,
      overrideAccess: true,
    })
    const globalUsers = allUsersRes.docs

    const existingPatientPhoneMap = new Map<string, any>()
    for (const p of globalPatients) {
      if (p.phone) {
        const tid = typeof p.tenant === 'object' ? String(p.tenant.id) : String(p.tenant)
        existingPatientPhoneMap.set(`${tid}_${p.phone}`, p)
      }
    }

    const existingUserEmailMap = new Map<string, any>()
    for (const u of globalUsers) {
      if (u.email) {
        existingUserEmailMap.set(u.email.toLowerCase(), u)
      }
    }

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

        const targetTenantID = await resolveTenantID(payload, isSuper, actor, row, i, cachedTenantsDocs)
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
        try {
          if (!row.name || !row.phone) {
            errors.push({ row: i, reason: 'Missing required patient name or phone.' })
            continue
          }

          const targetTenantID = await resolveTenantID(payload, isSuper, actor, row, i, cachedTenantsDocs)
          if (!targetTenantID) {
            errors.push({ row: i, reason: `Could not determine target clinic tenant for row ${i}. Please check clinic name.` })
            continue
          }

          const ageYears = row.ageyears || row.age ? Number(row.ageyears || row.age) : 30
          const gender = row.gender ? row.gender.toLowerCase() : 'other'
          const rawPhone = row.phone || ''
          const cleanPhone = /^\+?[0-9]{7,15}$/.test(rawPhone.replace(/[\s-]/g, '')) ? rawPhone : undefined
          const patientPassword = row.password || 'Test@123'

          const cacheKey = `${targetTenantID}_${cleanPhone}`
          let existingPat = existingPatientPhoneMap.get(cacheKey)

          let patientId: any
          if (!existingPat) {
            patientId = toBsonId(crypto.randomBytes(12).toString('hex'))
            const newPatDoc = {
              _id: patientId,
              tenant: toBsonId(targetTenantID),
              name: row.name,
              phone: cleanPhone,
              gender: ['male', 'female', 'other'].includes(gender) ? gender : 'other',
              ageYears,
              mrn: row.mrn || `MRN-TH-${String(i).padStart(3, '0')}`,
              createdAt: new Date(),
              updatedAt: new Date(),
            }
            patientsToInsert.push(newPatDoc)
            existingPatientPhoneMap.set(cacheKey, newPatDoc)
          } else {
            patientId = toBsonId(existingPat.id || existingPat._id)
          }

          if (row.email) {
            const targetEmail = row.email.toLowerCase()
            if (!existingUserEmailMap.has(targetEmail)) {
              const newUserDoc = {
                _id: toBsonId(crypto.randomBytes(12).toString('hex')),
                name: row.name,
                email: targetEmail,
                password: patientPassword,
                role: 'patient',
                tenant: toBsonId(targetTenantID),
                phone: cleanPhone,
                patientProfile: patientId,
                active: true,
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
              }
              patientUsersToInsert.push(newUserDoc)
              existingUserEmailMap.set(targetEmail, newUserDoc)
            }
          }

          importedCount++
        } catch (err: any) {
          errors.push({ row: i, reason: err.message || 'Failed to process patient record.' })
        }
      } else if (normalizedType === 'appointments') {
        try {
          if (!row.patient_email || !row.doctor_email || !row.start) {
            errors.push({ row: i, reason: 'Missing required patient_email, doctor_email, or start time.' })
            continue
          }

          const targetTenantID = await resolveTenantID(payload, isSuper, actor, row, i, cachedTenantsDocs)
          if (!targetTenantID) {
            errors.push({ row: i, reason: `Could not determine target clinic tenant for row ${i}.` })
            continue
          }

          const targetPatEmail = (row.patient_email || '').trim().toLowerCase()
          const targetPatName = (row.patient_name || '').trim().toLowerCase()

          let matchedPat = globalPatients.find(
            (p: any) =>
              (targetPatName && p.name && p.name.trim().toLowerCase() === targetPatName) ||
              (targetPatEmail && p.email && p.email.trim().toLowerCase() === targetPatEmail)
          )

          let patientID: string | null = matchedPat ? String(matchedPat.id) : globalPatients[0] ? String(globalPatients[0].id) : null
          if (!patientID) {
            errors.push({ row: i, reason: 'No patient profiles available in database.' })
            continue
          }

          const targetDocEmail = (row.doctor_email || '').trim().toLowerCase()
          let matchedDoc = globalDoctors.find((d: any) => d.email && d.email.trim().toLowerCase() === targetDocEmail) || globalDoctors[0]

          if (!matchedDoc) {
            errors.push({ row: i, reason: `Doctor with email '${row.doctor_email}' not found.` })
            continue
          }

          const startDate = new Date(row.start)
          if (isNaN(startDate.getTime())) {
            errors.push({ row: i, reason: `Invalid start time format '${row.start}'.` })
            continue
          }

          const duration = row.durationmins ? Number(row.durationmins) : 15
          const endDate = new Date(startDate.getTime() + duration * 60 * 1000)
          const status = ['scheduled', 'checked-in', 'completed', 'cancelled', 'no-show'].includes(row.status) ? row.status : 'scheduled'

          const tokenDay = startDate.toISOString().slice(0, 10)
          const isWalkIn = i % 5 === 0
          let tokenNumber: string | undefined = undefined
          if (isWalkIn) {
            const trackerKey = `${targetTenantID}_${tokenDay}`
            const nextTok = (walkInTokenTracker.get(trackerKey) || 0) + 1
            walkInTokenTracker.set(trackerKey, nextTok)
            tokenNumber = `T-${String(nextTok).padStart(2, '0')}`
          }

          appointmentsToInsert.push({
            tenant: targetTenantID,
            patient: patientID,
            doctor: String(matchedDoc.id),
            start: startDate, // BSON Date
            end: endDate, // BSON Date
            durationMins: duration,
            status: status as any,
            reason: row.reason || 'General Consultation',
            isWalkIn,
            tokenNumber,
            tokenDay: isWalkIn ? tokenDay : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          importedCount++
        } catch (err: any) {
          errors.push({ row: i, reason: err.message || 'Error processing appointment row.' })
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

    if (normalizedType === 'patients' && (patientsToInsert.length > 0 || patientUsersToInsert.length > 0)) {
      try {
        const rawDb = getMongoDbInstance(payload)
        if (rawDb) {
          if (patientsToInsert.length > 0) {
            const colP = rawDb.collection('patients')
            for (let b = 0; b < patientsToInsert.length; b += 500) {
              const batch = patientsToInsert.slice(b, b + 500)
              await colP.insertMany(batch, { ordered: false }).catch(() => {})
            }
          }
          if (patientUsersToInsert.length > 0) {
            const colU = rawDb.collection('users')
            for (let b = 0; b < patientUsersToInsert.length; b += 500) {
              const batch = patientUsersToInsert.slice(b, b + 500)
              await colU.insertMany(batch, { ordered: false }).catch(() => {})
            }
          }
        }
      } catch (err: any) {
        console.error('Patients insertion error:', err)
      }
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
