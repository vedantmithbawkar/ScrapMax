// ScrapMax Service Worker for PWA & Smart Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming background push notifications
self.addEventListener('push', (event) => {
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    data = {
      title: 'ScrapMax Update',
      body: event.data ? event.data.text() : 'You have a new update from ScrapMax.',
    };
  }

  const title = data.title || 'ScrapMax Notification';
  const options = {
    body: data.body || 'You have a new circular recycling update.',
    icon: data.icon || '/globe.svg',
    badge: data.badge || '/globe.svg',
    tag: data.tag || 'scrapmax-notification',
    data: data.data || { url: '/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click to bring app to foreground
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
