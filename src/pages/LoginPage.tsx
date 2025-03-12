import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CircularProgress,
  Snackbar,
  Alert,
  Container,
  Paper,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useFirebase } from '../contexts/FirebaseContext';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const LoginPage: React.FC = () => {
  const { isAuthenticated, setIsAuthenticated } = useFirebase();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Check if user is already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);
  
  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Add scopes if needed
      googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');
      googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
      
      // Set custom parameters
      googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Sign in with Google
      await signInWithPopup(auth, googleProvider);
      
      // Set authenticated state
      setIsAuthenticated(true);
      
      // Navigate to home page
      // The user profile will be handled by the auth state change listener in FirebaseContext
      setTimeout(() => {
        navigate('/home');
      }, 500);
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // More specific error handling
      if (error.code === 'auth/configuration-not-found') {
        setError('Firebase authentication is not properly configured. Please check your Firebase console settings and ensure Google authentication is enabled.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing the sign-in process.');
      } else if (error.code === 'auth/popup-blocked') {
        setError('Sign-in popup was blocked by your browser. Please allow popups for this site.');
      } else if (error.code === 'auth/invalid-api-key') {
        setError('The Firebase API key is invalid. Please check your Firebase configuration.');
      } else if (error.code === 'auth/network-request-failed') {
        setError('A network error occurred. Please check your internet connection and try again.');
      } else {
        setError(error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Paper 
        elevation={0}
        sx={{ 
          width: '100%', 
          borderRadius: 4,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(51, 102, 255, 0.05) 0%, rgba(51, 102, 255, 0.1) 100%)',
          border: '1px solid rgba(51, 102, 255, 0.2)',
          p: 4
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Voyagr
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 500, color: 'text.secondary', mb: 2 }}>
            Your Premium Travel Planner
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Plan, organize, and share your travel experiences with friends and family
          </Typography>
        </Box>
        
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 4, textAlign: 'center' }}>
              Sign in to continue
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{ 
                py: 1.5,
                px: 4, 
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1.1rem',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                width: '100%',
                maxWidth: '320px'
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign in with Google'}
            </Button>
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </Typography>
          </CardContent>
        </Card>
        
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Voyagr helps you plan and manage your travel experiences with ease.
          </Typography>
        </Box>
      </Paper>
      
      {/* Error Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default LoginPage; 