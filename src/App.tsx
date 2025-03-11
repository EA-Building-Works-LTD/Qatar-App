import React, { useState, useEffect } from 'react';
import { CssBaseline, Box, Paper, BottomNavigation, BottomNavigationAction } from '@mui/material';
import { dohaItinerary, ItineraryData } from './data/itineraryData';
import HomeIcon from '@mui/icons-material/Home';

import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { ThemeProvider } from './contexts/ThemeContext';
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

function App() {
  const [currentPage, setCurrentPage] = useState<number>(() => {
    try {
      // Try to get saved current page from localStorage
      const savedPage = localStorage.getItem('dohaCurrentPage');
      return savedPage ? parseInt(savedPage, 10) : 0;
    } catch (error) {
      return 0;
    } 
  });
  
  const [itineraryData, setItineraryData] = useState<ItineraryData>(() => {
    try {
      // Try to get saved itinerary data from localStorage
      const savedItinerary = localStorage.getItem('dohaItineraryData');
      console.log("App: Retrieved from localStorage:", savedItinerary);
      
      if (savedItinerary) {
        const parsedData = JSON.parse(savedItinerary);
        console.log("App: Parsed itinerary data:", parsedData);
        return parsedData;
      } else {
        console.log("App: No saved data found, using default itinerary");
        return dohaItinerary;
      }
    } catch (error) {
      console.error("App: Error loading itinerary data from localStorage:", error);
      return dohaItinerary;
    }
  });

  // Save current page to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('dohaCurrentPage', currentPage.toString());
    } catch (error) {
      console.error("App: Error saving current page to localStorage:", error);
    }
  }, [currentPage]);

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

  // Function to update itinerary data
  const updateItineraryData = (newData: ItineraryData) => {
    console.log("App: Updating itinerary data:", newData);
    setItineraryData(newData);
    
    try {
      localStorage.setItem('dohaItineraryData', JSON.stringify(newData));
      console.log("App: Saved itinerary data to localStorage");
    } catch (error) {
      console.error("App: Error saving itinerary data to localStorage:", error);
    }
  };

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  const renderPage = () => {
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
    <ThemeProvider>
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
    </ThemeProvider>
  );
}

export default App;
