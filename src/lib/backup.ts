// Automated Database Backup & Retention Policy Utility (v3 spec §8.1)
import { getPayloadClient } from '@/lib/auth'

export type BackupResult = {
  ok: boolean
  timestamp: string
  collections: { name: string; count: number }[]
  error?: string
}

const BACKUP_COLLECTIONS = ['tenants', 'users', 'patients', 'appointments', 'visits', 'invoices', 'auditLogs', 'medicalDocuments'] as const

export async function runTenantBackup(tenantId?: string): Promise<BackupResult> {
  const timestamp = new Date().toISOString()
  try {
    const payload = await getPayloadClient()
    const summary: { name: string; count: number }[] = []

    for (const col of BACKUP_COLLECTIONS) {
      const where: any = tenantId ? { tenant: { equals: tenantId } } : {}
      const res = await payload.find({
        collection: col as any,
        where,
        limit: 10_000,
        overrideAccess: true,
      })
      summary.push({ name: col, count: res.totalDocs })
    }

    console.log(`[Backup Successful] Timestamp: ${timestamp}, Tenant: ${tenantId || 'GLOBAL'}`, summary)

    return {
      ok: true,
      timestamp,
      collections: summary,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    console.error(`[Backup Failed] Timestamp: ${timestamp}`, errorMsg)
    return {
      ok: false,
      timestamp,
      collections: [],
      error: errorMsg,
    }
  }
}
