import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';
import { ref, set } from 'firebase/database';

// Your web app's Firebase configuration
// For development purposes, we'll use hardcoded values
// In production, you should use environment variables
const firebaseConfig = {
  apiKey: "AIzaSyBUmWaX7qvuvf--wBfkqbC4N7V0a62_NZ8",
  authDomain: "voyagr-e260d.firebaseapp.com",
  databaseURL: "https://voyagr-e260d-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "voyagr-e260d",
  storageBucket: "voyagr-e260d.firebasestorage.app",
  messagingSenderId: "757436257558",
  appId: "1:757436257558:web:a4005e9211e309eb36ec37",
  measurementId: "G-KXN3VBMBK8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const messaging = getMessaging(app);
const functions = getFunctions(app);
const googleProvider = new GoogleAuthProvider();

// Function to request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return null;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.error('This browser does not support service workers, which are required for push notifications');
      return null;
    }

    // Request permission
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Notification permission status:', permission);
    
    if (permission === 'granted') {
      try {
        // Register service worker if not already registered
        console.log('Registering service worker...');
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service worker registered successfully');
        
        // Get the active service worker registration
        const registration = await navigator.serviceWorker.ready;
        console.log('Service worker ready:', registration);
        
        // Get FCM token
        console.log('Requesting FCM token...');
        const token = await getToken(messaging, {
          vapidKey: 'BC1wk7JXpecceP1plQJWYbDE997KuMvjo5Pk1Wv3wD144Fw944-MBzgsopwlOQMZ96hBYH1K3CCOALQu373lQEg',
          serviceWorkerRegistration: registration
        });
        
        console.log('FCM token request completed');
        
        if (token) {
          console.log('FCM token received successfully');
          // Save the token to the user's profile in the database
          const userId = auth.currentUser?.uid;
          if (userId) {
            const tokenRef = ref(database, `users/${userId}/fcmToken`);
            await set(tokenRef, token);
            console.log('FCM token saved to database');
          }
          return token;
        } else {
          console.error('Failed to get FCM token even though permission was granted');
          return null;
        }
      } catch (tokenError) {
        console.error('Error getting FCM token:', tokenError);
        return null;
      }
    } else {
      console.warn(`Notification permission ${permission}`);
      return null;
    }
  } catch (err) {
    console.error('Error in requestNotificationPermission:', err);
    return null;
  }
};

// Function to handle foreground messages
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
};

export { app, database, auth, messaging, functions, googleProvider }; 