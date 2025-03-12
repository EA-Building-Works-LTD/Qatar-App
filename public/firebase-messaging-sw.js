// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

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

// Store for tracking notification IDs to prevent duplicates
const processedNotifications = new Set();

// Log when the service worker is installed
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installed');
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Log when the service worker is activated
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  // Tell the active service worker to take control of the page immediately
  event.waitUntil(self.clients.claim());
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Received message from client:', event.data);
  
  if (event.data && event.data.type === 'SEND_NOTIFICATION') {
    const payload = event.data.payload;
    const notificationId = payload.tag || `notification-${Date.now()}`;
    
    // Check if we've already shown this notification
    if (processedNotifications.has(notificationId)) {
      console.log('[firebase-messaging-sw.js] Notification already displayed:', notificationId);
      return;
    }
    
    // Add to our tracking set
    processedNotifications.add(notificationId);
    
    // Show the notification
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || '/logo192.png',
      badge: '/badge-icon.png',
      tag: notificationId,
      data: payload.data || {},
      vibrate: [200, 100, 200], // Vibration pattern for mobile devices
      requireInteraction: false, // Don't require interaction on mobile
      renotify: false // Don't notify again if the tag is the same
    }).then(() => {
      console.log('[firebase-messaging-sw.js] Notification shown successfully');
    }).catch(error => {
      console.error('[firebase-messaging-sw.js] Error showing notification:', error);
    });
    
    console.log('[firebase-messaging-sw.js] Notification shown from client message');
  }
});

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  try {
    // Extract notification data
    const notificationData = payload.notification || payload.data || {};
    const notificationId = notificationData.tag || `notification-${Date.now()}`;
    
    // Check if we've already processed this notification
    if (processedNotifications.has(notificationId)) {
      console.log('[firebase-messaging-sw.js] Duplicate notification detected, skipping:', notificationId);
      return;
    }
    
    // Add to processed set (with a maximum size to prevent memory issues)
    processedNotifications.add(notificationId);
    if (processedNotifications.size > 100) {
      // Remove the oldest entry if we have too many
      processedNotifications.delete(processedNotifications.values().next().value);
    }
    
    // Create notification options
    const notificationOptions = {
      body: notificationData.body || 'New notification',
      icon: notificationData.icon || '/logo192.png',
      badge: '/badge-icon.png',
      tag: notificationId,
      data: {
        url: notificationData.click_action || '/',
        ...payload.data
      },
      vibrate: [200, 100, 200], // Vibration pattern for mobile devices
      requireInteraction: false, // Don't require interaction on mobile
      renotify: false // Don't notify again if the tag is the same
    };
    
    // Show the notification
    return self.registration.showNotification(
      notificationData.title || 'Doha Itinerary',
      notificationOptions
    ).then(() => {
      console.log('[firebase-messaging-sw.js] Background notification shown successfully');
    }).catch(error => {
      console.error('[firebase-messaging-sw.js] Error showing background notification:', error);
    });
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error processing background message:', error);
  }
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event);
  
  // Close the notification
  event.notification.close();
  
  // Get the notification data
  const clickAction = event.notification.data?.url || '/';
  
  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window/tab is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(clickAction);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', function(event) {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
});

// Handle push events directly (as a fallback)
self.addEventListener('push', function(event) {
  console.log('[firebase-messaging-sw.js] Push received:', event);
  
  // Ensure the event has data
  if (!event.data) return;
  
  try {
    // Try to parse the data
    const data = event.data.json();
    console.log('[firebase-messaging-sw.js] Push data:', data);
    
    // Extract notification data
    const notificationData = data.notification || data.data || {};
    const notificationId = notificationData.tag || `push-${Date.now()}`;
    
    // Check if we've already processed this notification
    if (processedNotifications.has(notificationId)) {
      console.log('[firebase-messaging-sw.js] Duplicate push notification detected, skipping:', notificationId);
      return;
    }
    
    // Add to processed set
    processedNotifications.add(notificationId);
    
    // Create notification options
    const notificationOptions = {
      body: notificationData.body || 'New notification',
      icon: notificationData.icon || '/logo192.png',
      badge: '/badge-icon.png',
      tag: notificationId,
      data: {
        url: notificationData.click_action || '/',
        ...data.data
      },
      vibrate: [200, 100, 200], // Vibration pattern for mobile devices
      requireInteraction: false, // Don't require interaction on mobile
      renotify: false // Don't notify again if the tag is the same
    };
    
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(
        notificationData.title || 'Doha Itinerary',
        notificationOptions
      ).then(() => {
        console.log('[firebase-messaging-sw.js] Push notification shown successfully');
      }).catch(error => {
        console.error('[firebase-messaging-sw.js] Error showing push notification:', error);
      })
    );
  } catch (error) {
    console.error('[firebase-messaging-sw.js] Error handling push event:', error);
  }
}); 