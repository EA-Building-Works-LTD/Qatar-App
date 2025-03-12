import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as cors from 'cors';

admin.initializeApp();

// Initialize CORS middleware
const corsHandler = cors({ origin: true });

// Log when the function is initialized
console.log('Firebase Cloud Functions initialized');

// HTTP function to send a notification
export const sendNotification = functions.https.onRequest((req, res) => {
  // Handle CORS
  return corsHandler(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).send({ error: 'Method not allowed' });
        return;
      }
      
      // Get token and notification data from request body
      const { token, title, body } = req.body;
      
      if (!token || !title || !body) {
        res.status(400).send({ error: 'Missing required parameters' });
        return;
      }
      
      console.log(`Attempting to send notification to token: ${token.substring(0, 10)}...`);
      
      // Send the notification
      const message = {
        token,
        notification: {
          title,
          body
        },
        webpush: {
          notification: {
            icon: '/logo192.png',
            badge: '/logo192.png',
            vibrate: [100, 50, 100],
            requireInteraction: true
          },
          fcmOptions: {
            link: '/'
          }
        },
        android: {
          notification: {
            icon: 'notification_icon',
            color: '#3366FF'
          }
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default'
            }
          }
        }
      };
      
      try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent notification:', response);
        res.status(200).send({ success: true, messageId: response });
      } catch (error) {
        console.error('Error sending notification:', error);
        res.status(500).send({ error: 'Failed to send notification', details: error.message });
      }
    } catch (error) {
      console.error('Error in sendNotification function:', error);
      res.status(500).send({ error: 'Internal server error' });
    }
  });
});

// Database trigger to send notifications when a new note is added
// Using the v1 syntax for database triggers
export const onNoteAdded = functions.database
  .ref('/shared/{tripId}/notes/{noteId}')
  .onCreate(async (snapshot, context) => {
    try {
      const note = snapshot.val();
      console.log('New note added:', note);
      
      if (!note || !note.author || !note.text) {
        console.log('Invalid note data, skipping notification');
        return null;
      }
      
      // Get all users
      const usersSnapshot = await admin.database().ref('users').once('value');
      const users = usersSnapshot.val();
      
      if (!users) {
        console.log('No users found, skipping notification');
        return null;
      }
      
      // Send notification to all users except the author
      const authorEmail = note.author.email;
      
      for (const userId in users) {
        const userData = users[userId];
        if (userData.fcmToken && userData.userProfile?.email !== authorEmail) {
          console.log(`Sending notification to user: ${userData.userProfile?.email}`);
          
          const message = {
            token: userData.fcmToken,
            notification: {
              title: 'New Place Added',
              body: `${note.author.name} added "${note.text}" to places to visit`
            },
            webpush: {
              notification: {
                icon: '/logo192.png',
                badge: '/logo192.png'
              }
            }
          };
          
          try {
            const response = await admin.messaging().send(message);
            console.log(`Successfully sent notification to ${userData.userProfile?.email}:`, response);
          } catch (error) {
            console.error(`Error sending notification to ${userData.userProfile?.email}:`, error);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error in onNoteAdded function:', error);
      return null;
    }
  }); 