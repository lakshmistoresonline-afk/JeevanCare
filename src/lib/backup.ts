// Automated Database Backup & Retention Policy Utility (v3 spec §8.1)
import { getPayloadClient } from '@/lib/auth'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

export type BackupResult = {
  ok: boolean
  timestamp: string
  backupPath?: string
  checksumSha256?: string
  collections: { name: string; count: number }[]
  error?: string
}

const BACKUP_COLLECTIONS = ['tenants', 'users', 'patients', 'appointments', 'visits', 'invoices', 'auditLogs', 'medical-documents', 'medicines'] as const

export async function runTenantBackup(tenantId?: string): Promise<BackupResult> {
  const timestamp = new Date().toISOString()
  const fileDateStr = timestamp.replace(/[:.]/g, '-')
  try {
    const payload = await getPayloadClient()
    const summary: { name: string; count: number }[] = []
    const fullBackupData: Record<string, any[]> = {}

    for (const col of BACKUP_COLLECTIONS) {
      const where: any = tenantId ? { tenant: { equals: tenantId } } : {}
      const res = await (payload as any).find({
        collection: col,
        where,
        limit: 10_000,
        overrideAccess: true,
      })
      summary.push({ name: col, count: res.totalDocs })
      fullBackupData[col] = res.docs
    }

    const backupDir = path.resolve(process.cwd(), 'backups')
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true })
    }

    const backupFilename = `jeevancare_backup_${tenantId ? `tenant_${tenantId}` : 'global'}_${fileDateStr}.json`
    const backupFilePath = path.join(backupDir, backupFilename)

    const backupJsonString = JSON.stringify(
      {
        version: '1.0',
        platform: 'JeevanCare Enterprise',
        timestamp,
        tenantId: tenantId || 'GLOBAL',
        summary,
        data: fullBackupData,
      },
      null,
      2
    )

    fs.writeFileSync(backupFilePath, backupJsonString, 'utf8')
    const checksumSha256 = crypto.createHash('sha256').update(backupJsonString).digest('hex')

    console.log(`[Backup Created] Path: ${backupFilePath}, SHA256: ${checksumSha256}`, summary)

    return {
      ok: true,
      timestamp,
      backupPath: backupFilePath,
      checksumSha256,
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
