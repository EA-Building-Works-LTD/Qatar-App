import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendNotification = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { token, notification } = data;

  try {
    await admin.messaging().send({
      token,
      notification,
      webpush: {
        notification: {
          ...notification,
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [100, 50, 100],
          requireInteraction: true
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', 'Error sending notification');
  }
}); 