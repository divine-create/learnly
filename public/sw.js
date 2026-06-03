const CACHE = 'codebridge-v1'
const OFFLINE_URL = '/'

// Assets to pre-cache on install
const PRECACHE = [
  '/',
  '/login',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and API requests
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached

      return fetch(request)
        .then(response => {
          // Cache successful page navigations and static assets
          if (
            response.ok &&
            (request.mode === 'navigate' || url.pathname.match(/\.(js|css|png|jpg|svg|woff2?)$/))
          ) {
            const clone = response.clone()
            caches.open(CACHE).then(cache => cache.put(request, clone))
          }
          return response
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL)
          }
        })
    })
  )
})
