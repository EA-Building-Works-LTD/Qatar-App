import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Day } from '../data/itineraryData';

interface DayCardProps {
  day: Day;
  isActive: boolean;
  onClick: () => void;
}

const DayCard: React.FC<DayCardProps> = ({ day, isActive, onClick }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Card 
      elevation={isActive ? 3 : 1} 
      sx={{ 
        mb: 3, 
        borderRadius: 4,
        transition: 'all 0.3s ease',
        transform: isActive ? 'scale(1.01)' : 'scale(1)',
        border: isActive ? '1px solid rgba(106, 17, 203, 0.3)' : '1px solid rgba(0, 0, 0, 0.05)',
        overflow: 'visible',
        position: 'relative',
        '&:hover': {
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
        }
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexDirection: isMobile ? 'column' : 'row' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Chip 
                label={`Day ${day.dayNumber}`} 
                size="small" 
                sx={{ 
                  mr: 2, 
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #6a11cb 0%, #2575fc 100%)',
                  color: 'white',
                }}
              />
              <Typography variant="subtitle1" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                {day.dayName}, {day.date}
              </Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              {day.title}
            </Typography>
          </Box>
          
          <IconButton 
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            sx={{ 
              backgroundColor: isActive ? 'rgba(106, 17, 203, 0.1)' : 'transparent',
              mt: isMobile ? 1 : 0,
              transition: 'all 0.3s ease',
            }}
          >
            {isActive ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Collapse in={isActive} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          
          <List sx={{ width: '100%', p: 0 }}>
            {day.activities.map((activity, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="flex-start" sx={{ px: 0, py: 1.5 }}>
                  <Box sx={{ 
                    minWidth: '100px', 
                    mr: 2, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 600, 
                        color: '#6a11cb',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {activity.time}
                    </Typography>
                  </Box>
                  
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {activity.description}
                      </Typography>
                    }
                    secondary={
                      activity.location && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mt: 0.5, 
                            color: 'text.secondary',
                            fontStyle: 'italic'
                          }}
                        >
                          {activity.location}
                        </Typography>
                      )
                    }
                  />
                </ListItem>
                {index < day.activities.length - 1 && (
                  <Divider component="li" sx={{ opacity: 0.5 }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default DayCard; 