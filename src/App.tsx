import React, { useState, useEffect, ErrorInfo, Component } from 'react';
import { CssBaseline, Box, Paper, BottomNavigation, BottomNavigationAction, CircularProgress, Typography } from '@mui/material';
import { dohaItinerary } from './data/itineraryData';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { ThemeProvider } from './contexts/ThemeContext';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Import page components
import HomePage from './pages/HomePage';
import ItineraryPage from './pages/ItineraryPage';
import InfoPage from './pages/InfoPage';
import ProfilePage from './pages/ProfilePage';
import ExpensesPage from './pages/ExpensesPage';
import LoginPage from './pages/LoginPage';

// Error Boundary Component
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null, errorInfo: ErrorInfo | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" paragraph>
            {this.state.error?.toString()}
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', textAlign: 'left', bgcolor: 'rgba(0,0,0,0.05)', p: 2, borderRadius: 1 }}>
            {this.state.errorInfo?.componentStack}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <button onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

// Protected Route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useFirebase();
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Main App wrapper with providers
function App() {
  return (
    <ErrorBoundary>
      <FirebaseProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </FirebaseProvider>
    </ErrorBoundary>
  );
}

// Protected routes component
function ProtectedRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={
        <ProtectedRoute>
          <AppContent initialPage={0} />
        </ProtectedRoute>
      } />
      <Route path="/itinerary" element={
        <ProtectedRoute>
          <AppContent initialPage={1} />
        </ProtectedRoute>
      } />
      <Route path="/expenses" element={
        <ProtectedRoute>
          <AppContent initialPage={2} />
        </ProtectedRoute>
      } />
      <Route path="/info" element={
        <ProtectedRoute>
          <AppContent initialPage={3} />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppContent initialPage={4} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

// App content that uses the Firebase context
function AppContent({ initialPage = 0 }: { initialPage?: number }) {
  const { itineraryData, updateItineraryData, loading, error } = useFirebase();
  const navigate = useNavigate();
  
  // Use local state for current page instead of Firebase context
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // State to track the first day with events
  const [firstDayWithEvents, setFirstDayWithEvents] = useState<number | null>(null);

  // Set initial page based on route
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage]);

  // Update route when page changes
  useEffect(() => {
    const routes = ['/home', '/itinerary', '/expenses', '/info', '/profile'];
    if (currentPage >= 0 && currentPage < routes.length) {
      navigate(routes[currentPage]);
    }
  }, [currentPage, navigate]);

  // Find the first day with events when itinerary data changes
  useEffect(() => {
    if (itineraryData && itineraryData.days) {
      try {
        // Sort days chronologically
        const sortedDays = [...itineraryData.days].sort((a, b) => {
          const dateA = new Date(a.date.split(' ').join(' '));
          const dateB = new Date(b.date.split(' ').join(' '));
          return dateA.getTime() - dateB.getTime();
        });

        // Find the first day with activities
        const firstDayIndex = sortedDays.findIndex(day => 
          day && day.activities && Array.isArray(day.activities) && day.activities.length > 0
        );
        
        if (firstDayIndex !== -1) {
          // Find this day's index in the original itineraryData.days array
          const originalIndex = itineraryData.days.findIndex(day => day.date === sortedDays[firstDayIndex].date);
          setFirstDayWithEvents(originalIndex);
        } else {
          setFirstDayWithEvents(null);
        }
      } catch (err) {
        console.error("Error processing itinerary data:", err);
      }
    }
  }, [itineraryData]);

  // Navigate to the first day with events when the Itinerary tab is selected
  useEffect(() => {
    // Only run this effect when the user selects the Itinerary tab (page 1)
    if (currentPage === 1 && firstDayWithEvents !== null) {
      console.log("Navigating to first day with events:", firstDayWithEvents);
    }
  }, [currentPage, firstDayWithEvents]);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const renderPage = () => {
    // Show loading indicator while data is being fetched
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      );
    }

    // Show error message if there was an error
    if (error) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'error.main' }}>
          Error: {error}. Please refresh the page.
        </Box>
      );
    }

    switch (currentPage) {
      case 0:
        return <HomePage 
          itineraryData={itineraryData} 
          onNavigateToDay={(dayIndex) => {
            setSelectedDayIndex(dayIndex);
            setCurrentPage(1);
          }}
          onTabChange={(tabIndex) => setCurrentPage(tabIndex)}
        />;
      case 1:
        return <ItineraryPage 
          itineraryData={itineraryData}
          updateItineraryData={updateItineraryData}
          firstDayWithEvents={firstDayWithEvents}
          selectedDayIndex={selectedDayIndex}
          onDayChange={setSelectedDayIndex}
        />;
      case 2:
        return <ExpensesPage />;
      case 3:
        return <InfoPage itineraryData={itineraryData} />;
      case 4:
        return <ProfilePage />;
      default:
        return <HomePage 
          itineraryData={itineraryData}
          onNavigateToDay={(dayIndex) => {
            setSelectedDayIndex(dayIndex);
            setCurrentPage(1);
          }}
          onTabChange={(tabIndex) => setCurrentPage(tabIndex)}
        />;
    }
  };

  return (
    <>
      <CssBaseline />
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        minHeight: '100vh',
        pb: { xs: '110px', sm: '80px' }, // Increased padding for the taller navbar
      }}>
        {renderPage()}
        
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            borderRadius: 0,
            boxShadow: '0px -2px 10px rgba(0, 0, 0, 0.05)',
            paddingBottom: { xs: '16px', sm: '0' }, // Increased padding at the bottom for mobile
          }} 
          elevation={3}
        >
          <BottomNavigation
            showLabels
            value={currentPage}
            onChange={(event, newValue) => {
              setCurrentPage(newValue);
            }}
            sx={{
              height: { xs: '80px', sm: '60px' }, // Increased height on mobile
              '& .MuiBottomNavigationAction-root': {
                paddingBottom: { xs: '12px', sm: '6px' }, // Increased padding to the action items
                minWidth: 'auto',
                '& .MuiSvgIcon-root': {
                  fontSize: '24px', // Slightly larger icons
                  marginBottom: '4px', // More space between icon and label
                },
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.75rem', // Ensure label text is readable
                  fontWeight: 500,
                }
              }
            }}
          >
            <BottomNavigationAction label="Home" icon={<HomeIcon />} />
            <BottomNavigationAction label="Itinerary" icon={<CalendarTodayIcon />} />
            <BottomNavigationAction label="Expenses" icon={<AccountBalanceWalletIcon />} />
            <BottomNavigationAction label="Information" icon={<InfoIcon />} />
            <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
          </BottomNavigation>
        </Paper>
      </Box>
    </>
  );
}

export default App;
