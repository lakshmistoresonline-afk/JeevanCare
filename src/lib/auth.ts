import { cache } from 'react'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Tenant, User } from '@/payload-types'
import { getTenantID } from '@/access'
import { relId } from '@/lib/utils'

export async function getPayloadClient() {
  return getPayload({ config: await config })
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const payload = await getPayloadClient()
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })
  if (!user || (user as User).active === false) return null
  return (user as User) ?? null
})

export type Session = {
  user: User
  tenant: Tenant | null
}

export const requireDashboardSession = cache(async (): Promise<Session> => {
  const user = await getCurrentUser()
  if (!user || user.active === false) redirect('/login?error=account_deactivated')
  if (user.role === 'superAdmin') redirect('/super')
  if ((user as any).role === 'patient') redirect('/patient/dashboard')

  const payload = await getPayloadClient()
  const tenantID = getTenantID(user)
  let tenant: Tenant | null = null
  if (tenantID) {
    tenant = await payload.findByID({
      collection: 'tenants',
      id: tenantID,
      depth: 0,
      overrideAccess: true,
    }).catch(() => null)
  }

  if (tenant && tenant.status !== 'active') {
    redirect('/login?error=clinic_inactive')
  }

  return { user, tenant }
})

export type PatientSession = {
  user: User
  patient: any
  tenant: Tenant
}

export const requirePatientSession = cache(async (): Promise<PatientSession> => {
  const user = await getCurrentUser()
  if (!user || user.active === false) redirect('/patient/login?error=account_deactivated')
  if ((user as any).role !== 'patient') redirect('/dashboard')

  const tenantID = getTenantID(user)
  if (!tenantID) redirect('/patient/login')

  const payload = await getPayloadClient()
  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantID,
    depth: 0,
    overrideAccess: true,
  }).catch(() => null)

  if (!tenant || tenant.status !== 'active') {
    redirect('/patient/login?error=clinic_inactive')
  }

  let patient: any = null
  const patientProfile = (user as any).patientProfile
  if (patientProfile) {
    const pid = relId(patientProfile)
    if (pid) {
      patient = await payload.findByID({
        collection: 'patients',
        id: pid,
        depth: 0,
        overrideAccess: true,
      }).catch(() => null)
    }
  }

  // Fail closed if patientProfile is missing, invalid, or does not belong to user's tenant
  if (!patient || String(relId(patient.tenant)) !== String(tenantID)) {
    redirect('/patient/login?error=no_patient_profile')
  }

  return { user, patient, tenant }
})

export async function requireRole(session: Session, roles: User['role'][]) {
  if (!roles.includes(session.user.role)) redirect('/dashboard')
}

export const requireSuperAdmin = cache(async (): Promise<User> => {
  const user = await getCurrentUser()
  if (!user || user.active === false) redirect('/login?error=account_deactivated')
  if (user.role !== 'superAdmin') redirect('/dashboard')
  return user
})
