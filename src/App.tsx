import React, { useState, useEffect } from 'react';
import { CssBaseline, Box, Paper, BottomNavigation, BottomNavigationAction, CircularProgress } from '@mui/material';
import { dohaItinerary } from './data/itineraryData';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { ThemeProvider } from './contexts/ThemeContext';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// Import page components
// @ts-ignore
import HomePage from './pages/HomePage';
// @ts-ignore
import ItineraryPage from './pages/ItineraryPage';
// @ts-ignore
import InfoPage from './pages/InfoPage';
// @ts-ignore
import ProfilePage from './pages/ProfilePage';
// @ts-ignore
import ExpensesPage from './pages/ExpensesPage';

// Main App wrapper with providers
function App() {
  return (
    <FirebaseProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </FirebaseProvider>
  );
}

// App content that uses the Firebase context
function AppContent() {
  const { itineraryData, updateItineraryData, loading, error } = useFirebase();
  
  // Manage current page state locally instead of in Firebase
  const [currentPage, setCurrentPage] = useState<number>(0);
  
  // State to track the first day with events
  const [firstDayWithEvents, setFirstDayWithEvents] = useState<number | null>(null);

  // Find the first day with events when itinerary data changes
  useEffect(() => {
    if (itineraryData && itineraryData.days) {
      // Sort days chronologically
      const sortedDays = [...itineraryData.days].sort((a, b) => {
        const dateA = new Date(a.date.split(' ').join(' '));
        const dateB = new Date(b.date.split(' ').join(' '));
        return dateA.getTime() - dateB.getTime();
      });

      // Find the first day with activities
      const firstDayIndex = sortedDays.findIndex(day => day.activities && day.activities.length > 0);
      
      if (firstDayIndex !== -1) {
        // Find this day's index in the original itineraryData.days array
        const originalIndex = itineraryData.days.findIndex(day => day.date === sortedDays[firstDayIndex].date);
        setFirstDayWithEvents(originalIndex);
      } else {
        setFirstDayWithEvents(null);
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
