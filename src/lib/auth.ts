import 'server-only'
import { headers as nextHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@/payload.config'
import type { Tenant, User } from '@/payload-types'
import { getTenantID } from '@/access'

export async function getPayloadClient() {
  return getPayload({ config: await config })
}

export async function getCurrentUser(): Promise<User | null> {
  const payload = await getPayloadClient()
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })
  return (user as User) ?? null
}

export type Session = {
  user: User
  tenant: Tenant | null
}

/**
 * Loads the logged-in tenant user and their clinic. Redirects to /login when not
 * authenticated. SuperAdmins belong in /super, not the tenant dashboard.
 */
export async function requireDashboardSession(): Promise<Session> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
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
    })
  }
  return { user, tenant }
}

export type PatientSession = {
  user: User
  patient: any
  tenant: Tenant
}

export async function requirePatientSession(): Promise<PatientSession> {
  const user = await getCurrentUser()
  if (!user) redirect('/patient/login')
  if ((user as any).role !== 'patient') redirect('/dashboard')

  const payload = await getPayloadClient()
  const tenantID = getTenantID(user)
  if (!tenantID) redirect('/patient/login')

  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantID,
    depth: 0,
    overrideAccess: true,
  })
  if (!tenant) redirect('/patient/login')

  let patient: any = null
  const patientProfile = (user as any).patientProfile
  if (patientProfile) {
    const pid = typeof patientProfile === 'object' ? String((patientProfile as any).id) : String(patientProfile)
    patient = await payload.findByID({
      collection: 'patients',
      id: pid,
      depth: 0,
      overrideAccess: true,
    }).catch(() => null)
  }

  if (!patient) {
    const res = await payload.find({
      collection: 'patients',
      where: {
        tenant: { equals: tenantID },
        or: [
          ...(user.email ? [{ email: { equals: user.email } }] : []),
          ...(user.phone ? [{ phone: { equals: user.phone } }] : []),
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    patient = res.docs[0] ?? null
  }

  if (!patient) {
    redirect('/patient/login?error=no_patient_profile')
  }

  return { user, patient, tenant }
}

/** Require one of the given roles, else redirect to the dashboard home. */
export async function requireRole(session: Session, roles: User['role'][]) {
  if (!roles.includes(session.user.role)) redirect('/dashboard')
}

export async function requireSuperAdmin(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'superAdmin') redirect('/dashboard')
  return user
}
