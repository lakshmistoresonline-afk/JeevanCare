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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const secret = process.env.PAYLOAD_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'jeevancare_dev_secret_fallback_key_minimum_32_chars_2026')
if (process.env.NODE_ENV === 'production' && (!secret || secret.length < 32)) {
  throw new Error('CRITICAL CONFIGURATION ERROR: PAYLOAD_SECRET environment variable must be set to a secure string of at least 32 characters in production.')
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
  },
  collections: [Tenants, Users, Patients, Appointments, Visits, Invoices, AuditLogs, MedicalDocuments],
  editor: lexicalEditor(),
  secret,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: mongooseAdapter({
    url: process.env.DATABASE_URL || '',
  }),
  sharp,
  plugins: [],
  onInit: async (payload) => {
    // Deterministic backstop for the double-booking race: a partial UNIQUE index
    // on (tenant, doctor, start) limited to slot-occupying statuses. Two concurrent
    // bookings for the exact same slot can't both insert — one hits a duplicate key
    // and aborts. Terminal statuses are excluded, so rebooking a cancelled slot works.
    try {
      const model = payload.db.collections?.appointments
      if (model) {
        const native = model.collection
        // Drop a stale non-unique index with the same key pattern if present
        // (it would conflict with the partial unique index below).
        const existing = await native.indexes().catch(() => [] as any[])
        const stale = existing.find(
          (i: any) => i.name === 'tenant_1_doctor_1_start_1' && !i.unique,
        )
        if (stale) await native.dropIndex('tenant_1_doctor_1_start_1').catch(() => {})

        await native.createIndex(
          { tenant: 1, doctor: 1, start: 1 },
          {
            unique: true,
            name: 'uniq_active_slot',
            partialFilterExpression: { status: { $in: ['scheduled', 'checked-in'] } },
          },
        )
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
    } catch (err) {
      payload.logger.error({ err }, 'Failed to create database indexes')
    }
  },
})
