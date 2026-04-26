/**
 * Service Worker — cache-first para rotas do receptor.
 * Cacheia /retirar e /meus-codigos para uso offline.
 * @see intake-review/TASK-19/ST002
 */

const CACHE_NAME = 'prato-solidario-receptor-v1'
const CACHED_URLS = ['/retirar', '/meus-codigos']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHED_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Cache-first apenas para as rotas do receptor
  const isCached = CACHED_URLS.some(
    (path) => url.pathname === path || url.pathname.startsWith(path + '/')
  )

  if (!isCached) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        // Cachear apenas respostas válidas
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})
