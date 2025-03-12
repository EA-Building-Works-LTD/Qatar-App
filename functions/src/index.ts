import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// Log when the function is initialized
console.log('Firebase Cloud Functions initialized');

// Simple HTTP function to send a notification
export const sendNotificationHttp = functions.https.onRequest(async (req, res) => {
  try {
    // Check if the request is authorized (you should implement proper auth)
    // For now, we'll just check if there's a token in the request
    const { token, title, body } = req.body;
    
    if (!token || !title || !body) {
      res.status(400).send({ error: 'Missing required parameters' });
      return;
    }
    
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
          badge: '/logo192.png'
        }
      }
    };
    
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, messageId: response });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).send({ error: 'Failed to send notification' });
  }
});

// Database trigger to send notifications when a new note is added
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
      const promises = [];
      
      Object.entries(users).forEach(([userId, userData]) => {
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
          
          promises.push(admin.messaging().send(message));
        }
      });
      
      if (promises.length > 0) {
        await Promise.all(promises);
        console.log(`Successfully sent notifications to ${promises.length} users`);
      } else {
        console.log('No notifications to send');
      }
      
      return null;
    } catch (error) {
      console.error('Error in onNoteAdded function:', error);
      return null;
    }
  }); 