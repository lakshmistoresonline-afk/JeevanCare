import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { superAdminOnly, tenantScoped, patientTenantScoped, getTenantID } from '@/access'
import { forceTenant } from '@/hooks/tenant'
import { enforcePlanLimit } from '@/hooks/planLimit'
import { GENDERS, BLOOD_GROUPS, ERROR_CODES, INDIAN_STATES } from '@/lib/constants'
import { normalizePhone } from '@/lib/phone'
import { relId } from '@/lib/utils'

export const Patients: CollectionConfig = {
  slug: 'patients',
  admin: { useAsTitle: 'name', defaultColumns: ['mrn', 'name', 'phone', 'gender'] },
  access: {
    read: patientTenantScoped,
    create: tenantScoped,
    update: tenantScoped,
    delete: superAdminOnly, // clinics don't hard-delete patients
  },
  timestamps: true,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data
        if (data.phone) data.phone = normalizePhone(data.phone)
        // Clinics often know only the age. Require at least one of DOB / age.
        if (!data.dateOfBirth && (data.ageYears === undefined || data.ageYears === null)) {
          throw new APIError('Provide a date of birth or an age.', 400, {
            code: ERROR_CODES.VALIDATION,
          })
        }
        return data
      },
    ],
    beforeChange: [
      forceTenant,
      // Plan cap: a new patient beyond the tenant's plan limit is rejected (runs after
      // forceTenant so the tenant is resolved, before we assign an MRN we'd waste).
      enforcePlanLimit('patients'),
      // Per-clinic human-friendly MRN: P-0001, P-0002, …
      // Uses an atomic per-tenant counter document to avoid duplicate MRNs
      // from concurrent patient creation requests.
      async ({ data, req, operation }) => {
        if (operation !== 'create') return data
        const tenantID = data.tenant ? String(data.tenant) : getTenantID(req.user)
        if (!tenantID) {
          throw new APIError('Cannot assign a patient number without a clinic.', 400, {
            code: ERROR_CODES.VALIDATION,
          })
        }
        const db = (req.payload.db as any)?.connection?.db || (req.payload.db as any)?.collections?.patients?.collection?.db
        if (db) {
          const counterColl = db.collection('tenant_sequence_counters')
          const counterDoc = await counterColl.findOneAndUpdate(
            { tenant: tenantID, seq: 'patient_mrn' },
            { $inc: { value: 1 } },
            { upsert: true, returnDocument: 'after' },
          )
          const next = counterDoc?.value ?? 1
          data.mrn = `P-${String(next).padStart(4, '0')}`
        } else {
          const existing = await req.payload.count({
            collection: 'patients',
            where: { tenant: { equals: tenantID } },
            req,
          })
          data.mrn = `P-${String(existing.totalDocs + 1).padStart(4, '0')}`
        }
        return data
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
      access: { update: () => false }, // immutable after create
    },
    {
      name: 'mrn',
      type: 'text',
      label: 'Patient number',
      admin: { readOnly: true, description: 'Auto-assigned per clinic.' },
    },
    { name: 'name', type: 'text', required: true },
    { name: 'phone', type: 'text', required: true, index: true },
    {
      name: 'gender',
      type: 'select',
      required: true,
      options: GENDERS.map((g) => ({ label: g, value: g })),
    },
    {
      name: 'dateOfBirth',
      type: 'date',
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    { name: 'ageYears', type: 'number', min: 0, max: 130, label: 'Age (years)' },
    {
      name: 'bloodGroup',
      type: 'select',
      options: BLOOD_GROUPS.map((b) => ({ label: b, value: b })),
    },
    {
      name: 'allergies',
      type: 'textarea',
      admin: { description: 'Shown prominently on the patient profile (safety).' },
    },
    {
      name: 'activationCode',
      type: 'text',
      label: 'Portal Activation Code',
      admin: { description: '6-digit activation code issued to claim portal account.' },
    },
    {
      name: 'activationTokenHash',
      type: 'text',
      hidden: true,
      index: true,
      admin: { description: 'SHA-256 hash of the current activation token.' },
    },
    {
      name: 'activationTokenExp',
      type: 'date',
      hidden: true,
      admin: { description: 'Expiry time for the activation token.' },
    },
    {
      name: 'activationAttempts',
      type: 'number',
      defaultValue: 0,
      hidden: true,
      admin: { description: 'Failed activation attempts for rate limiting.' },
    },
    { name: 'addressLine', type: 'text', label: 'Address / Street' },
    { name: 'city', type: 'text', defaultValue: 'Thrissur' },
    { name: 'district', type: 'text', defaultValue: 'Thrissur' },
    {
      name: 'state',
      type: 'select',
      defaultValue: 'Kerala',
      options: INDIAN_STATES.map((s) => ({ label: s, value: s })),
    },
    {
      name: 'pinCode',
      type: 'text',
      label: 'PIN Code',
      validate: (value: string | null | undefined) => {
        if (!value) return true
        return /^[1-9][0-9]{5}$/.test(value.trim())
          ? true
          : 'Enter a valid 6-digit Indian PIN code (e.g. 680001).'
      },
    },
    { name: 'notes', type: 'textarea' },
  ],
  // Compound indexes (spec §5)
  indexes: [
    { fields: ['tenant', 'phone'] },
    { fields: ['tenant', 'mrn'], unique: true },
  ],
}
