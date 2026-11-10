import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'
import { Patients } from './collections/Patients'
import { Appointments } from './collections/Appointments'
import { Visits } from './collections/Visits'
import { Invoices } from './collections/Invoices'
import { AuditLogs } from './collections/AuditLogs'
import { MedicalDocuments } from './collections/MedicalDocuments'
import { Medicines } from './collections/Medicines'

import { validateProductionSecret } from './lib/secretValidation'
import { initializeAppointmentIndexes } from './lib/appointmentIndex'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const secret = process.env.PAYLOAD_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'jeevancare_dev_secret_fallback_key_minimum_32_chars_2026')
const secretCheck = validateProductionSecret('PAYLOAD_SECRET', process.env.PAYLOAD_SECRET, 32)
if (!secretCheck.ok) {
  throw new Error(`CRITICAL CONFIGURATION ERROR: ${secretCheck.reason}`)
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— Clinic Management',
    },
    components: {
      views: {
        BulkImport: {
          Component: '@/components/admin/ImportView',
          path: '/bulk-import',
          meta: {
            title: 'Bulk CSV Import',
          },
        },
      },
    },
  },
  collections: [Tenants, Users, Patients, Appointments, Visits, Invoices, AuditLogs, MedicalDocuments, Medicines],
  editor: lexicalEditor(),
  secret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
    connectOptions: {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
    },
  }),
  sharp,
  plugins: [],
  onInit: async (payload) => {
    try {
      const isProdOrStaging = process.env.NODE_ENV === 'production' || process.env.STAGING === 'true'
      const model = payload.db.collections?.appointments
      if (!model || !model.collection) {
        if (isProdOrStaging) {
          throw new Error('CRITICAL DATABASE INTEGRITY ERROR: Appointments collection is missing or uninitialized.')
        }
      } else {
        await initializeAppointmentIndexes(model.collection, isProdOrStaging)
      }

      // Unique partial index: At most ONE active patient portal user account per patient record
      const usersModel = payload.db.collections?.users
      if (usersModel) {
        const nativeUsers = usersModel.collection
        await nativeUsers.createIndex(
          { patientProfile: 1 },
          {
            unique: true,
            name: 'uniq_patient_profile_portal',
            partialFilterExpression: { role: 'patient', patientProfile: { $exists: true } },
          },
        )

        // Unique partial index: walk-in tokens must be unique per tenant per day.
        // tokenDay is the clinic-local day key, so tokens restart safely each day.
        // Drop the old { tenant, tokenNumber } index if it exists before creating the new one.
        const apptsModel = payload.db.collections?.appointments
        if (apptsModel) {
          const apptsNative = apptsModel.collection
          try {
            const apptsIndexes = await apptsNative.indexes()
            if (apptsIndexes.some((i: any) => i.name === 'uniq_walkin_token' && !i.key?.tokenDay)) {
              await apptsNative.dropIndex('uniq_walkin_token')
            }
          } catch {}
          await apptsNative.createIndex(
            { tenant: 1, tokenDay: 1, tokenNumber: 1 },
            {
              unique: true,
              name: 'uniq_walkin_token',
              partialFilterExpression: { isWalkIn: true, tokenNumber: { $exists: true } },
            },
          )
        }
      }

      // Performance compound indexes for tenant data access scaling
      const patientsModel = payload.db.collections?.patients
      if (patientsModel?.collection) {
        await patientsModel.collection.createIndex(
          { tenant: 1, createdAt: -1 },
          { name: 'idx_patients_tenant_created' },
        )
      }

      const invoicesModel = payload.db.collections?.invoices
      if (invoicesModel?.collection) {
        await invoicesModel.collection.createIndex(
          { tenant: 1, voided: 1, createdAt: -1 },
          { name: 'idx_invoices_tenant_voided_created' },
        )
      }
    } catch (err) {
      payload.logger.error({ err }, 'Failed to create database indexes')
      if (process.env.NODE_ENV === 'production' || process.env.STAGING === 'true') {
        throw err
      }
    }
  },
})
