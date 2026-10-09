import type { Access, FieldAccess, Where } from 'payload'
import type { User } from '@/payload-types'

/** Extract the tenant id from a user whose `tenant` may be an id, ObjectId, or populated doc. */
export function getTenantID(user?: User | null): any {
  if (!user) return null
  const t = (user as any).tenant as unknown
  if (!t) return null
  if (typeof t === 'string') return t
  if (typeof t === 'number') return String(t)
  if (typeof t === 'object') {
    if ('id' in (t as Record<string, unknown>)) {
      return String((t as { id: string | number }).id)
    }
    if ('_id' in (t as Record<string, unknown>)) {
      return String((t as { _id: string | number })._id)
    }
    if (typeof (t as any).toHexString === 'function') {
      return (t as any).toHexString()
    }
    if (typeof (t as any).toString === 'function') {
      const s = (t as any).toString()
      if (s && s !== '[object Object]') return s
    }
  }
  return String(t)
}

/** Extract the patient id from a user whose `patientProfile` may be an id or a populated doc. */
export function getPatientID(user?: User | null): string | null {
  if (!user) return null
  const p = (user as any).patientProfile as unknown
  if (!p) return null
  if (typeof p === 'string') return p
  if (typeof p === 'number') return String(p)
  if (typeof p === 'object') {
    if ('id' in (p as Record<string, unknown>)) {
      return String((p as { id: string | number }).id)
    }
    if ('_id' in (p as Record<string, unknown>)) {
      return String((p as { _id: string | number })._id)
    }
    if (typeof (p as any).toHexString === 'function') {
      return (p as any).toHexString()
    }
    if (typeof (p as any).toString === 'function') {
      const s = (p as any).toString()
      if (s && s !== '[object Object]') return s
    }
  }
  return String(p)
}

export const isSuperAdmin = (user?: User | null): boolean => user?.role === 'superAdmin'

/** Collection access: true for superAdmin, otherwise tenant-scoped query, deny if unknown. */
export const tenantScoped: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const tenantID = getTenantID(user)
  if (!tenantID) return false // malformed user ⇒ deny, never default-allow
  return { tenant: { equals: String(tenantID) } }
}

/**
 * Patient Self Access:
 * SuperAdmins see all. Staff see records within their tenant.
 * Patient users are strictly restricted to reading ONLY records matching their own patient ID.
 */
export const patientSelfAccess: Access = ({ req }) => {
  const user = req?.user
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const tenantID = getTenantID(user)
  if (!tenantID) return false
  if ((user as any).role === 'patient') {
    const patientID = getPatientID(user)
    if (!patientID) return false

    const tid = String(tenantID)
    const pid = String(patientID)

    const colSlug = (req as any)?.collection?.slug

    if (colSlug === 'patients') {
      return { tenant: { equals: tid }, id: { equals: pid } } as Where
    }
    if (colSlug === 'users') {
      return { id: { equals: String(user.id) } } as Where
    }
    if (colSlug === 'tenants') {
      return { id: { equals: tid } } as Where
    }
    if (colSlug === 'auditLogs') {
      return false
    }

    // Default for clinical collections (appointments, visits, invoices, medical-documents)
    return {
      tenant: { equals: tid },
      patient: { equals: pid },
    } as Where
  }
  return { tenant: { equals: String(tenantID) } } as Where
}

export const patientTenantScoped = patientSelfAccess

/** superAdmin only. */
export const superAdminOnly: Access = ({ req: { user } }) => isSuperAdmin(user)

/**
 * Visits write (create/update): tenant-scoped, but only clinical roles — a
 * receptionist never authors a clinical record (v2 spec §2.1). Read stays
 * tenant-wide (`tenantScoped`) so reception can print.
 */
export const visitsWriteAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const tenantID = getTenantID(user)
  if (!tenantID) return false
  if (user.role === 'doctor' || user.role === 'owner') return { tenant: { equals: String(tenantID) } }
  return false
}

/**
 * Invoices write (create/update): tenant-scoped, but strictly staff roles only.
 * Patients are read-only for invoices and payment records.
 */
export const invoicesWriteAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if ((user as any).role === 'patient') return false
  const tenantID = getTenantID(user)
  if (!tenantID) return false
  return { tenant: { equals: String(tenantID) } }
}

/**
 * Tenants collection read: superAdmin sees all; a tenant user may read only their
 * own tenant doc (for clinic name / settings in the UI).
 */
export const tenantSelfRead: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const tenantID = getTenantID(user)
  if (!tenantID) return false
  return { id: { equals: String(tenantID) } }
}

/**
 * Users read: superAdmin sees all; patient users see ONLY their own User record;
 * staff users see users within their own tenant.
 * Unauthenticated calls are denied -- doctor discovery uses the public endpoint.
 */
export const usersReadAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const tenantID = getTenantID(user)
  if (!tenantID) return false
  if ((user as any).role === 'patient') {
    return { id: { equals: String(user.id) } } as Where
  }
  return { tenant: { equals: String(tenantID) } } as Where
}

/**
 * Users create: superAdmin anywhere; owner within their own tenant. (Role/tenant
 * restrictions are enforced in the hook — see collections/Users.ts.)
 */
export const usersCreateAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  return isSuperAdmin(user) || user.role === 'owner'
}

/**
 * Users update: superAdmin anywhere; owner within their own tenant; everyone may
 * update their own record (field-level access narrows what self can change).
 */
export const usersUpdateAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  const tenantID = getTenantID(user)
  if (!tenantID) return false
  if (user.role === 'owner') return { tenant: { equals: String(tenantID) } } as Where
  return { id: { equals: String(user.id) } } as Where // self only
}

/**
 * Audit logs read: superAdmin sees all; owner sees only their own clinic's log.
 * Doctors and receptionists never see the audit trail (spec §2.2).
 */
export const auditReadAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if (user.role !== 'owner') return false
  const tenantID = getTenantID(user)
  if (!tenantID) return false
  return { tenant: { equals: String(tenantID) } }
}

/** Field-level: only superAdmin or owner may write this field (e.g. role, active). */
export const superAdminOrOwnerField: FieldAccess = ({ req: { user } }) =>
  isSuperAdmin(user) || user?.role === 'owner'

/** Field-level: only superAdmin. */
export const superAdminField: FieldAccess = ({ req: { user } }) => isSuperAdmin(user)

/**
 * Staff-only write access for medical documents.
 * Patients are READ-ONLY — they cannot create, update, or delete documents.
 * SuperAdmin: full. Staff (owner/doctor/receptionist): tenant-scoped.
 */
export const staffWriteAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if ((user as any).role === 'patient') return false
  const tenantID = getTenantID(user)
  if (!tenantID) return false
  return { tenant: { equals: String(tenantID) } }
}

/**
 * Staff-only write access for appointments.
 * Patients cannot create or update appointments directly through Payload.
 * Patient booking is only allowed through the dedicated patient booking action.
 * SuperAdmin: full. Staff (owner/doctor/receptionist): tenant-scoped.
 */
export const appointmentsWriteAccess: Access = ({ req: { user } }) => {
  if (!user) return false
  if (isSuperAdmin(user)) return true
  if ((user as any).role === 'patient') return false
  const tenantID = getTenantID(user)
  if (!tenantID) return false
  return { tenant: { equals: String(tenantID) } }
}

/** Deny for everyone (used for delete policies). */
export const denyAll: Access = () => false
