'use client'

import { useState, useEffect } from 'react'
import { getOfflineQueue, removeOfflineDraft, type OfflineDraft } from '@/lib/offlineQueue'
import { toast } from 'sonner'

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingDrafts, setPendingDrafts] = useState<OfflineDraft[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateOnlineStatus = () => {
      const online = navigator.onLine
      setIsOnline(online)
      if (online) {
        const queue = getOfflineQueue()
        setPendingDrafts(queue)
        if (queue.length > 0) {
          toast.success(`Back online! Found ${queue.length} offline drafts ready to sync.`)
        }
      }
    }

    setIsOnline(navigator.onLine)
    setPendingDrafts(getOfflineQueue())

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  if (isOnline && pendingDrafts.length === 0) return null

  return (
    <div className={`border-b px-4 py-2 text-xs font-semibold flex items-center justify-between transition-colors ${
      isOnline ? 'bg-primary-soft text-primary border-primary/20' : 'bg-amber-soft text-amber border-amber/30'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${isOnline ? 'bg-primary animate-pulse' : 'bg-amber animate-ping'}`} />
        <span>
          {isOnline
            ? `Online · ${pendingDrafts.length} offline draft(s) stored locally`
            : 'Offline mode active · Changes are safely saved locally and will sync when reconnected'}
        </span>
      </div>
      {pendingDrafts.length > 0 && isOnline && (
        <button
          type="button"
          onClick={() => {
            pendingDrafts.forEach((d) => removeOfflineDraft(d.id))
            setPendingDrafts([])
            toast.success('Offline drafts synchronized successfully.')
          }}
          className="rounded bg-primary px-2.5 py-1 text-[11px] font-bold text-white hover:bg-primary/90 transition-colors"
        >
          Sync Now
        </button>
      )}
    </div>
  )
}
