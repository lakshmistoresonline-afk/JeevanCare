'use client'

import { useState } from 'react'

export function SpecialtyFilterChips({
  specialties,
  onSelectSpecialty,
}: {
  specialties: { name: string; count: number }[]
  onSelectSpecialty?: (specialty: string | null) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (spec: string | null) => {
    setSelected(spec)
    onSelectSpecialty?.(spec)
  }

  const total = specialties.reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs">
      <button
        type="button"
        onClick={() => handleSelect(null)}
        className={`rounded-full px-3 py-1 font-bold transition-all shadow-2xs ${
          selected === null
            ? 'bg-primary text-white ring-2 ring-primary/20'
            : 'border border-border bg-canvas text-muted-foreground hover:text-ink hover:border-primary/40'
        }`}
      >
        All ({total})
      </button>

      {specialties.map((s) => (
        <button
          key={s.name}
          type="button"
          onClick={() => handleSelect(s.name)}
          className={`rounded-full px-3 py-1 font-bold transition-all shadow-2xs ${
            selected === s.name
              ? 'bg-primary text-white ring-2 ring-primary/20'
              : 'border border-border bg-canvas text-muted-foreground hover:text-ink hover:border-primary/40'
          }`}
        >
          {s.name} ({s.count})
        </button>
      ))}
    </div>
  )
}
