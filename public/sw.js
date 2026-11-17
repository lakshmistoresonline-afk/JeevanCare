// JeevanCare PWA Offline App Shell Caching Service Worker (v5.0)

const CACHE_NAME = 'jeevancare-pwa-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/dashboard',
  '/dashboard/appointments',
  '/checkin',
  '/login',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {})
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  // Network first with fallback to cache for HTML routes
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const resClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone))
          return response
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/dashboard')
          })
        })
    )
  }
})
