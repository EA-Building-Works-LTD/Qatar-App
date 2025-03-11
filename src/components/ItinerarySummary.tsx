import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Divider, Paper } from '@mui/material';
import { ItineraryData } from '../data/itineraryData';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import HotelIcon from '@mui/icons-material/Hotel';
import PeopleIcon from '@mui/icons-material/People';
import InfoIcon from '@mui/icons-material/Info';

interface ItinerarySummaryProps {
  itineraryData: ItineraryData;
}

const ItinerarySummary: React.FC<ItinerarySummaryProps> = ({ itineraryData }) => {
  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 4,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,240,255,0.9) 100%)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Trip Details
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ height: '100%', backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <HotelIcon sx={{ mr: 1, color: '#6a11cb' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Accommodation
                </Typography>
              </Box>
              <Typography variant="body1">{itineraryData.hotel}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ height: '100%', backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PeopleIcon sx={{ mr: 1, color: '#6a11cb' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Group
                </Typography>
              </Box>
              <Typography variant="body1">{itineraryData.group}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ height: '100%', backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FlightTakeoffIcon sx={{ mr: 1, color: '#6a11cb' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Outbound Flight
                </Typography>
              </Box>
              <Typography variant="body1">{itineraryData.flightDetails.outbound}</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ height: '100%', backgroundColor: 'transparent', border: '1px solid rgba(0,0,0,0.05)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <FlightLandIcon sx={{ mr: 1, color: '#6a11cb' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Return Flight
                </Typography>
              </Box>
              <Typography variant="body1">{itineraryData.flightDetails.return}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(106, 17, 203, 0.05)', borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
          <InfoIcon sx={{ mr: 1, color: '#6a11cb', mt: 0.5 }} />
          <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
            {itineraryData.description}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default ItinerarySummary; 