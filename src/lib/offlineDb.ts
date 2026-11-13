// Offline-First IndexedDB Buffer for Consultation Drafts & Disruption-Proof OPD Uptime
const DB_NAME = 'jeevancare_offline_db'
const DB_VERSION = 1
const STORE_DRAFTS = 'visit_drafts'

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB unavailable in server runtime.'))
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = (e: any) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains(STORE_DRAFTS)) {
        db.createObjectStore(STORE_DRAFTS, { keyPath: 'appointmentId' })
      }
    }

    req.onsuccess = (e: any) => resolve(e.target.result)
    req.onerror = (e: any) => reject(e.target.error)
  })
}

export type OfflineVisitDraft = {
  appointmentId: string
  patientName?: string
  symptoms: string
  diagnosis: string
  notes: string
  vitals: Record<string, any>
  prescription: any[]
  followUpDate?: string
  updatedAt: string
}

export async function saveDraftVisit(draft: OfflineVisitDraft): Promise<boolean> {
  try {
    const db = await openOfflineDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite')
      const store = tx.objectStore(STORE_DRAFTS)
      const req = store.put({ ...draft, updatedAt: new Date().toISOString() })

      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(false)
    })
  } catch {
    return false
  }
}

export async function getDraftVisit(appointmentId: string): Promise<OfflineVisitDraft | null> {
  try {
    const db = await openOfflineDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readonly')
      const store = tx.objectStore(STORE_DRAFTS)
      const req = store.get(appointmentId)

      req.onsuccess = (e: any) => resolve(e.target.result || null)
      req.onerror = () => reject(null)
    })
  } catch {
    return null
  }
}

export async function clearDraftVisit(appointmentId: string): Promise<boolean> {
  try {
    const db = await openOfflineDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readwrite')
      const store = tx.objectStore(STORE_DRAFTS)
      const req = store.delete(appointmentId)

      req.onsuccess = () => resolve(true)
      req.onerror = () => reject(false)
    })
  } catch {
    return false
  }
}

export async function getAllDraftVisits(): Promise<OfflineVisitDraft[]> {
  try {
    const db = await openOfflineDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_DRAFTS, 'readonly')
      const store = tx.objectStore(STORE_DRAFTS)
      const req = store.getAll()

      req.onsuccess = (e: any) => resolve(e.target.result || [])
      req.onerror = () => reject([])
    })
  } catch {
    return []
  }
}
