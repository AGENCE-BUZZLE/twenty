// Buzzle CRM — service worker dédié aux Web Push (nouveaux leads).
// Volontairement minimal : aucun handler `fetch`/cache, donc il
// n'interfère pas avec l'app. Il gère seulement la réception d'un push
// et le clic sur la notification.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Buzzle CRM', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Buzzle CRM';
  const options = {
    body: data.body || '',
    icon: '/images/icons/android/android-launchericon-192-192.png',
    badge: '/images/icons/android/android-launchericon-96-96.png',
    tag: data.tag || 'buzzle-lead',
    renotify: true,
    data: { url: data.url || '/contacts' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target =
    (event.notification.data && event.notification.data.url) || '/contacts';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of allClients) {
        if ('focus' in client) {
          try {
            await client.navigate(target);
          } catch (e) {
            // navigate peut échouer sur certains navigateurs · on focus quand même
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(target);
      }
      return undefined;
    })(),
  );
});
