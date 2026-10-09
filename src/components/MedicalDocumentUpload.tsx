'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { btnPrimary, inputClass, textareaClass, Field, Spinner } from './primitives'
import { AppSelect } from './AppSelect'
import { uploadMedicalDocument } from '@/app/(frontend)/dashboard/patients/actions'

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

export function MedicalDocumentUpload({ patientID }: { patientID: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState('LAB_REPORT')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [open, setOpen] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) {
      setError('Title and file are required.')
      return
    }
    setError(null)
    start(async () => {
      const formData = new FormData()
      formData.append('patientID', patientID)
      formData.append('title', title)
      formData.append('documentType', documentType)
      formData.append('description', description)
      formData.append('file', file)

      const res = await uploadMedicalDocument(formData)
      if (res.ok) {
        setTitle('')
        setDescription('')
        setFile(null)
        setOpen(false)
        router.refresh()
      } else {
        setError(res.message)
      }
    })
  }

  if (!open) {
    return (
      <button className={btnPrimary} onClick={() => setOpen(true)}>
        Upload Document
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-sm font-semibold">Upload Medical Document</h3>
        <button type="button" className="text-xs text-muted-foreground hover:text-ink" onClick={() => setOpen(false)}>
          Cancel
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Document title">
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Complete Blood Count" required />
        </Field>
        <Field label="Document type">
          <AppSelect value={documentType} onChange={setDocumentType} options={DOCUMENT_TYPES} />
        </Field>
      </div>

      <Field label="Description (optional)">
        <textarea className={textareaClass} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes or summary..." />
      </Field>

      <Field label="File (PDF, JPG, PNG, WEBP — max 20MB)">
        <input
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm file:mr-4 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-ink hover:file:bg-muted"
          required
        />
      </Field>

      {error && <p className="text-xs text-red" role="alert">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="submit" className={btnPrimary} disabled={pending || !file || !title}>
          {pending && <Spinner />}
          {pending ? 'Uploading…' : 'Save Document'}
        </button>
      </div>
    </form>
  )
}
