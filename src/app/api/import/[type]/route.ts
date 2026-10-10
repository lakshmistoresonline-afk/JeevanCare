import { getPayload } from 'payload'
import config from '@payload-config'
import { isSuperAdmin, getTenantID } from '@/access'
import type { User } from '@/payload-types'
import crypto from 'crypto'

const ALLOWED_STAFF_ROLES = ['doctor', 'receptionist'] as const
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB
const MAX_ROW_COUNT = 100

export async function POST(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  const normalizedType = type === 'clinics' ? 'tenants' : type
  if (!['tenants', 'staff'].includes(normalizedType)) {
    return Response.json({ error: 'Unknown or unsupported import type.' }, { status: 404 })
  }

  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: req.headers as never })
  if (!user) return Response.json({ error: 'Sign in to import data.' }, { status: 401 })

  const actor = user as unknown as User
  const isSuper = isSuperAdmin(actor)

  // 1. Authorization Gate
  if (normalizedType === 'tenants') {
    if (!isSuper) {
      return Response.json({ error: 'Only super-admins can import clinic tenants.' }, { status: 403 })
    }
  } else if (normalizedType === 'staff') {
    if (!isSuper && actor.role !== 'owner') {
      return Response.json({ error: 'Only clinic owners or super-admins can import staff.' }, { status: 403 })
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

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''))
    let importedCount = 0
    const errors: { row: number; reason: string }[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ''
      })

      if (normalizedType === 'tenants') {
        if (!row.name || !row.phone) {
          errors.push({ row: i, reason: 'Missing required clinic name or phone.' })
          continue
        }
        await payload.create({
          collection: 'tenants',
          overrideAccess: true,
          data: {
            name: row.name,
            phone: row.phone,
            city: row.city || 'Thrissur',
            state: row.state || 'Kerala',
            country: 'India',
            status: 'active',
            plan: 'clinic',
            settings: {
              currency: 'INR',
              timezone: 'Asia/Kolkata',
              appointmentDurationMins: 15,
              openTime: '09:00',
              closeTime: '17:00',
            },
          } as never,
        })
        importedCount++
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

        // Derive tenant ID strictly from authenticated actor if owner
        const targetTenantID = isSuper ? (row.tenantid || getTenantID(actor)) : getTenantID(actor)
        if (!targetTenantID) {
          errors.push({ row: i, reason: 'Could not determine target clinic tenant.' })
          continue
        }

        // Secure temporary password generation per account if not provided
        const initialPassword = row.password || `Tmp#${crypto.randomBytes(6).toString('hex')}!`

        await payload.create({
          collection: 'users',
          overrideAccess: true,
          data: {
            name: row.name,
            email: row.email.toLowerCase(),
            password: initialPassword,
            role: role as any,
            tenant: targetTenantID,
            phone: row.phone || '',
            specialty: row.specialty || undefined,
            consultationFee: row.fee ? Number(row.fee) : undefined,
            medicalRegistrationNumber: row.regno || undefined,
            active: true,
          } as never,
        })
        importedCount++
      }
    }

    // Write audit log entry
    const tenantForAudit = getTenantID(actor)
    if (tenantForAudit) {
      await payload.create({
        collection: 'auditLogs',
        overrideAccess: true,
        data: {
          tenant: tenantForAudit,
          user: actor.id,
          action: 'import.processed',
          summary: `Imported ${importedCount} ${normalizedType} records from CSV (${errors.length} failed rows)`,
          details: JSON.stringify({ importedCount, errorsCount: errors.length, type: normalizedType }),
        } as never,
      }).catch(() => {})
    }

    return Response.json({
      ok: true,
      importedCount,
      errorsCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err: any) {
    return Response.json({ error: 'Import failed due to processing error.' }, { status: 500 })
  }
}
