import { getPayload } from 'payload'
import config from '@payload-config'
import { isSuperAdmin, getTenantID } from '@/access'
import type { User } from '@/payload-types'

export async function POST(req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params
  if (!['clinics', 'staff'].includes(type)) {
    return Response.json({ error: 'Unknown import type.' }, { status: 404 })
  }

  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: req.headers as never })
  if (!user) return Response.json({ error: 'Sign in to import data.' }, { status: 401 })

  const actor = user as unknown as User
  if (!isSuperAdmin(actor) && actor.role !== 'owner') {
    return Response.json({ error: 'Only admins or clinic owners can import data.' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return Response.json({ error: 'No file uploaded.' }, { status: 400 })

    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length < 2) return Response.json({ error: 'CSV file is empty or missing header.' }, { status: 400 })

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase())
    let importedCount = 0

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''))
      const row: Record<string, string> = {}
      headers.forEach((h, idx) => {
        row[h] = values[idx] || ''
      })

      if (type === 'clinics' && row.name && row.phone) {
        await payload.create({
          collection: 'tenants',
          overrideAccess: true,
          data: {
            name: row.name,
            phone: row.phone,
            city: row.city || 'India',
            state: row.state || 'State',
            country: 'India',
            status: 'active',
            plan: 'plus',
            settings: {
              currency: row.currency || 'INR',
              timezone: 'Asia/Kolkata',
              appointmentDurationMins: 15,
              openTime: '09:00',
              closeTime: '17:00',
            },
          } as never,
        })
        importedCount++
      } else if (type === 'staff' && row.name && row.email && row.role) {
        const tenantID = isSuperAdmin(actor) ? row.tenantid || getTenantID(actor) : getTenantID(actor)
        if (!tenantID) continue

        await payload.create({
          collection: 'users',
          overrideAccess: true,
          data: {
            name: row.name,
            email: row.email,
            password: row.password || 'Test@123',
            role: row.role as any,
            tenant: tenantID,
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

    return Response.json({ ok: true, importedCount })
  } catch (err: any) {
    return Response.json({ error: err.message || 'Import failed.' }, { status: 500 })
  }
}
