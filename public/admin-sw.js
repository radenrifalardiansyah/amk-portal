// Minimal service worker — exists only to satisfy PWA installability criteria
// (Chrome/Android require a registered SW with a fetch handler before showing
// the install prompt). No caching/offline behavior on purpose: the admin
// panel needs live Firestore data, so we always pass requests straight through.
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
