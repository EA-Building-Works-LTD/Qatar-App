import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
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
const googleProvider = new GoogleAuthProvider();

// Function to request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'BC1wk7JXpecceP1plQJWYbDE997KuMvjo5Pk1Wv3wD144Fw944-MBzgsopwlOQMZ96hBYH1K3CCOALQu373lQEg' // You'll need to add your VAPID key here
      });
      
      if (token) {
        // Save the token to the user's profile in the database
        const userId = auth.currentUser?.uid;
        if (userId) {
          const tokenRef = ref(database, `users/${userId}/fcmToken`);
          await set(tokenRef, token);
        }
        return token;
      }
    }
    return null;
  } catch (err) {
    console.error('Error getting notification permission:', err);
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

export { app, database, auth, messaging, googleProvider }; 