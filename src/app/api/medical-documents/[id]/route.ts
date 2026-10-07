import { NextResponse } from 'next/server'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { getTenantID, getPatientID, isSuperAdmin } from '@/access'
import { sanitizePathFilename } from '@/lib/fileSecurity'
import { logAudit } from '@/lib/audit'
import fs from 'fs'
import path from 'path'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayloadClient()
  try {
    const doc = (await payload.findByID({
      collection: 'medical-documents' as any,
      id,
      depth: 0,
      overrideAccess: true,
    })) as any

    if (!doc) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Archived document check for patients
    if (doc.status === 'archived' && (user as any).role === 'patient') {
      return NextResponse.json({ error: 'Document archived' }, { status: 404 })
    }

    // Tenant check & Patient ownership check
    if (!isSuperAdmin(user)) {
      const tenantID = getTenantID(user)
      const docTenantID = typeof doc.tenant === 'object' ? String(doc.tenant.id) : String(doc.tenant)
      if (!tenantID || docTenantID !== tenantID) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      if ((user as any).role === 'patient') {
        const patientID = getPatientID(user)
        const docPatientID = typeof doc.patient === 'object' ? String(doc.patient.id) : String(doc.patient)
        if (!patientID || docPatientID !== patientID) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
      }
    }

    // Resolve file path safely preventing path traversal
    const rawFilename = doc.filename
    if (!rawFilename) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const safeFilename = sanitizePathFilename(rawFilename)
    const filePath = path.resolve(process.cwd(), 'media', safeFilename)

    // Ensure path resolves inside the media directory
    const mediaDir = path.resolve(process.cwd(), 'media')
    if (!filePath.startsWith(mediaDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 })
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    // Log download audit event
    const tenantID = typeof doc.tenant === 'object' ? String(doc.tenant.id) : String(doc.tenant)
    await logAudit({ payload, user: user as any } as any, {
      targetCollection: 'medical-documents',
      targetId: String(doc.id),
      tenantID,
      action: 'export.generated',
      summary: `Downloaded medical document: ${doc.title} (${safeFilename})`,
    }).catch(() => {})

    const fileBuffer = fs.readFileSync(filePath)
    const mimeType = doc.mimeType || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${safeFilename}"`,
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
