import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  IconButton, 
  Slide, 
  Badge,
  Button,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useFirebase } from '../contexts/FirebaseContext';
import { ref, get, set } from 'firebase/database';
import { database } from '../firebase';
import { requestNotificationPermission } from '../firebase';

interface Notification {
  id: number;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

const InAppNotification: React.FC = () => {
  const { currentUser } = useFirebase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<Notification | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Check notification permission status on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('unsupported');
    }
  }, []);

  // Poll for new notifications
  useEffect(() => {
    if (!currentUser) return;

    const checkForNotifications = async () => {
      try {
        const userId = currentUser.uid;
        const notificationsRef = ref(database, `users/${userId}/notifications`);
        const snapshot = await get(notificationsRef);

        if (snapshot.exists()) {
          const notificationsData = snapshot.val();
          setNotifications(notificationsData);
          
          // Count unread notifications
          const unread = notificationsData.filter((notification: Notification) => !notification.read);
          setUnreadCount(unread.length);
          
          // Show the newest unread notification
          if (unread.length > 0 && !showNotification) {
            const newest = unread.reduce((newest: Notification, notification: Notification) => {
              const notificationTime = new Date(notification.timestamp).getTime();
              const newestTime = new Date(newest.timestamp).getTime();
              return notificationTime > newestTime ? notification : newest;
            }, unread[0]);
            
            setCurrentNotification(newest);
            setShowNotification(true);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
              setShowNotification(false);
            }, 5000);
          }
        }
      } catch (error) {
        console.error('Error checking for notifications:', error);
      }
    };

    // Check immediately
    checkForNotifications();
    
    // Then check every 10 seconds (more frequent than the polling in FirebaseContext)
    const intervalId = setInterval(checkForNotifications, 10000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [currentUser, showNotification]);

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      const userId = currentUser.uid;
      const notificationsRef = ref(database, `users/${userId}/notifications`);
      
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      await set(notificationsRef, updatedNotifications);
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      setShowNotificationPanel(false);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = () => {
    setShowNotificationPanel(!showNotificationPanel);
  };

  // Close the current notification
  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  // Request notification permission
  const handleRequestPermission = async () => {
    if (!('Notification' in window)) {
      setSnackbarMessage('This browser does not support notifications');
      setSnackbarOpen(true);
      return;
    }

    try {
      const token = await requestNotificationPermission();
      setPermissionStatus(Notification.permission);
      
      if (Notification.permission === 'granted') {
        setSnackbarMessage('Notifications enabled successfully' + (token ? '' : ' (but FCM token could not be obtained)'));
      } else if (Notification.permission === 'denied') {
        setSnackbarMessage('Notification permission denied. You will receive in-app notifications instead.');
      } else {
        setSnackbarMessage('Notification permission status unchanged');
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      setSnackbarMessage('Error enabling notifications');
      setSnackbarOpen(true);
    }
  };

  // Get the appropriate notification icon based on permission status
  const getNotificationIcon = () => {
    if (permissionStatus === 'granted') {
      return <NotificationsActiveIcon />;
    } else if (permissionStatus === 'denied') {
      return <NotificationsOffIcon />;
    } else {
      return <NotificationsIcon />;
    }
  };

  // Get tooltip text based on permission status
  const getTooltipText = () => {
    if (permissionStatus === 'granted') {
      return 'Notifications enabled';
    } else if (permissionStatus === 'denied') {
      return 'Notifications blocked - click to enable in-app notifications';
    } else if (permissionStatus === 'unsupported') {
      return 'Your browser does not support notifications';
    } else {
      return 'Enable notifications';
    }
  };

  return (
    <>
      {/* Notification Badge */}
      <Box 
        sx={{ 
          position: 'fixed', 
          top: 16, 
          right: 16, 
          zIndex: 1300,
          display: 'flex',
          gap: 1
        }}
      >
        {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
          <Tooltip title="Enable push notifications">
            <IconButton 
              color="primary" 
              onClick={handleRequestPermission}
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              <NotificationsIcon />
            </IconButton>
          </Tooltip>
        )}
        
        <Tooltip title={getTooltipText()}>
          <Badge badgeContent={unreadCount} color="error">
            <IconButton 
              color="primary" 
              onClick={handleNotificationClick}
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: 2,
                '&:hover': { bgcolor: 'background.paper' }
              }}
            >
              {getNotificationIcon()}
            </IconButton>
          </Badge>
        </Tooltip>
      </Box>

      {/* Notification Panel */}
      {showNotificationPanel && (
        <Paper
          sx={{
            position: 'fixed',
            top: 70,
            right: 16,
            width: 300,
            maxHeight: 400,
            overflow: 'auto',
            zIndex: 1300,
            p: 2,
            boxShadow: 3,
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Notifications</Typography>
            <Button size="small" onClick={markAllAsRead}>Mark all read</Button>
          </Box>
          
          {/* Notification Permission Status */}
          <Box 
            sx={{ 
              mb: 2, 
              p: 1.5, 
              borderRadius: 1,
              bgcolor: permissionStatus === 'granted' 
                ? 'success.50' 
                : permissionStatus === 'denied' 
                  ? 'error.50' 
                  : 'warning.50',
              border: '1px solid',
              borderColor: permissionStatus === 'granted' 
                ? 'success.200' 
                : permissionStatus === 'denied' 
                  ? 'error.200' 
                  : 'warning.200',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              {permissionStatus === 'granted' ? (
                <NotificationsActiveIcon color="success" sx={{ mr: 1 }} />
              ) : permissionStatus === 'denied' ? (
                <NotificationsOffIcon color="error" sx={{ mr: 1 }} />
              ) : (
                <NotificationsIcon color="warning" sx={{ mr: 1 }} />
              )}
              <Typography variant="subtitle2">
                {permissionStatus === 'granted' 
                  ? 'Push notifications enabled' 
                  : permissionStatus === 'denied' 
                    ? 'Push notifications blocked' 
                    : permissionStatus === 'unsupported'
                      ? 'Notifications not supported'
                      : 'Push notifications not enabled'}
              </Typography>
            </Box>
            
            {permissionStatus !== 'granted' && permissionStatus !== 'unsupported' && (
              <Button 
                size="small" 
                variant="outlined" 
                fullWidth 
                onClick={handleRequestPermission}
                sx={{ mt: 1 }}
              >
                Enable Push Notifications
              </Button>
            )}
            
            {permissionStatus === 'denied' && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                You'll still receive notifications in the app
              </Typography>
            )}
          </Box>
          
          {notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
              No notifications
            </Typography>
          ) : (
            notifications.map((notification) => (
              <Paper
                key={notification.id}
                sx={{
                  p: 1.5,
                  mb: 1.5,
                  bgcolor: notification.read ? 'background.paper' : 'primary.50',
                  borderLeft: notification.read ? 'none' : '4px solid',
                  borderColor: 'primary.main'
                }}
              >
                <Typography variant="subtitle2">{notification.title}</Typography>
                <Typography variant="body2">{notification.body}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(notification.timestamp).toLocaleString()}
                </Typography>
              </Paper>
            ))
          )}
        </Paper>
      )}

      {/* Toast Notification */}
      <Slide direction="left" in={showNotification} mountOnEnter unmountOnExit>
        <Paper
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            width: 300,
            p: 2,
            boxShadow: 3,
            borderRadius: 2,
            zIndex: 1300
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="subtitle1">{currentNotification?.title}</Typography>
              <Typography variant="body2">{currentNotification?.body}</Typography>
              <Typography variant="caption" color="text.secondary">
                {currentNotification && new Date(currentNotification.timestamp).toLocaleString()}
              </Typography>
            </Box>
            <IconButton size="small" onClick={handleCloseNotification}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Slide>

      {/* Snackbar for messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={
            permissionStatus === 'granted' ? 'success' : 
            permissionStatus === 'denied' ? 'warning' : 'info'
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default InAppNotification; 