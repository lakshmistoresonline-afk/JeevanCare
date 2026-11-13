'use client'

import { useState, useEffect } from 'react'
import { getAllDraftVisits, clearDraftVisit, type OfflineVisitDraft } from '@/lib/offlineDb'
import { recordVisit } from '@/app/(frontend)/dashboard/visits/actions'
import { toast } from 'sonner'
import { Spinner } from './primitives'

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingDrafts, setPendingDrafts] = useState<OfflineVisitDraft[]>([])
  const [syncing, setSyncing] = useState(false)

  const checkStatusAndDrafts = async () => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
      const drafts = await getAllDraftVisits()
      setPendingDrafts(drafts)
    }
  }

  useEffect(() => {
    checkStatusAndDrafts()

    const handleOnline = async () => {
      setIsOnline(true)
      toast.success('Internet network restored.')
      await syncAllPendingDrafts()
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Network connection dropped. Offline consultation buffering active.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const syncAllPendingDrafts = async () => {
    const drafts = await getAllDraftVisits()
    if (drafts.length === 0) return

    setSyncing(true)
    let syncedCount = 0

    for (const draft of drafts) {
      try {
        const res = await recordVisit({
          appointmentId: draft.appointmentId,
          symptoms: draft.symptoms,
          diagnosis: draft.diagnosis,
          notes: draft.notes,
          vitals: draft.vitals,
          prescription: draft.prescription,
          followUpDate: draft.followUpDate,
        })
        if (res.ok) {
          await clearDraftVisit(draft.appointmentId)
          syncedCount++
        }
      } catch {}
    }

    setSyncing(false)
    const remaining = await getAllDraftVisits()
    setPendingDrafts(remaining)

    if (syncedCount > 0) {
      toast.success(`Successfully synced ${syncedCount} offline consultation draft(s) to server database!`)
    }
  }

  if (isOnline && pendingDrafts.length === 0) return null

  return (
    <div className="bg-amber text-amber-foreground border-b border-amber/30 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <span className="size-2 rounded-full bg-red animate-ping" />
            <span>⚠️ Offline Mode Active — Consultation notes &amp; vitals are being saved locally to IndexedDB.</span>
          </>
        ) : (
          <>
            <span className="size-2 rounded-full bg-primary" />
            <span>🔄 {pendingDrafts.length} offline consultation draft(s) buffered in IndexedDB waiting to sync.</span>
          </>
        )}
      </div>

      {isOnline && pendingDrafts.length > 0 && (
        <button
          type="button"
          disabled={syncing}
          onClick={syncAllPendingDrafts}
          aria-label="Sync all offline drafts"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 hover:bg-white/30 px-3 py-1 text-[11px] font-bold text-ink transition-colors"
        >
          {syncing && <Spinner className="size-3" />}
          {syncing ? 'Syncing...' : 'Sync Now 🔄'}
        </button>
      )}
    </div>
  )
}
