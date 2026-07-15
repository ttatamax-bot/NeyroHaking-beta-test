// OneSignal Service Worker
importScripts("https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js");

// Existing app service worker code
const CACHE_NAME = 'neurohacking-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
});

self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, body } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'НейроХакинг', {
        body: body || 'Пора выполнить техники дня!',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'daily-reminder',
        renotify: true,
        requireInteraction: false,
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
