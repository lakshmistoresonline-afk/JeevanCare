// Offline-First Local Sync Queue Utility for Low-Connectivity Clinics (v3 spec §9.4)

export type OfflineDraft = {
  id: string
  type: 'visit' | 'patient' | 'appointment'
  payload: any
  createdAt: number
}

const QUEUE_KEY = 'jeevancare_offline_queue'

export function getOfflineQueue(): OfflineDraft[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveOfflineDraft(type: OfflineDraft['type'], payload: any): string {
  if (typeof window === 'undefined') return ''
  const queue = getOfflineQueue()
  const id = `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const item: OfflineDraft = { id, type, payload, createdAt: Date.now() }
  queue.push(item)
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
  } catch (err) {
    console.error('Failed to save offline draft:', err)
  }
  return id
}

export function removeOfflineDraft(id: string): void {
  if (typeof window === 'undefined') return
  const queue = getOfflineQueue()
  const filtered = queue.filter((i) => i.id !== id)
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered))
  } catch (err) {
    console.error('Failed to remove offline draft:', err)
  }
}
