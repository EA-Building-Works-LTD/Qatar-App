import React, { useState } from 'react';
import { Box, Typography, Container } from '@mui/material';
import { ItineraryData } from '../data/itineraryData';
import DayCard from './DayCard';

interface ItineraryListProps {
  itineraryData: ItineraryData;
}

const ItineraryList: React.FC<ItineraryListProps> = ({ itineraryData }) => {
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(0);

  const handleDayClick = (index: number) => {
    setActiveDayIndex(activeDayIndex === index ? null : index);
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography 
        variant="h5" 
        sx={{ 
          mb: 3, 
          fontWeight: 600,
          position: 'relative',
          display: 'inline-block',
          '&:after': {
            content: '""',
            position: 'absolute',
            bottom: -8,
            left: 0,
            width: '40%',
            height: 4,
            background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
            borderRadius: 2,
          }
        }}
      >
        Daily Itinerary
      </Typography>
      
      {itineraryData.days.map((day, index) => (
        <DayCard 
          key={index}
          day={day}
          isActive={activeDayIndex === index}
          onClick={() => handleDayClick(index)}
        />
      ))}
    </Box>
  );
};

export default ItineraryList; 