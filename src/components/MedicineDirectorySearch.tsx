'use client'

import { useState, useEffect } from 'react'
import { searchMedicines, type MedicineEntry } from '@/lib/medicineDirectory'
import { Card, inputClass } from './primitives'
import { IconSearch } from './icons'
import { type PrescriptionRowInput } from '@/app/(frontend)/dashboard/visits/actions'
import { toast } from 'sonner'

export function MedicineDirectorySearch({
  doctorId,
  onSelectMedicine,
  onSaveToPresets,
}: {
  doctorId?: string
  onSelectMedicine: (item: PrescriptionRowInput) => void
  onSaveToPresets?: (item: PrescriptionRowInput) => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MedicineEntry[]>(searchMedicines(''))
  const [presets, setPresets] = useState<PrescriptionRowInput[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && doctorId) {
      const key = `jeevancare-rx-presets-${doctorId}`
      try {
        const saved = JSON.parse(localStorage.getItem(key) || '[]')
        if (Array.isArray(saved)) setPresets(saved)
      } catch {}
    }
  }, [doctorId])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim() && presets.length > 0) {
        // Clear api results when empty to just show presets
        setResults([])
        return
      }
      try {
        const res = await fetch(`/api/medicines/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        if (data.ok && Array.isArray(data.medicines)) {
          setResults(data.medicines)
        }
      } catch {
        setResults(searchMedicines(query))
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [query, presets.length])

  const savePreset = (rowItem: PrescriptionRowInput) => {
    if (typeof window === 'undefined' || !doctorId) return
    const key = `jeevancare-rx-presets-${doctorId}`
    const updated = [rowItem, ...presets.filter(p => p.medicine !== rowItem.medicine)].slice(0, 10)
    localStorage.setItem(key, JSON.stringify(updated))
    setPresets(updated)
    toast.success(`Saved ${rowItem.medicine} to your frequent presets.`)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <IconSearch size={14} />
        </span>
        <h4 className="font-display text-xs font-bold text-ink">MongoDB Medicine Directory Search</h4>
      </div>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by generic name, brand (e.g. Paracetamol, Dolo, Augmentin)…"
        className={inputClass}
      />

      <div className="max-h-56 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border/80 bg-canvas">
        {(!query.trim() && presets.length > 0) ? (
          <>
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary-soft/30 sticky top-0">⭐ Your Frequent Presets</div>
            {presets.map((med, idx) => (
              <div key={`preset-${idx}`} className="flex items-center justify-between p-2.5 hover:bg-secondary/40 transition-colors text-xs gap-3">
                <div className="min-w-0">
                  <span className="font-bold text-ink truncate block">⭐ {med.medicine}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{med.dosage} · {med.frequency} · {med.durationDays} days</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onSelectMedicine(med)
                    toast.success(`Added preset ${med.medicine} to prescription.`)
                  }}
                  className="rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary/90 transition-colors"
                >
                  + Add
                </button>
              </div>
            ))}
          </>
        ) : results.length === 0 ? (
          <div className="p-4 text-center text-xs text-muted-foreground">No medicines found in directory.</div>
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
                      savePreset(rowItem) // Automatically save to local storage presets when added from directory
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
                        savePreset(rowItem)
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
