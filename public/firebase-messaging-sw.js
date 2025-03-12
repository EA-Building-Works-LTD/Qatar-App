// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
firebase.initializeApp({
  apiKey: "AIzaSyBUmWaX7qvuvf--wBfkqbC4N7V0a62_NZ8",
  authDomain: "voyagr-e260d.firebaseapp.com",
  databaseURL: "https://voyagr-e260d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "voyagr-e260d",
  storageBucket: "voyagr-e260d.firebasestorage.app",
  messagingSenderId: "757436257558",
  appId: "1:757436257558:web:a4005e9211e309eb36ec37",
  measurementId: "G-KXN3VBMBK8"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Log when the service worker is installed
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  self.skipWaiting();
});

// Log when the service worker is activated
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  return self.clients.claim();
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Received message from client:', event.data);
  
  if (event.data && event.data.type === 'SEND_NOTIFICATION') {
    const payload = event.data.payload;
    
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/logo192.png',
      badge: '/logo192.png',
      tag: 'place-added',
      data: payload.data || {}
    });
    
    console.log('[firebase-messaging-sw.js] Notification shown from client message');
  }
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'place-added',
    data: payload.data || {}
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  event.notification.close();
  
  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients.matchAll({
      type: "window"
    })
    .then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client)
          return client.focus();
      }
      if (clients.openWindow)
        return clients.openWindow('/');
    })
  );
}); 