import React from 'react';
import { AppBar, Toolbar, Typography, Box, useTheme, useMediaQuery } from '@mui/material';
import { ItineraryData } from '../data/itineraryData';

interface HeaderProps {
  itineraryData: ItineraryData;
}

const Header: React.FC<HeaderProps> = ({ itineraryData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <AppBar position="sticky" sx={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.9)', 
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      color: '#333',
    }}>
      <Toolbar>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
          <Typography variant="h5" component="div" sx={{ 
            fontWeight: 700, 
            mr: 2,
            background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {itineraryData.title}
          </Typography>
          <Typography variant="subtitle1" sx={{ opacity: 0.8, fontWeight: 500 }}>
            {itineraryData.dates}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 