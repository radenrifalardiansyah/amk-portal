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

// Push notifications (chat): FCM delivers a standard Web Push payload, so we
// parse and display it ourselves instead of pulling in the full firebase-messaging SW helper.
self.addEventListener('push', (event) => {
  let payload = {}
  try { payload = event.data ? event.data.json() : {} } catch { payload = {} }
  const notification = payload.notification || {}
  const data = payload.data || {}
  const title = notification.title || data.title || 'AMK Admin'
  const body = notification.body || data.body || ''
  const url = data.url || '/admin/dashboard'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/admin/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes(url))
      if (existing) return existing.focus()
      return self.clients.openWindow(url)
    })
  )
})
