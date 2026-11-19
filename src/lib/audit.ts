// Audit trail writer (v3 spec §2.2). The audit log is append-only and written ONLY
// from server-side hooks via this helper — never from the REST API (collection access
// denies create/update/delete for everyone, superAdmin included).

import type { PayloadRequest } from 'payload'
import { getTenantID } from '@/access'
import type { AuditAction } from '@/lib/constants'

export type AuditEntry = {
  action: AuditAction
  targetCollection: string
  targetId: string
  summary: string
  meta?: Record<string, unknown>
  /** Override the tenant (e.g. tenant.suspended — the actor is a super admin with no tenant). */
  tenantID?: string | null
  /** Override the actor (defaults to req.user). */
  userID?: string | null
}

export async function logAudit(req: PayloadRequest, entry: AuditEntry): Promise<void> {
  try {
    const tenantID = entry.tenantID ?? getTenantID(req.user as never)
    const userID = entry.userID ?? (req.user?.id != null ? String(req.user.id) : null)
    if (!tenantID || !userID) return

    await req.payload.create({
      collection: 'auditLogs',
      req,
      overrideAccess: true,
      data: {
        tenant: tenantID,
        user: userID,
        action: entry.action,
        targetCollection: entry.targetCollection,
        targetId: entry.targetId,
        summary: entry.summary,
        meta: entry.meta ?? undefined,
      } as never,
    })
  } catch (err) {
    req.payload.logger?.error?.({ err, action: entry.action }, 'logAudit failed (non-fatal)')
  }
}
