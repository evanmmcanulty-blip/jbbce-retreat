/* Background push handler for the installed PWA. Receives data-only FCM messages
   and renders the notification itself, so we control the icon and the tap target. */
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDI-BmY2wbvkFgNuX6ZwUz-DnbYdUNKL-o',
  authDomain: 'provincetown-2026.firebaseapp.com',
  projectId: 'provincetown-2026',
  storageBucket: 'provincetown-2026.firebasestorage.app',
  messagingSenderId: '594123686763',
  appId: '1:594123686763:web:99a670965c6924cb2a822e'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  const d = payload.data || {};
  self.registration.showNotification(d.title || "PTown '26", {
    body: d.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: d.tab ? '/?n=' + d.tab : '/' }
  });
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
