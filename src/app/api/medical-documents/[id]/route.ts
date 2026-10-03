import { NextResponse } from 'next/server'
import { getCurrentUser, getPayloadClient } from '@/lib/auth'
import { getTenantID, isSuperAdmin } from '@/access'
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

    // Tenant check
    if (!isSuperAdmin(user)) {
      const tenantID = getTenantID(user)
      const docTenantID = typeof doc.tenant === 'object' ? String(doc.tenant.id) : String(doc.tenant)
      if (!tenantID || docTenantID !== tenantID) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Resolve file path
    const filename = doc.filename
    if (!filename) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    const filePath = path.resolve(process.cwd(), 'media', filename)
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)
    const mimeType = doc.mimeType || 'application/octet-stream'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (_err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
