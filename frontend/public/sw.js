const CACHE_NAME = 'internflow-cache-v1';

// Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/favicon.svg',
        '/icon-192.svg',
        '/icon-512.svg',
        '/manifest.json'
      ]).catch((err) => {
        console.warn('Pre-cache error during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercept fetch requests for caching
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Exclude API requests and non-GET requests from caching
  if (request.method !== 'GET' || url.pathname.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to update cache (stale-while-revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => { /* ignore offline network failures */ });

        return cachedResponse;
      }

      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // If offline and request is HTML document, return index.html for React SPA
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// Listen to web push notifications dispatch
self.addEventListener('push', (event) => {
  if (!event.data) {
    console.log('Push event received with no data payload.');
    return;
  }

  try {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.svg',
      badge: data.badge || '/favicon.svg',
      vibrate: [100, 50, 100],
      data: data.data || {},
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'InternFlow Alert', options)
    );
  } catch (err) {
    console.warn('Push payload not JSON, falling back to text representation:', err);
    event.waitUntil(
      self.registration.showNotification('InternFlow Notification', {
        body: event.data.text(),
        icon: '/icon-192.svg',
        badge: '/favicon.svg',
      })
    );
  }
});

// Handle push notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Extract redirection URL from custom data payload, defaulting to home dashboard
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if open
      for (const client of windowClients) {
        const urlMatches = new URL(client.url).pathname === new URL(targetUrl, client.url).pathname;
        if (urlMatches && 'focus' in client) {
          return client.focus().then((focusedClient) => {
            if (focusedClient && 'navigate' in focusedClient) {
              return focusedClient.navigate(targetUrl);
            }
          });
        }
      }
      
      // Otherwise open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
