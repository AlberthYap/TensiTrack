/*
 * Tensi Harian service worker — minimal app-shell cache.
 *
 * Strategy:
 *  - App shell + static assets  → cache-first with revalidation
 *    (works offline after first visit)
 *  - Navigations                → network-first, fallback to cached shell,
 *                                  and finally to /~offline page when offline
 *  - Supabase / /api / share-*  → network-only (never cache user-specific
 *    data — privacy first)
 *
 * NOTE: keep this file as plain JS (ES2020) — Next.js won't serve custom
 * SW through its compiler. Update CACHE_VERSION when shipping breaking
 * changes to trigger a one-time cleanup.
 */const CACHE_VERSION = 'tensi-shell-v1'
const APP_SHELL = [
  '/',
  '/~offline',
  '/manifest.webmanifest',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-192.png',
  '/icon-maskable-512.png',
]


self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(async (cache) => {
      // Add each asset individually so one transient 404 (e.g. behind a slow
      // proxy on first visit) doesn't reject the entire precache and block
      // SW activation. Each miss is logged but tolerated.
      await Promise.all(
        APP_SHELL.map((url) =>
          cache
            .add(url)
            .catch((err) => console.warn('[PWA] precache miss:', url, err))
        )
      )
    })
  )
  // Activate new SW immediately on install
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_VERSION)
          .map((k) => caches.delete(k))
      )
      await self.clients.claim()
    })()
  )
})

function isCacheableAsset(url) {
  // Same-origin static assets only. Skip Next.js RSC / JSON payloads and
  // any auth/data endpoints.
  if (url.origin !== self.location.origin) return false
  if (url.pathname.startsWith('/api/')) return false
  if (url.pathname.startsWith('/share/')) return false // share page reads DB — never cache
  if (url.pathname.startsWith('/_next/data/')) return false
  if (url.pathname.startsWith('/auth/')) return false
  if (url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/register') ||
      url.pathname.startsWith('/forgot-password') ||
      url.pathname.startsWith('/reset-password')) return false

  // Cache static-ish assets only (RSC HTML fall-through to network).
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/icon.svg' ||
    url.pathname === '/manifest.webmanifest' ||
    /\.(?:js|css|png|jpg|jpeg|gif|svg|webp|woff2?)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET') return

  const url = new URL(req.url)

  // 1) HTML navigations — network first, offline fallback last.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Refresh shell cache with the latest successful navigation HTML
          // for the app shell only (don't cache protected routes).
          if (res.ok && url.pathname === '/') {
            const copy = res.clone()
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy))
          }
          return res
        })
        .catch(async () => {
          const cached = await caches.match(req)
          if (cached) return cached
          const offline = await caches.match('/~offline')
          return (
            offline ||
            new Response('Offline', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          )
        })
    )
    return
  }

  // 2) Cacheable static assets — stale-while-revalidate.
  if (isCacheableAsset(url)) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(req)
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone())
            return res
          })
          .catch(() => cached)
        return cached || network
      })
    )
  }
})
