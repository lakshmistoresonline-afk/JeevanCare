import { getPayload } from 'payload'
import config from '@payload-config'
import { isSuperAdmin } from '@/access'
import type { User } from '@/payload-types'
import { seedFullIndianMedicineCatalog } from '@/lib/bulkMedicineImporter'

export async function POST(req: Request) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: req.headers as never })
  if (!user) return Response.json({ error: 'Sign in to import medicines.' }, { status: 401 })

  const actor = user as unknown as User
  if (!isSuperAdmin(actor) && actor.role !== 'owner') {
    return Response.json({ error: 'Only owners or super-admins can import medicine catalogs.' }, { status: 403 })
  }

  try {
    const res = await seedFullIndianMedicineCatalog()
    if (!res.ok) {
      return Response.json({ error: res.error || 'Medicine catalog import failed.' }, { status: 500 })
    }
    return Response.json({ ok: true, importedCount: res.totalSeeded })
  } catch (err: any) {
    return Response.json({ error: err.message || 'Server error during medicine import.' }, { status: 500 })
  }
}
