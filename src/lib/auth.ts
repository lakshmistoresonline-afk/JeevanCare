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

function parseCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export async function getCurrentUser(workspaceScope?: 'super' | 'staff' | 'patient'): Promise<User | null> {
  const payload = await getPayloadClient()
  const reqHeaders = await nextHeaders()
  const cookieHeader = reqHeaders.get('cookie') || ''

  let activeToken: string | null = null
  if (workspaceScope === 'super') {
    activeToken = parseCookie(cookieHeader, 'payload-token-super')
  } else if (workspaceScope === 'staff') {
    activeToken = parseCookie(cookieHeader, 'payload-token-staff')
  } else if (workspaceScope === 'patient') {
    activeToken = parseCookie(cookieHeader, 'payload-token-patient')
  }

  if (!activeToken) {
    activeToken = parseCookie(cookieHeader, 'payload-token')
  }

  const customHeaders = new Headers()
  if (cookieHeader) customHeaders.set('cookie', cookieHeader)
  if (activeToken) {
    customHeaders.set('cookie', `payload-token=${activeToken}`)
    customHeaders.set('authorization', `JWT ${activeToken}`)
  }

  const { user } = await payload.auth({ headers: customHeaders }).catch(() => ({ user: null }))
  if (!user || (user as User).active === false) return null
  return (user as User) ?? null
}

export type Session = {
  user: User
  tenant: Tenant | null
}

export const requireDashboardSession = cache(async (): Promise<{ user: User; tenant: Tenant | null }> => {
  const user = await getCurrentUser('staff')
  if (!user || user.active === false) redirect('/login?error=account_deactivated')
  if ((user as any).role === 'patient') redirect('/patient/dashboard')
  if (user.role === 'superAdmin') {
    return { user, tenant: null }
  }

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
  const user = await getCurrentUser('patient')
  if (!user || user.active === false) redirect('/login?error=account_deactivated')
  if ((user as any).role !== 'patient') redirect('/dashboard')

  const payload = await getPayloadClient()
  let patient: any = null
  let tenantID = getTenantID(user)

  // 1. Try to find linked patientProfile by ID
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

  // 2. Fallback: Search patients collection by user.email if patientProfile reference wasn't linked
  if (!patient && user.email) {
    const pRes = await payload.find({
      collection: 'patients',
      where: { email: { equals: user.email } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }).catch(() => ({ docs: [] }))
    if (pRes.docs.length > 0) {
      patient = pRes.docs[0]
    }
  }

  // 3. Fallback: Search patients collection by user.phone if patientProfile wasn't linked
  if (!patient && (user as any).phone) {
    const pRes = await payload.find({
      collection: 'patients',
      where: { phone: { equals: (user as any).phone } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }).catch(() => ({ docs: [] }))
    if (pRes.docs.length > 0) {
      patient = pRes.docs[0]
    }
  }

  // 4. Infer tenantID from patient.tenant if user.tenant is missing
  if (patient && patient.tenant) {
    tenantID = tenantID || relId(patient.tenant)
  }

  // 5. If tenantID is still missing, fallback to first active tenant
  if (!tenantID) {
    const defaultTenantRes = await payload.find({
      collection: 'tenants',
      where: { status: { equals: 'active' } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }).catch(() => ({ docs: [] }))
    if (defaultTenantRes.docs.length > 0) {
      tenantID = String(defaultTenantRes.docs[0].id)
    }
  }

  if (!tenantID) redirect('/login?error=no_clinic_tenant')

  const tenant = await payload.findByID({
    collection: 'tenants',
    id: tenantID,
    depth: 0,
    overrideAccess: true,
  }).catch(() => null)

  if (!tenant || tenant.status !== 'active') {
    redirect('/login?error=clinic_inactive')
  }

  // 6. Auto-create patient document if patient record does not exist yet
  if (!patient && tenant) {
    patient = await payload.create({
      collection: 'patients',
      data: {
        tenant: tenant.id,
        name: user.name || 'Patient User',
        email: user.email,
        phone: (user as any).phone || '+919847000000',
      } as any,
      overrideAccess: true,
    }).catch(() => null)

    if (patient) {
      await payload.update({
        collection: 'users',
        id: user.id,
        data: { patientProfile: patient.id, tenant: tenant.id } as any,
        overrideAccess: true,
      }).catch(() => {})
    }
  }

  if (!patient) {
    redirect('/login?error=no_patient_profile')
  }

  return { user, patient, tenant }
})

export async function requireRole(session: Session, roles: User['role'][]) {
  if (!roles.includes(session.user.role)) redirect('/dashboard')
}

export const requireSuperAdmin = cache(async (): Promise<User> => {
  const user = await getCurrentUser('super')
  if (!user || user.active === false) redirect('/login?error=account_deactivated')
  if (user.role !== 'superAdmin') redirect('/dashboard')
  return user
})
