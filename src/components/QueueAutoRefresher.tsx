'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { subscribeAppSync } from '@/lib/broadcast'

export function QueueAutoRefresher({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    // 1. Server-Sent Events (SSE) Stream Connection for Real-Time OPD Queue
    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource('/api/queue/stream')
      eventSource.addEventListener('queue-update', () => {
        router.refresh()
      })
      eventSource.onerror = () => {
        eventSource?.close()
      }
    } catch {}

    // 2. Adaptive Polling Fallback (3s when active, 15s when tab backgrounded)
    let currentInterval = intervalMs
    let timer: any = null

    const startTimer = (ms: number) => {
      if (timer) clearInterval(timer)
      currentInterval = ms
      timer = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          router.refresh()
        }
      }, ms)
    }

    startTimer(intervalMs)

    const handleFocus = () => {
      router.refresh()
      startTimer(2000)
    }

    const handleBlur = () => {
      startTimer(15000)
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // 3. Same-Device Multi-Tab BroadcastChannel Sync
    const unsubscribe = subscribeAppSync(() => {
      router.refresh()
    })

    return () => {
      if (timer) clearInterval(timer)
      if (eventSource) eventSource.close()
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      unsubscribe()
    }
  }, [intervalMs, router])

  return null
}
