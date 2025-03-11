import React from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Paper,
  Grid
} from '@mui/material';
import { ItineraryData } from '../data/itineraryData';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import FlightLandIcon from '@mui/icons-material/FlightLand';
import HotelIcon from '@mui/icons-material/Hotel';
import PeopleIcon from '@mui/icons-material/People';
import InfoIcon from '@mui/icons-material/Info';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import LanguageIcon from '@mui/icons-material/Language';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import MosqueIcon from '@mui/icons-material/Mosque';

interface InfoPageProps {
  itineraryData: ItineraryData;
}

const InfoPage: React.FC<InfoPageProps> = ({ itineraryData }) => {
  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ p: 2, mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Information
        </Typography>
        <Typography variant="body1" color="text.secondary">
          All the details you need for your trip to Doha
        </Typography>
      </Box>
      
      {/* Trip Details */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Trip Details
        </Typography>
        
        <Card sx={{ borderRadius: 3, mb: 2 }}>
          <CardContent>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <HotelIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Accommodation" 
                  secondary={itineraryData.hotel}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              
              <Divider component="li" sx={{ my: 1.5 }} />
              
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <PeopleIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Group" 
                  secondary={itineraryData.group}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              
              <Divider component="li" sx={{ my: 1.5 }} />
              
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <FlightTakeoffIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Outbound Flight" 
                  secondary={itineraryData.flightDetails.outbound}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              
              <Divider component="li" sx={{ my: 1.5 }} />
              
              <ListItem disableGutters>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <FlightLandIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Return Flight" 
                  secondary={itineraryData.flightDetails.return}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
        
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            backgroundColor: 'rgba(51, 102, 255, 0.05)', 
            borderRadius: 3,
            display: 'flex',
            alignItems: 'flex-start'
          }}
        >
          <InfoIcon sx={{ color: 'primary.main', mr: 1.5, mt: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            {itineraryData.description}
          </Typography>
        </Paper>
      </Box>
      
      {/* Doha Information */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Doha Information
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LocalAtmIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Currency
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Qatari Riyal (QAR)
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LanguageIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Language
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Arabic, English widely spoken
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <WbSunnyIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Weather
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  May: 25-35°C, hot and sunny
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MosqueIcon sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Prayer Times
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Available at local mosques
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      
      {/* Important Notes */}
      <Box sx={{ px: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Important Notes
        </Typography>
        
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <List disablePadding>
              <ListItem disableGutters alignItems="flex-start">
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <InfoIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Dress Code" 
                  secondary="Modest clothing is recommended, especially when visiting religious sites."
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              
              <Divider component="li" sx={{ my: 1.5 }} />
              
              <ListItem disableGutters alignItems="flex-start">
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <InfoIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Transportation" 
                  secondary="Taxis and Uber are widely available. The Doha Metro is clean and efficient."
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
              
              <Divider component="li" sx={{ my: 1.5 }} />
              
              <ListItem disableGutters alignItems="flex-start">
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <RestaurantIcon sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <ListItemText 
                  primary="Dining" 
                  secondary="All restaurants in the itinerary are halal-friendly."
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItem>
            </List>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default InfoPage; 