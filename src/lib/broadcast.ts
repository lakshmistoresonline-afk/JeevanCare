// Same-Device Multi-Tab BroadcastChannel Engine for 0ms Instant Local Synchronization

const CHANNEL_NAME = 'jeevancare_app_sync'

export function broadcastAppSync() {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      const channel = new BroadcastChannel(CHANNEL_NAME)
      channel.postMessage({ type: 'APPOINTMENT_UPDATED', timestamp: Date.now() })
      channel.close()
    } catch {}
  }
}

export function subscribeAppSync(onSync: () => void) {
  if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return () => {}

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channel.onmessage = (e) => {
      if (e.data?.type === 'APPOINTMENT_UPDATED') {
        onSync()
      }
    }
    return () => {
      channel.close()
    }
  } catch {
    return () => {}
  }
}
