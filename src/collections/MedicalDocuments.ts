import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { tenantScoped, denyAll, getTenantID, isSuperAdmin, patientTenantScoped } from '@/access'
import { forceTenant } from '@/hooks/tenant'
import { logAudit } from '@/lib/audit'
import { ERROR_CODES } from '@/lib/constants'
import { relId } from '@/lib/utils'
import {
  validateFileMagicBytes,
  computeSha256,
  generateSafeStorageFilename,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/fileSecurity'

const DOCUMENT_TYPES = [
  { label: 'Lab Report', value: 'LAB_REPORT' },
  { label: 'Blood Test', value: 'BLOOD_TEST' },
  { label: 'Urine Test', value: 'URINE_TEST' },
  { label: 'X-Ray', value: 'X_RAY' },
  { label: 'CT Scan', value: 'CT_SCAN' },
  { label: 'MRI', value: 'MRI' },
  { label: 'Ultrasound', value: 'ULTRASOUND' },
  { label: 'ECG', value: 'ECG' },
  { label: 'Prescription', value: 'PRESCRIPTION' },
  { label: 'Referral Letter', value: 'REFERRAL' },
  { label: 'Discharge Summary', value: 'DISCHARGE_SUMMARY' },
  { label: 'Medical Certificate', value: 'MEDICAL_CERTIFICATE' },
  { label: 'Scanned Document', value: 'SCANNED_DOCUMENT' },
  { label: 'Image', value: 'IMAGE' },
  { label: 'Other', value: 'OTHER' },
]

export const MedicalDocuments: CollectionConfig = {
  slug: 'medical-documents',
  labels: { singular: 'Medical Document', plural: 'Medical Documents' },
  upload: {
    staticDir: 'media',
    mimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    adminThumbnail: 'thumbnail',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'documentType', 'patient', 'documentDate', 'status'],
  },
  access: {
    read: patientTenantScoped,
    create: tenantScoped,
    update: tenantScoped,
    delete: denyAll, // clinical records are archived/soft-deleted rather than hard-deleted
  },
  timestamps: true,
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (!data) return data
        // Assign uploader on create
        if (operation === 'create' && req.user) {
          data.uploadedBy = req.user.id
        }
        // Default document date to now if not provided
        if (!data.documentDate) {
          data.documentDate = new Date().toISOString()
        }

        // File size check (max 10MB limit)
        if (data.filesize && data.filesize > MAX_FILE_SIZE_BYTES) {
          throw new APIError('File size exceeds the 10MB limit.', 400, {
            code: ERROR_CODES.VALIDATION,
          })
        }

        // File buffer validation & SHA-256 checksum
        const fileObj = (req as any).file ?? (req.files as any)?.file ?? (data as any).file
        const fileData = fileObj?.data ?? (Buffer.isBuffer(fileObj) ? fileObj : null)
        if (fileData) {
          const buffer = Buffer.isBuffer(fileData) ? fileData : Buffer.from(fileData)
          if (buffer.length > MAX_FILE_SIZE_BYTES) {
            throw new APIError('File size exceeds the 10MB limit.', 400, {
              code: ERROR_CODES.VALIDATION,
            })
          }

          // Validate magic bytes against strict allowlist (PDF, JPEG, PNG, WEBP)
          const magic = validateFileMagicBytes(buffer)
          if (!magic.valid || !magic.ext) {
            throw new APIError('Unsupported or corrupt file format. Only PDF, JPEG, PNG, and WEBP documents are permitted.', 400, {
              code: ERROR_CODES.VALIDATION,
            })
          }

          // Compute SHA-256 checksum for data integrity
          data.checksum = computeSha256(buffer)

          // Sanitize storage filename: generate safe UUID-based storage name
          if (operation === 'create' && !data.filename) {
            data.filename = generateSafeStorageFilename(magic.ext)
          }
        }

        const tenantID = data.tenant ? String(data.tenant) : getTenantID(req.user)
        if (!tenantID) {
          throw new APIError('Tenant is required.', 400, { code: ERROR_CODES.VALIDATION })
        }

        if (data.patient) {
          const patientDoc = await req.payload.findByID({
            collection: 'patients',
            id: relId(data.patient),
            depth: 0,
            overrideAccess: true,
          }).catch(() => null)
          if (!patientDoc || String(relId(patientDoc.tenant)) !== tenantID) {
            throw new APIError('Patient does not belong to this clinic.', 400, { code: ERROR_CODES.VALIDATION })
          }
        }

        if (data.visit) {
          const visitDoc = await req.payload.findByID({
            collection: 'visits',
            id: relId(data.visit),
            depth: 0,
            overrideAccess: true,
          }).catch(() => null)
          if (!visitDoc || String(relId(visitDoc.tenant)) !== tenantID) {
            throw new APIError('Visit does not belong to this clinic.', 400, { code: ERROR_CODES.VALIDATION })
          }
          if (data.patient && String(relId(visitDoc.patient)) !== String(relId(data.patient))) {
            throw new APIError('Visit does not belong to the specified patient.', 400, { code: ERROR_CODES.VALIDATION })
          }
        }

        if (data.appointment) {
          const apptDoc = await req.payload.findByID({
            collection: 'appointments',
            id: relId(data.appointment),
            depth: 0,
            overrideAccess: true,
          }).catch(() => null)
          if (!apptDoc || String(relId(apptDoc.tenant)) !== tenantID) {
            throw new APIError('Appointment does not belong to this clinic.', 400, { code: ERROR_CODES.VALIDATION })
          }
          if (data.patient && String(relId(apptDoc.patient)) !== String(relId(data.patient))) {
            throw new APIError('Appointment does not belong to the specified patient.', 400, { code: ERROR_CODES.VALIDATION })
          }
        }

        return data
      },
    ],
    beforeChange: [forceTenant],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const tenantID = relId(doc.tenant)
        const targetId = String(doc.id)
        if (operation === 'create') {
          await logAudit(req, {
            targetCollection: 'medical-documents',
            targetId,
            tenantID,
            action: 'document.uploaded',
            summary: `Uploaded medical document: ${doc.title} (${doc.documentType})`,
            meta: { documentType: doc.documentType, filename: doc.filename },
          })
        } else if (operation === 'update') {
          if (doc.status === 'archived' && previousDoc?.status !== 'archived') {
            await logAudit(req, {
              targetCollection: 'medical-documents',
              targetId,
              tenantID,
              action: 'document.updated',
              summary: `Archived medical document: ${doc.title}`,
            })
          } else {
            await logAudit(req, {
              targetCollection: 'medical-documents',
              targetId,
              tenantID,
              action: 'document.updated',
              summary: `Updated medical document metadata: ${doc.title}`,
            })
          }
        }
        return doc
      },
    ],
  },
  fields: [
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
      access: { update: () => false },
    },
    {
      name: 'patient',
      type: 'relationship',
      relationTo: 'patients',
      required: true,
      index: true,
      filterOptions: ({ user }) => {
        if (!user || isSuperAdmin(user as any) || (user as any).role === 'patient') return true
        const tenantID = getTenantID(user as any)
        return tenantID ? { tenant: { equals: tenantID } } : true
      },
    },
    {
      name: 'doctor',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      filterOptions: ({ user }) => {
        if (!user || isSuperAdmin(user as any) || (user as any).role === 'patient') return true
        const tenantID = getTenantID(user as any)
        const base: Record<string, unknown> = { role: { equals: 'doctor' }, active: { equals: true } }
        if (tenantID) base.tenant = { equals: tenantID }
        return base as any
      },
    },
    {
      name: 'visit',
      type: 'relationship',
      relationTo: 'visits',
      index: true,
    },
    {
      name: 'appointment',
      type: 'relationship',
      relationTo: 'appointments',
      index: true,
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      access: { update: () => false },
      admin: { readOnly: true },
    },
    {
      name: 'documentType',
      type: 'select',
      required: true,
      options: DOCUMENT_TYPES.map((dt) => ({ label: dt.label, value: dt.value })),
    },
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'tags',
      type: 'array',
      fields: [{ name: 'tag', type: 'text' }],
    },
    {
      name: 'documentDate',
      type: 'date',
      required: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'checksum',
      type: 'text',
      admin: { readOnly: true, description: 'SHA-256 hash for integrity and duplicate detection.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  ],
  indexes: [
    { fields: ['tenant', 'patient', 'documentDate'] },
    { fields: ['tenant', 'visit'] },
    { fields: ['tenant', 'appointment'] },
    { fields: ['tenant', 'documentType'] },
  ],
}
