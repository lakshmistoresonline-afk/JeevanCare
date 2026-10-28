'use client'

import { useState } from 'react'
import { Card } from './primitives'
import { IconPlus, IconX, IconStethoscope } from './icons'
import { type PrescriptionRowInput } from '@/app/(frontend)/dashboard/visits/actions'
import { toast } from 'sonner'

export type DoctorPreset = {
  id: string
  name: string
  items: PrescriptionRowInput[]
}

export function DoctorPrescriptionPresets({
  onApplyPreset,
}: {
  onApplyPreset: (items: PrescriptionRowInput[]) => void
}) {
  const [presets, setPresets] = useState<DoctorPreset[]>([
    {
      id: 'p1',
      name: 'Dr. Nair’s Standard Fever Regimen',
      items: [
        { medicine: 'Paracetamol 650 mg', dosage: '1 tablet', frequency: 'tds', durationDays: 3, instructions: 'After food' },
        { medicine: 'Pantoprazole 40 mg', dosage: '1 tablet', frequency: 'od', durationDays: 3, instructions: 'Before breakfast' },
      ],
    },
    {
      id: 'p2',
      name: 'Common Cold & Cough',
      items: [
        { medicine: 'Levocetirizine 5 mg', dosage: '1 tablet', frequency: 'bd', durationDays: 5, instructions: 'At night' },
        { medicine: 'Ambroxol Cough Syrup', dosage: '10 ml', frequency: 'tds', durationDays: 5, instructions: 'After food' },
      ],
    },
  ])

  const [newPresetName, setNewPresetName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const savePreset = (currentRows: PrescriptionRowInput[]) => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset template name.')
      return
    }
    const newPreset: DoctorPreset = {
      id: `preset_${Date.now()}`,
      name: newPresetName.trim(),
      items: currentRows.filter((r) => r.medicine.trim()),
    }
    setPresets((p) => [...p, newPreset])
    setNewPresetName('')
    setIsCreating(false)
    toast.success('Prescription template saved to your doctor profile.')
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <IconStethoscope size={14} />
          </span>
          <h4 className="font-display text-xs font-bold text-ink">Doctor Custom Prescription Templates</h4>
        </div>
        <button
          type="button"
          onClick={() => setIsCreating((c) => !c)}
          className="text-xs font-bold text-primary hover:underline"
        >
          {isCreating ? 'Cancel' : '+ Create Template'}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => (
          <div key={preset.id} className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-secondary px-3 py-1 text-xs">
            <button
              type="button"
              onClick={() => {
                onApplyPreset(preset.items)
                toast.success(`Applied template: ${preset.name}`)
              }}
              className="font-bold text-primary hover:underline"
            >
              {preset.name} ({preset.items.length} Rx)
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
