import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getFunctions } from 'firebase/functions';
import { ref, set, get } from 'firebase/database';

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

// Request notification permission and get FCM token
export const requestNotificationPermission = async () => {
  try {
    console.log('Requesting notification permission...');
    
    // Check if the browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return null;
    }
    
    // Check if this is an iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Log current permission status
    console.log('Notification permission status:', Notification.permission);
    console.log('Is iOS device:', isIOS);
    
    // For iOS devices, we need to check if the app is installed as PWA
    if (isIOS) {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone || 
                          document.referrer.includes('ios-app://');
      
      console.log('Is running as PWA:', isStandalone);
      
      if (!isStandalone) {
        console.log('iOS device not running as PWA - notifications may not work properly');
        // We'll still try to request permission, but it might not work
      }
    }
    
    // Request permission if not already granted
    let permission = Notification.permission;
    if (permission !== 'granted') {
      try {
        permission = await Notification.requestPermission();
        console.log('Permission request result:', permission);
      } catch (err) {
        console.error('Error requesting notification permission:', err);
      }
    }
    
    // If permission is granted, try to get FCM token
    if (permission === 'granted') {
      try {
        // Try to register the service worker first
        let serviceWorkerRegistration = null;
        
        if ('serviceWorker' in navigator) {
          try {
            serviceWorkerRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
            console.log('Service worker registered successfully:', serviceWorkerRegistration);
            
            // Wait for the service worker to be ready
            await navigator.serviceWorker.ready;
            console.log('Service worker is ready');
          } catch (swError) {
            console.error('Error registering service worker:', swError);
          }
        } else {
          console.warn('Service workers are not supported in this browser');
        }
        
        // Initialize messaging
        const messaging = getMessaging(app);
        
        // Get registration token with retry mechanism
        let token = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!token && retryCount < maxRetries) {
          try {
            // Try to get token with service worker registration if available
            const tokenOptions: any = {
              vapidKey: 'BC1wk7JXpecceP1plQJWYbDE997KuMvjo5Pk1Wv3wD144Fw944-MBzgsopwlOQMZ96hBYH1K3CCOALQu373lQEg'
            };
            
            if (serviceWorkerRegistration) {
              tokenOptions.serviceWorkerRegistration = serviceWorkerRegistration;
            }
            
            token = await getToken(messaging, tokenOptions);
            
            if (token) {
              console.log('FCM Token obtained successfully:', token);
              
              // Save the token to the user's profile
              if (auth.currentUser) {
                const userId = auth.currentUser.uid;
                const fcmTokenRef = ref(database, `users/${userId}/fcmToken`);
                await set(fcmTokenRef, token);
                console.log('FCM Token saved to user profile');
                
                // Also set notification method to push
                const notificationMethodRef = ref(database, `users/${userId}/notificationMethod`);
                await set(notificationMethodRef, 'push');
                console.log('User marked for push notifications');
              }
              
              return token;
            } else {
              console.warn(`FCM Token is null (attempt ${retryCount + 1}/${maxRetries})`);
              retryCount++;
              
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (tokenErr) {
            console.error(`Error getting FCM token (attempt ${retryCount + 1}/${maxRetries}):`, tokenErr);
            retryCount++;
            
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        
        // If we couldn't get a token after retries, fall back to in-app notifications
        if (!token) {
          console.warn('Could not obtain FCM token after multiple attempts. Falling back to in-app notifications.');
          
          // Mark that this user should use in-app notifications
          if (auth.currentUser) {
            const userId = auth.currentUser.uid;
            const notificationMethodRef = ref(database, `users/${userId}/notificationMethod`);
            await set(notificationMethodRef, 'in-app');
            console.log('User marked for in-app notifications');
          }
        }
        
        return token;
      } catch (err) {
        console.error('Error in FCM token retrieval:', err);
        
        // Mark that this user should use in-app notifications
        if (auth.currentUser) {
          const userId = auth.currentUser.uid;
          const notificationMethodRef = ref(database, `users/${userId}/notificationMethod`);
          await set(notificationMethodRef, 'in-app');
          console.log('User marked for in-app notifications due to FCM error');
        }
        
        return null;
      }
    } else if (permission === 'denied') {
      console.warn('Notification permission denied by user');
      
      // Mark that this user should use in-app notifications
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const notificationMethodRef = ref(database, `users/${userId}/notificationMethod`);
        await set(notificationMethodRef, 'in-app');
        console.log('User marked for in-app notifications due to denied permissions');
      }
      
      return null;
    } else {
      console.log('Notification permission status remains default/unset');
      
      // Mark that this user should use in-app notifications for now
      if (auth.currentUser) {
        const userId = auth.currentUser.uid;
        const notificationMethodRef = ref(database, `users/${userId}/notificationMethod`);
        await set(notificationMethodRef, 'in-app');
        console.log('User marked for in-app notifications due to unset permissions');
      }
      
      return null;
    }
  } catch (err) {
    console.error('Error in requestNotificationPermission:', err);
    
    // Mark that this user should use in-app notifications
    if (auth.currentUser) {
      const userId = auth.currentUser.uid;
      const notificationMethodRef = ref(database, `users/${userId}/notificationMethod`);
      await set(notificationMethodRef, 'in-app');
      console.log('User marked for in-app notifications due to error');
    }
    
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