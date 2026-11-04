'use client'

import { useState, useEffect } from 'react'

export type QuickLoginProfile = {
  id: string
  label: string
  email: string
  password?: string
  role?: string
}

const DEFAULT_PROFILES: QuickLoginProfile[] = [
  { id: '1', label: '👑 Super Admin', email: 'admin@test.com', password: 'Test@123' },
  { id: '2', label: '🏥 Clinic Owner', email: 'owner1@test.com', password: 'Test@123' },
  { id: '3', label: '👨‍⚕️ Doctor', email: 'doctor1@test.com', password: 'Test@123' },
  { id: '4', label: '👩‍💼 Receptionist', email: 'staff1@test.com', password: 'Test@123' },
  { id: '5', label: '🧑‍⚕️ Patient', email: 'patient1@test.com', password: 'Test@123' },
]

export function QuickLoginToolbar({
  onSelectAccount,
}: {
  onSelectAccount: (email: string, password?: string) => void
}) {
  const [profiles, setProfiles] = useState<QuickLoginProfile[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('jeevancare_quick_logins')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProfiles(parsed)
          return
        }
      } catch {}
    }
    setProfiles(DEFAULT_PROFILES)
  }, [])

  const saveProfiles = (updated: QuickLoginProfile[]) => {
    setProfiles(updated)
    if (typeof window !== 'undefined') {
      localStorage.setItem('jeevancare_quick_logins', JSON.stringify(updated))
    }
  }

  const addProfile = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLabel || !newEmail) return
    const item: QuickLoginProfile = {
      id: String(Date.now()),
      label: newLabel.trim(),
      email: newEmail.trim().toLowerCase(),
      password: newPassword || 'Test@123',
    }
    const updated = [...profiles, item]
    saveProfiles(updated)
    setNewLabel('')
    setNewEmail('')
    setNewPassword('')
    setShowAdd(false)
  }

  const removeProfile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = profiles.filter((p) => p.id !== id)
    saveProfiles(updated.length > 0 ? updated : DEFAULT_PROFILES)
  }

  return (
    <div className="mt-6 rounded-2xl border border-border/80 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-lg bg-primary-soft text-primary text-xs font-bold">
            ⚡
          </span>
          <span className="text-xs font-bold text-ink">Configurable 1-Click Quick Login</span>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs font-bold text-primary hover:underline"
        >
          {showAdd ? 'Close' : '+ Add Account'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={addProfile} className="p-3 rounded-xl border border-border bg-canvas space-y-2.5 text-xs animate-fade-down">
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Account Label</label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Dr. Sabitha (Swaraj Clinic)"
              required
              className="w-full h-8 px-2.5 rounded-lg border border-border bg-card text-ink text-xs font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Email or Phone</label>
            <input
              type="text"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="doctor1@test.com"
              required
              className="w-full h-8 px-2.5 rounded-lg border border-border bg-card text-ink text-xs font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-muted-foreground mb-1">Password (Optional)</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Test@123"
              className="w-full h-8 px-2.5 rounded-lg border border-border bg-card text-ink text-xs font-medium"
            />
          </div>
          <button
            type="submit"
            className="w-full h-8 rounded-lg bg-primary text-white font-bold text-xs transition-colors hover:bg-primary/90"
          >
            Save Quick Login Badge
          </button>
        </form>
      )}

      <div className="flex flex-wrap gap-1.5">
        {profiles.map((p) => (
          <div
            key={p.id}
            onClick={() => onSelectAccount(p.email, p.password)}
            className="group flex items-center gap-1.5 rounded-xl border border-border bg-canvas px-3 py-1.5 text-xs font-semibold text-ink cursor-pointer hover:border-primary hover:bg-primary-soft/40 transition-all shadow-2xs"
          >
            <span>{p.label}</span>
            <button
              type="button"
              onClick={(e) => removeProfile(p.id, e)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red transition-opacity ml-1"
              title="Remove quick login badge"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
