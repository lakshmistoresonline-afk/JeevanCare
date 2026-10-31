'use client'

import React, { useState } from 'react'
import { toast } from 'sonner'

export default function ImportView() {
  const [importType, setImportType] = useState<'clinics' | 'staff'>('clinics')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select a CSV file first.')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`/api/import/${importType}`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Import failed.')
      }

      setResult(data)
      toast.success(`Successfully imported ${data.importedCount || 'records'}!`)
    } catch (err: any) {
      toast.error(err.message || 'Error uploading file.')
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto bg-card rounded-xl border border-border shadow-xs mt-10">
      <h1 className="text-2xl font-bold font-display text-primary mb-2">Bulk CSV / Excel Data Import</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Upload your prepared CSV files (e.g. Thrissur City Clinics or Doctors CSV) to bulk-populate your workspace.
      </p>

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">Import Target</label>
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value as any)}
            className="w-full h-10 px-3 rounded-lg border border-border bg-background text-ink text-sm font-medium"
          >
            <option value="clinics">Clinics / Tenants (SuperAdmin only)</option>
            <option value="staff">Staff &amp; Doctors (Owners / SuperAdmin)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-muted-foreground mb-2">CSV File (.csv)</label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-semibold text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Importing Records...' : 'Upload & Import Data'}
        </button>
      </form>

      {result && (
        <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border text-xs">
          <h2 className="font-bold text-ink mb-1">Import Results</h2>
          <pre className="whitespace-pre-wrap text-muted-foreground">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
