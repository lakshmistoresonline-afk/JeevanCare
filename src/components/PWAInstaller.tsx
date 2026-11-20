'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function PWAInstaller() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // 1. Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => console.log('[PWA] Service Worker registered.'))
        .catch((err) => console.log('[PWA] Service Worker registration failed:', err))
    }

    // 2. Track Online/Offline Status for Rural Outage Resilience
    const handleOnline = () => {
      setIsOffline(false)
      toast.success('Internet connection restored. JeevanCare synced.')
    }

    const handleOffline = () => {
      setIsOffline(true)
      toast.warning('Internet connection lost. Running in Offline Outage Mode.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('blur', handleOffline)

    if (!navigator.onLine) {
      setIsOffline(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed bottom-3 right-3 z-50 rounded-xl border border-amber-500/40 bg-amber-950/90 px-3.5 py-2 text-xs font-bold text-amber-200 shadow-xl backdrop-blur-md flex items-center gap-2">
      <span className="size-2 rounded-full bg-amber-400 animate-ping" />
      ⚡ Offline Outage Mode Active · Prescriptions cached locally
    </div>
  )
}
