import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Card,
  CardContent,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  FormGroup,
  Snackbar,
  Alert,
  Grid,
  MenuItem
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpIcon from '@mui/icons-material/Help';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LanguageIcon from '@mui/icons-material/Language';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import SecurityIcon from '@mui/icons-material/Security';
import { useTheme } from '../contexts/ThemeContext';
import { useFirebase } from '../contexts/FirebaseContext';
import { useNavigate } from 'react-router-dom';
import { ref, get, set } from 'firebase/database';
import { database } from '../firebase';

// Define user profile interface
interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

// Define notification settings interface
interface NotificationSettings {
  email: boolean;
  push: boolean;
  updates: boolean;
}

// Define preferences interface
interface Preferences {
  darkMode: boolean;
  language: string;
  sound: boolean;
}

const ProfilePage: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { 
    userProfile, 
    updateUserProfile, 
    notificationSettings, 
    updateNotificationSettings, 
    preferences, 
    updatePreferences,
    signOutUser,
    currentUser
  } = useFirebase();
  
  const navigate = useNavigate();
  
  // State for dialogs
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [notificationsDialogOpen, setNotificationsDialogOpen] = useState(false);
  const [preferencesDialogOpen, setPreferencesDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  // State for form inputs
  const [formName, setFormName] = useState(userProfile.name);
  const [formEmail, setFormEmail] = useState(userProfile.email);

  // Update form inputs when userProfile changes
  useEffect(() => {
    setFormName(userProfile.name);
    setFormEmail(userProfile.email);
  }, [userProfile]);

  // State for snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');

  // Handle edit profile dialog
  const handleEditProfileOpen = () => {
    setFormName(userProfile.name);
    setFormEmail(userProfile.email);
    setEditProfileOpen(true);
  };

  const handleEditProfileClose = () => {
    setEditProfileOpen(false);
  };

  const handleEditProfileSave = async () => {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formEmail)) {
      setSnackbarMessage('Please enter a valid email address');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      // Update profile
      const newProfile = {
        ...userProfile,
        name: formName,
        email: formEmail,
        avatar: formName.charAt(0).toUpperCase()
      };
      
      await updateUserProfile(newProfile);
      setEditProfileOpen(false);
      
      setSnackbarMessage('Profile updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbarMessage('Failed to update profile');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle notification settings
  const handleNotificationChange = async (setting: keyof NotificationSettings) => {
    try {
      const updatedSettings = {
        ...notificationSettings,
        [setting]: !notificationSettings[setting]
      };
      
      await updateNotificationSettings(updatedSettings);
      
      // If enabling push notifications, request permission
      if (setting === 'push' && updatedSettings.push) {
        try {
          const permission = await Notification.requestPermission();
          console.log('Notification permission:', permission);
          
          if (permission === 'granted') {
            setSnackbarMessage('Push notifications enabled');
          } else {
            setSnackbarMessage('Push notification permission denied');
          }
        } catch (err) {
          console.error('Error requesting notification permission:', err);
        }
      }
      
      setSnackbarMessage(`${setting.charAt(0).toUpperCase() + setting.slice(1)} notifications ${updatedSettings[setting] ? 'enabled' : 'disabled'}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      setSnackbarMessage('Failed to update notification settings');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Test notification
  const handleTestNotification = async () => {
    if (!('Notification' in window)) {
      setSnackbarMessage('This browser does not support notifications');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    if (Notification.permission === 'granted') {
      try {
        // Create and show a test notification with a unique tag
        const notification = new Notification('Test Notification', {
          body: 'This is a test notification from Doha Itinerary',
          icon: '/logo192.png',
          tag: 'test-notification-' + Date.now() // Ensure uniqueness
        });
        
        notification.onclick = () => {
          console.log('Notification clicked');
          window.focus();
        };
        
        // Also store the test notification in the user's notifications in Firebase
        if (currentUser) {
          try {
            const userId = currentUser.uid;
            const notificationsRef = ref(database, `users/${userId}/notifications`);
            const snapshot = await get(notificationsRef);
            
            let notifications = [];
            if (snapshot.exists()) {
              notifications = snapshot.val();
            }
            
            // Add the test notification
            const testNotification = {
              id: Date.now(),
              title: 'Test Notification',
              body: 'This is a test notification from Doha Itinerary',
              timestamp: new Date().toISOString(),
              read: true // Mark as read since we already displayed it
            };
            
            await set(notificationsRef, [...notifications, testNotification]);
            console.log('Test notification stored in Firebase');
          } catch (error) {
            console.error('Error storing test notification:', error);
          }
        }
        
        setSnackbarMessage('Test notification sent');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error: unknown) {
        console.error('Error sending test notification:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setSnackbarMessage('Error sending test notification: ' + errorMessage);
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } else {
      setSnackbarMessage('Notification permission not granted');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
    }
  };

  // Handle preferences
  const handlePreferenceChange = async (
    preference: keyof Preferences, 
    value: boolean | React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string
  ) => {
    try {
      if (preference === 'darkMode') {
        toggleDarkMode();
      }
      
      const updatedPreferences = {
        ...preferences,
        [preference]: typeof value === 'boolean' 
          ? value 
          : typeof value === 'string'
            ? value
            : preference === 'language' 
              ? (value as React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>).target.value
              : (value as React.ChangeEvent<HTMLInputElement>).target.checked
      };
      
      await updatePreferences(updatedPreferences);
      
      setSnackbarMessage(`${preference.charAt(0).toUpperCase() + preference.slice(1)} preference updated`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setSnackbarMessage('Failed to update preferences');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOutUser();
      setLogoutDialogOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
      setSnackbarMessage('Failed to sign out');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ p: 2, mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings
        </Typography>
      </Box>
      
      {/* Profile Card */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'primary.main',
                fontSize: 32,
                fontWeight: 600,
                mr: 3
              }}
            >
              {userProfile.avatar}
            </Avatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {userProfile.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {userProfile.email}
              </Typography>
              {currentUser && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Google Account: {currentUser.email}
                </Typography>
              )}
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<EditIcon />}
                onClick={handleEditProfileOpen}
                sx={{ 
                  borderRadius: 2,
                  textTransform: 'none',
                  borderColor: 'rgba(0, 0, 0, 0.12)',
                  color: 'text.secondary'
                }}
              >
                Edit Profile
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Settings */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, px: 1 }}>
          Settings
        </Typography>
        
        <Card sx={{ borderRadius: 3 }}>
          <List disablePadding>
            <ListItem 
              onClick={() => setAccountDialogOpen(true)}
              sx={{ 
                py: 2,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                },
                cursor: 'pointer'
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <PersonIcon sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Account" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <KeyboardArrowRightIcon sx={{ color: 'text.secondary' }} />
            </ListItem>
            
            <Divider component="li" />
            
            <ListItem 
              onClick={() => setNotificationsDialogOpen(true)}
              sx={{ 
                py: 2,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                },
                cursor: 'pointer'
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <NotificationsIcon sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Notifications" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <KeyboardArrowRightIcon sx={{ color: 'text.secondary' }} />
            </ListItem>
            
            <Divider component="li" />
            
            <ListItem 
              onClick={() => setPreferencesDialogOpen(true)}
              sx={{ 
                py: 2,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                },
                cursor: 'pointer'
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SettingsIcon sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Preferences" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <KeyboardArrowRightIcon sx={{ color: 'text.secondary' }} />
            </ListItem>
          </List>
        </Card>
      </Box>
      
      {/* Support */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, px: 1 }}>
          Support
        </Typography>
        
        <Card sx={{ borderRadius: 3 }}>
          <List disablePadding>
            <ListItem 
              onClick={() => setHelpDialogOpen(true)}
              sx={{ 
                py: 2,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.02)'
                },
                cursor: 'pointer'
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <HelpIcon sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary="Help Center" 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
              <KeyboardArrowRightIcon sx={{ color: 'text.secondary' }} />
            </ListItem>
          </List>
        </Card>
      </Box>
      
      {/* Logout Button */}
      <Box sx={{ px: 2 }}>
        <Button 
          fullWidth
          variant="outlined" 
          color="error" 
          startIcon={<LogoutIcon />}
          onClick={() => setLogoutDialogOpen(true)}
          sx={{ 
            borderRadius: 3,
            py: 1.5,
            textTransform: 'none',
            fontWeight: 600
          }}
        >
          Log Out
        </Button>
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog 
        open={editProfileOpen} 
        onClose={handleEditProfileClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Edit Profile
            <IconButton onClick={handleEditProfileClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Name"
              fullWidth
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <TextField
              label="Email"
              fullWidth
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              type="email"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditProfileClose} color="inherit">Cancel</Button>
          <Button onClick={handleEditProfileSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Account Dialog */}
      <Dialog 
        open={accountDialogOpen} 
        onClose={() => setAccountDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Account Settings
            <IconButton onClick={() => setAccountDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemIcon>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Change Password" 
                secondary="Update your password for better security"
              />
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setAccountDialogOpen(false);
                  setSnackbarMessage('Password change functionality would be implemented here');
                  setSnackbarSeverity('info');
                  setSnackbarOpen(true);
                }}
              >
                Change
              </Button>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Privacy Settings" 
                secondary="Manage your privacy preferences"
              />
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setAccountDialogOpen(false);
                  setSnackbarMessage('Privacy settings would be implemented here');
                  setSnackbarSeverity('info');
                  setSnackbarOpen(true);
                }}
              >
                Manage
              </Button>
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAccountDialogOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog 
        open={notificationsDialogOpen} 
        onClose={() => setNotificationsDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Notification Settings
            <IconButton onClick={() => setNotificationsDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <FormGroup>
            <FormControlLabel
              control={
                <Switch 
                  checked={notificationSettings.email} 
                  onChange={() => handleNotificationChange('email')}
                  color="primary"
                />
              }
              label="Email Notifications"
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
              Receive notifications about your itinerary via email
            </Typography>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={notificationSettings.push} 
                  onChange={() => handleNotificationChange('push')}
                  color="primary"
                />
              }
              label="Push Notifications"
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
              Receive push notifications on your device
            </Typography>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={notificationSettings.updates} 
                  onChange={() => handleNotificationChange('updates')}
                  color="primary"
                />
              }
              label="Product Updates"
            />
            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -1, mb: 2 }}>
              Receive updates about new features and improvements
            </Typography>

            {/* Notification Permission Guide */}
            {Notification.permission === 'denied' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255, 0, 0, 0.05)', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="error" sx={{ fontWeight: 600, mb: 1 }}>
                  Notifications are blocked
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  You need to enable notifications in your browser settings to receive alerts when new places are added.
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  How to enable notifications:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary="Chrome" 
                      secondary="Click the lock icon in the address bar → Site settings → Notifications → Allow" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Firefox" 
                      secondary="Click the lock icon → Connection secure → More information → Permissions → Notifications → Allow" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Safari" 
                      secondary="Safari menu → Preferences → Websites → Notifications → Allow for this website" 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Mobile Devices" 
                      secondary="Add to home screen first, then enable notifications in app settings" 
                    />
                  </ListItem>
                </List>
              </Box>
            )}

            {/* Test Notification Button */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleTestNotification}
                disabled={Notification.permission !== 'granted'}
                sx={{ mt: 1 }}
              >
                Test Notification
              </Button>
            </Box>
            {Notification.permission !== 'granted' && Notification.permission !== 'denied' && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center', display: 'block' }}>
                Enable push notifications above to test
              </Typography>
            )}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotificationsDialogOpen(false)} color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Preferences Dialog */}
      <Dialog 
        open={preferencesDialogOpen} 
        onClose={() => setPreferencesDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Preferences
            <IconButton onClick={() => setPreferencesDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            <ListItem>
              <ListItemIcon>
                <DarkModeIcon />
              </ListItemIcon>
              <ListItemText primary="Dark Mode" />
              <Switch 
                checked={preferences.darkMode} 
                onChange={() => handlePreferenceChange('darkMode', !preferences.darkMode)}
                color="primary"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <LanguageIcon />
              </ListItemIcon>
              <ListItemText primary="Language" />
              <TextField
                select
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                variant="outlined"
                size="small"
                sx={{ width: 120 }}
              >
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Spanish">Spanish</MenuItem>
                <MenuItem value="French">French</MenuItem>
                <MenuItem value="German">German</MenuItem>
                <MenuItem value="Arabic">Arabic</MenuItem>
              </TextField>
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <VolumeUpIcon />
              </ListItemIcon>
              <ListItemText primary="Sound Effects" />
              <Switch 
                checked={preferences.sound} 
                onChange={() => handlePreferenceChange('sound', !preferences.sound)}
                color="primary"
              />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreferencesDialogOpen(false)} color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Help Center Dialog */}
      <Dialog 
        open={helpDialogOpen} 
        onClose={() => setHelpDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Help Center
            <IconButton onClick={() => setHelpDialogOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            Frequently Asked Questions
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              How do I add a new activity to my itinerary?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Navigate to the Itinerary tab and click the "+" button at the bottom right. Fill in the activity details and click "Save".
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              How do I track expenses?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Go to the Expenses tab and click the "+" button to add a new expense. You can categorize expenses and see a breakdown of your spending.
            </Typography>
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              How do I convert currency?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              The currency converter is available in the Expenses tab. Enter the amount and use the swap button to toggle between currencies.
            </Typography>
          </Box>
          
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              Need more help?
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              sx={{ mt: 1 }}
              onClick={() => {
                setHelpDialogOpen(false);
                setSnackbarMessage('Contact support functionality would be implemented here');
                setSnackbarSeverity('info');
                setSnackbarOpen(true);
              }}
            >
              Contact Support
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHelpDialogOpen(false)} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog 
        open={logoutDialogOpen} 
        onClose={() => setLogoutDialogOpen(false)}
      >
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to log out?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleLogout} color="error">Logout</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage; 