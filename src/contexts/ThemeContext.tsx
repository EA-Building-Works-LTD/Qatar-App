import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { useFirebase } from './FirebaseContext';

// Create the context
interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  darkMode: false,
  toggleDarkMode: () => {},
});

// Create the theme provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { preferences, updatePreferences, loading } = useFirebase();
  
  // Get dark mode value from Firebase preferences or default to false
  const [darkMode, setDarkMode] = useState(false);
  
  // Update darkMode state when preferences change
  useEffect(() => {
    if (preferences && !loading) {
      setDarkMode(preferences.darkMode);
    }
  }, [preferences, loading]);

  // Create theme based on dark mode
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#3366FF',
      },
      secondary: {
        main: '#FF6B00',
      },
      background: {
        default: darkMode ? '#121212' : '#F5F7FA',
        paper: darkMode ? '#1E1E1E' : '#FFFFFF',
      },
      text: {
        primary: darkMode ? '#FFFFFF' : '#1A1D1F',
        secondary: darkMode ? '#B0B0B0' : '#6F767E',
      },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '28px',
        fontWeight: 700,
      },
      h2: {
        fontSize: '24px',
        fontWeight: 700,
      },
      h3: {
        fontSize: '20px',
        fontWeight: 600,
      },
      h4: {
        fontSize: '18px',
        fontWeight: 600,
      },
      h5: {
        fontSize: '16px',
        fontWeight: 600,
      },
      h6: {
        fontSize: '14px',
        fontWeight: 600,
      },
      subtitle1: {
        fontSize: '16px',
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: '14px',
        fontWeight: 500,
      },
      body1: {
        fontSize: '16px',
      },
      body2: {
        fontSize: '14px',
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          body {
            background-color: ${darkMode ? '#121212' : '#F5F7FA'};
            min-height: 100vh;
          }
        `,
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            boxShadow: darkMode 
              ? '0px 2px 8px rgba(0, 0, 0, 0.2)'
              : '0px 2px 8px rgba(0, 0, 0, 0.05)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            overflow: 'hidden',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            fontWeight: 600,
          },
          contained: {
            boxShadow: 'none',
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: 64,
            backgroundColor: darkMode ? '#1E1E1E' : '#FFFFFF',
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: darkMode ? '#B0B0B0' : '#6F767E',
            '&.Mui-selected': {
              color: '#3366FF',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          h6: {
            fontSize: '16px',
            fontWeight: 600,
          },
        },
      },
    },
  });

  // Toggle dark mode function
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    // Update preferences in Firebase if available
    if (preferences && !loading) {
      updatePreferences({
        ...preferences,
        darkMode: newDarkMode
      });
    }
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => useContext(ThemeContext); 