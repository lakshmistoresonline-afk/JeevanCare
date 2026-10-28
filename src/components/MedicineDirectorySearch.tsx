'use client'

import { useState } from 'react'
import { searchMedicines, type MedicineEntry } from '@/lib/medicineDirectory'
import { Card, inputClass } from './primitives'
import { IconSearch } from './icons'
import { type PrescriptionRowInput } from '@/app/(frontend)/dashboard/visits/actions'
import { toast } from 'sonner'

export function MedicineDirectorySearch({
  onSelectMedicine,
  onSaveToPresets,
}: {
  onSelectMedicine: (item: PrescriptionRowInput) => void
  onSaveToPresets?: (item: PrescriptionRowInput) => void
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
          results.map((med) => {
            const rowItem: PrescriptionRowInput = {
              medicine: `${med.brandName} (${med.strength})`,
              dosage: '1 tablet',
              frequency: med.defaultFrequency,
              durationDays: med.defaultDurationDays,
              instructions: 'As directed',
            }
            return (
              <div key={med.id} className="flex items-center justify-between p-2.5 hover:bg-secondary/40 transition-colors text-xs gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-ink truncate block">{med.brandName}</span>
                  <span className="text-muted-foreground text-[11px] truncate block">({med.genericName} — {med.strength})</span>
                  <span className="text-[10px] text-primary font-semibold">{med.category} · {med.formulation}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMedicine(rowItem)
                      toast.success(`Added ${med.brandName} to prescription.`)
                    }}
                    className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary/90 transition-colors"
                  >
                    + Add Rx
                  </button>
                  {onSaveToPresets && (
                    <button
                      type="button"
                      onClick={() => {
                        onSaveToPresets(rowItem)
                        toast.success(`Saved ${med.brandName} to your doctor presets.`)
                      }}
                      className="rounded-lg border border-border bg-card px-2 py-1 text-[11px] font-semibold text-ink hover:border-primary hover:text-primary transition-colors"
                      title="Save to My Presets"
                    >
                      ⭐ Save
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
