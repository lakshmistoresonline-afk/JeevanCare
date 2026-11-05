'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function QueueAutoRefresher({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        router.refresh()
      }
    }, intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs, router])

  return null
}
