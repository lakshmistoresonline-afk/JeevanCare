'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { btnPrimary, btnGhost, Spinner, inputClass, Field } from './primitives'
import { AppSelect } from './AppSelect'
import { createInvoiceFromVisit } from '@/app/(frontend)/dashboard/invoices/actions'
import { uploadMedicalDocument } from '@/app/(frontend)/dashboard/patients/actions'

/** Next-step actions shown after a visit is recorded (server renders this panel). */
export function PostVisitActions({ visitId, patientId, appointmentId }: { visitId: string; patientId: string; appointmentId?: string }) {
  const router = useRouter()
  const [busy, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState('LAB_REPORT')
  const [file, setFile] = useState<File | null>(null)

  const createInvoice = () => {
    setError(null)
    start(async () => {
      const res = await createInvoiceFromVisit(visitId)
      if (res.ok) {
        router.push(`/dashboard/invoices/${res.data.id}`)
        router.refresh()
      } else setError(res.message)
    })
  }

  const uploadDoc = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) return
    start(async () => {
      const fd = new FormData()
      fd.append('patientID', patientId)
      fd.append('title', title)
      fd.append('documentType', documentType)
      fd.append('visitID', visitId)
      if (appointmentId) fd.append('appointmentID', appointmentId)
      fd.append('file', file)

      const res = await uploadMedicalDocument(fd)
      if (res.ok) {
        setTitle('')
        setFile(null)
        setShowUpload(false)
        router.refresh()
      } else {
        setError(res.message)
      }
    })
  }

  return (
    <div className="mt-6 flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <button className={btnPrimary} onClick={createInvoice} disabled={busy}>
          {busy && <Spinner />}
          Create invoice
        </button>
        <button className={btnGhost} onClick={() => setShowUpload(!showUpload)}>
          {showUpload ? 'Cancel upload' : 'Upload report / X-ray'}
        </button>
        <Link href={`/print/prescription/${visitId}`} target="_blank" className={btnGhost}>
          Print prescription
        </Link>
        <Link href={`/dashboard/patients/${patientId}`} className={btnGhost}>
          Patient profile
        </Link>
        <Link href="/dashboard/appointments" className={btnGhost}>
          Day view
        </Link>
      </div>

      {showUpload && (
        <form onSubmit={uploadDoc} className="w-full max-w-md rounded-lg border border-border bg-card p-4 text-left shadow-sm">
          <h3 className="mb-3 text-sm font-semibold">Attach Medical Document to Visit</h3>
          <div className="flex flex-col gap-3">
            <Field label="Title">
              <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Blood Test Report" required />
            </Field>
            <Field label="Type">
              <AppSelect
                value={documentType}
                onChange={setDocumentType}
                options={[
                  { label: 'Lab Report', value: 'LAB_REPORT' },
                  { label: 'Blood Test', value: 'BLOOD_TEST' },
                  { label: 'X-Ray', value: 'X_RAY' },
                  { label: 'CT Scan', value: 'CT_SCAN' },
                  { label: 'MRI', value: 'MRI' },
                  { label: 'Other', value: 'OTHER' },
                ]}
              />
            </Field>
            <Field label="File">
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-xs"
                required
              />
            </Field>
            <div className="flex justify-end gap-2">
              <button type="submit" className={btnPrimary} disabled={busy || !file || !title}>
                {busy && <Spinner />} Upload & Attach
              </button>
            </div>
          </div>
        </form>
      )}

      {error && <p className="text-sm text-red">{error}</p>}
    </div>
  )
}
