'use client'

import { useState } from 'react'
import { searchMedicines, type MedicineEntry } from '@/lib/medicineDirectory'
import { Card, inputClass } from './primitives'
import { IconSearch } from './icons'
import { type PrescriptionRowInput } from '@/app/(frontend)/dashboard/visits/actions'
import { toast } from 'sonner'

export function MedicineDirectorySearch({
  onSelectMedicine,
}: {
  onSelectMedicine: (item: PrescriptionRowInput) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MedicineEntry[]>(searchMedicines(''))

  const handleSearch = (val: string) => {
    setQuery(val)
    setResults(searchMedicines(val))
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <IconSearch size={14} />
        </span>
        <h4 className="font-display text-xs font-bold text-ink">National Essential Medicine Directory Search</h4>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search by generic name, brand (e.g. Paracetamol, Dolo, Augmentin)…"
        className={inputClass}
      />

      <div className="max-h-56 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border/80 bg-canvas">
        {results.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">No medicines found in national directory.</div>
        ) : (
          results.map((med) => (
            <div key={med.id} className="flex items-center justify-between p-2.5 hover:bg-secondary/40 transition-colors text-xs">
              <div>
                <span className="font-bold text-ink">{med.brandName}</span>
                <span className="text-muted-foreground"> ({med.genericName} — {med.strength})</span>
                <span className="block text-[10px] text-primary font-semibold">{med.category} · {med.formulation}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onSelectMedicine({
                    medicine: `${med.brandName} (${med.strength})`,
                    dosage: '1 tablet',
                    frequency: med.defaultFrequency,
                    durationDays: med.defaultDurationDays,
                    instructions: 'As directed',
                  })
                  toast.success(`Added ${med.brandName} to prescription.`)
                }}
                className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary/90 transition-colors shrink-0"
              >
                + Add Rx
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
