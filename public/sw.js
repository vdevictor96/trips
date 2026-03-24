const CACHE_NAME = 'trips-v1'
const BASE = '/trips/'

// App shell — cached on install
const APP_SHELL = [
  BASE,
  BASE + 'manifest.json',
  BASE + 'icons/icon-192.png',
  BASE + 'icons/icon-512.png',
]

// Patterns for runtime caching strategies
const GOOGLE_API_PATTERN = /^https:\/\/(maps|.*\.googleapis|.*\.gstatic)\.com\/(maps|.*\/maps)/
const FONT_PATTERN = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//
const TRIP_DATA_PATTERN = new RegExp('^' + self.location.origin + BASE.replace(/\//g, '\\/') + 'trips\\/')

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
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
  const url = event.request.url

  // Google Maps API — don't intercept (let Google handle its own caching)
  if (GOOGLE_API_PATTERN.test(url)) return

  // Google Fonts — cache first (versioned URLs)
  if (FONT_PATTERN.test(url)) {
    event.respondWith(cacheFirst(event.request))
    return
  }

  // Trip JSON data — network first, fall back to cache
  if (TRIP_DATA_PATTERN.test(url)) {
    event.respondWith(networkFirst(event.request))
    return
  }

  // App shell & built assets — stale while revalidate
  if (url.startsWith(self.location.origin)) {
    event.respondWith(staleWhileRevalidate(event.request))
    return
  }
})

// --- Caching strategies ---

async function cacheFirst(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 408 })
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    const cached = await caches.match(request)
    return cached || new Response('{"error":"offline"}', {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request)
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
      }
      return response
    })
    .catch(() => null)

  return cached || (await fetchPromise) || new Response('', { status: 408 })
}
