import { JeevanCareHeader } from '@/components/JeevanCareHeader'
import { ClinicDoctorFinder } from '@/components/ClinicDoctorFinder'
import { getPayloadClient } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Clinics & Doctors Directory — JeevanCare',
  description: 'Search verified outpatient clinics and specialist doctors in Thrissur, Kerala and book consultation slots.',
}

export default async function ClinicsPage() {
  let clinics: any[] = []
  let doctors: any[] = []

  try {
    const payload = await getPayloadClient()

    // 1. Query active tenants only
    const tenantsRes = await payload.find({
      collection: 'tenants',
      where: { status: { equals: 'active' } },
      limit: 50,
      overrideAccess: true,
    })

    // 2. Sanitize public tenant DTOs — NEVER expose private tenant settings or sensitive fields
    clinics = tenantsRes.docs.map((c: any) => ({
      id: String(c.id),
      name: c.name,
      city: c.city || null,
      district: c.district || null,
      state: c.state || null,
      phone: c.phone || null,
    }))

    // 3. Query active doctors belonging to active clinics only
    const activeTenantIds = new Set(clinics.map((c) => c.id))
    const doctorsRes = await payload.find({
      collection: 'users',
      where: { role: { equals: 'doctor' }, active: { equals: true } },
      limit: 100,
      overrideAccess: true,
    })

    // 4. Sanitize public doctor DTOs — NEVER expose emails, phones, passwords, or tenant internals
    doctors = doctorsRes.docs
      .filter((d: any) => {
        const tId = typeof d.tenant === 'object' && d.tenant !== null ? String(d.tenant.id) : String(d.tenant)
        return activeTenantIds.has(tId)
      })
      .map((d: any) => ({
        id: String(d.id),
        name: d.name,
        specialty: d.specialty || null,
        consultationFee: d.consultationFee ?? null,
        tenant: typeof d.tenant === 'object' && d.tenant !== null ? String(d.tenant.id) : String(d.tenant),
      }))
  } catch (err) {
    console.error('ClinicsPage data fetch failed gracefully during build/runtime:', err)
  }

  return (
    <main className="min-h-screen bg-canvas text-ink flex flex-col justify-between">
      <div>
        <JeevanCareHeader />
        <div className="py-8">
          <ClinicDoctorFinder clinics={clinics} doctors={doctors} />
        </div>
      </div>

      <footer className="border-t border-border/80 bg-card py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 sm:px-8 lg:px-12 text-xs text-faint">
          <span className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-lg bg-primary text-white font-bold text-xs">J</span>
            <span className="font-display text-base font-bold text-primary">JeevanCare</span>
          </span>
          <span>JeevanCare · Your Trusted Healthcare Companion</span>
        </div>
        <div className="mt-3 text-center text-xs font-medium text-muted-foreground">
          Designed &amp; Developed by <span className="font-bold text-ink">Subramanian T S</span>, <span className="font-semibold text-primary">WebCraft Digital Solutions</span>.
        </div>
      </footer>
    </main>
  )
}
