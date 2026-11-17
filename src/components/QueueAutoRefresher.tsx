'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { subscribeAppSync } from '@/lib/broadcast'

export function QueueAutoRefresher({ intervalMs = 2000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    // 1. Adaptive Polling (2s during active focus, 15s when unfocused/backgrounded)
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

    // 2. Instant Window Focus Revalidation
    const handleFocus = () => {
      router.refresh()
      startTimer(2000)
    }

    const handleBlur = () => {
      startTimer(15000) // Scale down to 15s when tab is unfocused
    }

    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    // 3. Option 3: Same-Device Multi-Tab 0ms BroadcastChannel Sync
    const unsubscribe = subscribeAppSync(() => {
      router.refresh()
    })

    return () => {
      if (timer) clearInterval(timer)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      unsubscribe()
    }
  }, [intervalMs, router])

  return null
}
