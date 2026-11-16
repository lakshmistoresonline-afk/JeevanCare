import { getPayloadClient } from '@/lib/auth'
import { KioskCheckInClient } from '@/components/KioskCheckInClient'

export const dynamic = 'force-dynamic'

export default async function KioskCheckInPage() {
  const payload = await getPayloadClient()

  const tenantsRes = await payload.find({
    collection: 'tenants',
    limit: 50,
    overrideAccess: true,
    select: {
      id: true,
      name: true,
      city: true,
    },
  })

  const clinics = tenantsRes.docs.map((t: any) => ({
    id: String(t.id),
    name: t.name,
    city: t.city || 'Kerala',
  }))

  return <KioskCheckInClient clinics={clinics} />
}
