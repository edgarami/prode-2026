/* Service Worker de Firebase Cloud Messaging (mensajes en segundo plano) */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyDJ7Cdjk2tj9tvP2K7ira0ZonCW205X3fU',
  authDomain:        'world-cup-predictor-c431d.firebaseapp.com',
  projectId:         'world-cup-predictor-c431d',
  storageBucket:     'world-cup-predictor-c431d.firebasestorage.app',
  messagingSenderId: '823326785502',
  appId:             '1:823326785502:web:077f34d12134d6434c674f',
});

const messaging = firebase.messaging();

// Notificación cuando la app está cerrada o en segundo plano
messaging.onBackgroundMessage(payload => {
  const title = payload.notification?.title || '⚽ La Quiniela Vinotinto';
  const options = {
    body:  payload.notification?.body || 'Tenés un partido sin predecir.',
    icon:  'assets/logo.png',
    badge: 'assets/logo.png',
    data:  { url: payload.data?.url || '/mis-apuestas' },
    vibrate: [100, 50, 100],
  };
  self.registration.showNotification(title, options);
});

// Al tocar la notificación → abrir la app en Mis Apuestas
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/mis-apuestas';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) { c.navigate(url); return c.focus(); }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
