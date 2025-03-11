import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  TextField, 
  InputAdornment,
  Grid,
  IconButton,
  Chip,
  Checkbox,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { ItineraryData } from '../data/itineraryData';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DeleteIcon from '@mui/icons-material/Delete';

interface HomePageProps {
  itineraryData: ItineraryData;
  onNavigateToDay: (dayIndex: number) => void;
  onTabChange: (tabIndex: number) => void;
}

interface SearchResult {
  type: 'activity' | 'place' | 'expense' | 'destination';
  title: string;
  description?: string;
  date?: string;
  amount?: number;
  icon?: React.ReactNode;
  dayIndex?: number;
}

const HomePage: React.FC<HomePageProps> = ({ itineraryData, onNavigateToDay, onTabChange }) => {
  const userName = "Sir";
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  // Calculate the number of days and nights from the itinerary data
  const calculateDaysAndNights = () => {
    if (!itineraryData || !itineraryData.days || itineraryData.days.length === 0) {
      return { days: 0, nights: 0 };
    }
    
    // Count days that have at least one activity (same as ItineraryPage)
    const daysWithActivities = itineraryData.days.filter(day => day.activities.length > 0).length;
    
    // Number of nights is typically one less than the number of days
    const nights = daysWithActivities > 0 ? daysWithActivities - 1 : 0;
    
    return { days: daysWithActivities, nights };
  };
  
  // Countdown timer state
  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // Add state for notes feature with localStorage persistence
  const [notes, setNotes] = useState<Array<{ id: number; text: string; completed: boolean }>>(() => {
    // Try to get saved notes from localStorage
    const savedNotes = localStorage.getItem('dohaItineraryNotes');
    return savedNotes ? JSON.parse(savedNotes) : [
      { id: 1, text: 'Visit Museum of Islamic Art', completed: false },
      { id: 2, text: 'Try local street food at Souq Waqif', completed: false },
      { id: 3, text: 'Shop at Villaggio Mall', completed: false }
    ];
  });
  const [newNote, setNewNote] = useState<string>('');
  
  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('dohaItineraryNotes', JSON.stringify(notes));
  }, [notes]);
  
  // Calculate countdown to trip
  useEffect(() => {
    // Set the target date - May 14, 2025 at 14:35
    // Using explicit year, month (0-based), day, hours, minutes
    const targetDate = new Date(2025, 4, 14, 14, 35, 0, 0);
    
    // Calculate trip duration (May 14-21, 2025 = 7 nights)
    const tripDuration = 7;
    
    const updateCountdown = () => {
      // Get current date and time
      const now = new Date();
      
      // Find the distance between now and the target date
      const distance = targetDate.getTime() - now.getTime();
      
      if (distance < 0) {
        // If the target date is in the past
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0
        });
        return;
      }
      
      // Time calculations for days, hours, minutes and seconds
      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    };
    
    // Update countdown immediately
    updateCountdown();
    
    // Update every second
    const interval = setInterval(updateCountdown, 1000);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);
  
  // Handle adding a new note
  const handleAddNote = () => {
    if (newNote.trim() === '') return;
    
    const newId = notes.length > 0 ? Math.max(...notes.map(note => note.id)) + 1 : 1;
    const updatedNotes = [...notes, { id: newId, text: newNote, completed: false }];
    setNotes(updatedNotes);
    setNewNote('');
  };

  // Handle toggling a note's completed status
  const handleToggleNote = (id: number) => {
    const updatedNotes = notes.map(note => 
      note.id === id ? { ...note, completed: !note.completed } : note
    );
    setNotes(updatedNotes);
  };

  // Handle deleting a note
  const handleDeleteNote = (id: number) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
  };

  // Handle note input change
  const handleNoteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewNote(e.target.value);
  };
  
  // Count the number of spots (activities that are not meals or hotel-related)
  const countSpots = () => {
    let spotCount = 0;
    
    itineraryData.days.forEach(day => {
      day.activities.forEach(activity => {
        const lowerDesc = activity.description.toLowerCase();
        
        // Skip meals, hotel, and flight activities
        if (!lowerDesc.includes('breakfast') && 
            !lowerDesc.includes('lunch') && 
            !lowerDesc.includes('dinner') && 
            !lowerDesc.includes('hotel') && 
            !lowerDesc.includes('check-in') && 
            !lowerDesc.includes('check out') && 
            !lowerDesc.includes('flight') && 
            !lowerDesc.includes('transfer') &&
            !lowerDesc.includes('return to hotel') &&
            !lowerDesc.includes('prayer') &&
            !lowerDesc.includes('mosque') &&
            !lowerDesc.includes('wake up')) {
          spotCount++;
        }
      });
    });
    
    return spotCount;
  };
  
  // Search function
  const handleSearch = (query: string) => {
    setSearchValue(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();
    
    // Search through itinerary activities
    itineraryData.days.forEach((day, dayIndex) => {
      day.activities.forEach(activity => {
        if (activity.description.toLowerCase().includes(searchTerm)) {
          results.push({
            type: 'activity',
            title: activity.description,
            date: `Day ${dayIndex + 1} - ${activity.time}`,
            icon: <CalendarTodayIcon sx={{ color: 'primary.main' }} />,
            dayIndex: dayIndex
          });
        }
      });
    });
    
    // Search through places to visit (notes)
    notes.forEach(note => {
      if (note.text.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'place',
          title: note.text,
          description: note.completed ? 'Visited' : 'Not visited yet',
          icon: <PlaceIcon sx={{ color: note.completed ? 'success.main' : 'primary.main' }} />
        });
      }
    });
    
    // Add popular destinations
    const popularDestinations = ['Doha', 'Dubai'];
    popularDestinations.forEach(destination => {
      if (destination.toLowerCase().includes(searchTerm)) {
        results.push({
          type: 'destination',
          title: destination,
          description: 'Popular Destination',
          icon: <PlaceIcon sx={{ color: 'primary.main' }} />
        });
      }
    });
    
    setSearchResults(results);
    setShowSearchResults(true);
  };

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === 'activity' && typeof result.dayIndex === 'number') {
      onTabChange(1); // Switch to Itinerary tab
      onNavigateToDay(result.dayIndex);
    }
    setShowSearchResults(false);
    setSearchValue('');
  };

  const apiKey = process.env.REACT_APP_GOOGLE_API_KEY || '';

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
      }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700 }}>
            Have a Good Day,
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center' }}>
            {userName} <span style={{ marginLeft: 8 }}>👋</span>
          </Typography>
        </Box>
        <IconButton aria-label="notifications" sx={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}>
          <NotificationsIcon />
        </IconButton>
      </Box>
      
      {/* Search Bar */}
      <Box sx={{ px: 2, mb: 3, position: 'relative' }}>
        <TextField
          fullWidth
          placeholder="Search activities, places, or expenses..."
          variant="outlined"
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            sx: { 
              backgroundColor: 'rgba(0, 0, 0, 0.04)', 
              borderRadius: 4,
              '& fieldset': { border: 'none' },
            }
          }}
        />
        
        {/* Search Results Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <Card sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 16,
            right: 16,
            mt: 1,
            zIndex: 1000,
            maxHeight: 400,
            overflowY: 'auto',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <List>
              {searchResults.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem 
                    sx={{ 
                      py: 2,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.02)'
                      }
                    }}
                    onClick={() => handleSearchResultClick(result)}
                  >
                    <ListItemIcon>
                      {result.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {result.title}
                        </Typography>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          <Chip 
                            label={result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                            size="small"
                            sx={{ 
                              mr: 1,
                              bgcolor: 'primary.main',
                              color: 'white',
                              fontWeight: 500
                            }} 
                          />
                          {result.date && (
                            <Typography variant="body2" color="text.secondary">
                              {result.date}
                            </Typography>
                          )}
                          {result.description && (
                            <Typography variant="body2" color="text.secondary">
                              {result.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < searchResults.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Card>
        )}
        
        {showSearchResults && searchResults.length === 0 && searchValue.trim() !== '' && (
          <Card sx={{ 
            position: 'absolute', 
            top: '100%', 
            left: 16,
            right: 16,
            mt: 1,
            zIndex: 1000,
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
          }}>
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No results found for "{searchValue}"
              </Typography>
            </Box>
          </Card>
        )}
      </Box>
      
      {/* Countdown Timer */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Card sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(51, 102, 255, 0.05) 0%, rgba(51, 102, 255, 0.1) 100%)',
          border: '1px solid rgba(51, 102, 255, 0.2)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <AccessTimeIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Countdown to Doha
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Flight on May 14, 2025 at 14:35
            </Typography>
            
            {/* Progress bar - calculate percentage based on actual time remaining */}
            <Box sx={{ mb: 2, mt: 1 }}>
              <Box sx={{ 
                width: '100%', 
                height: 6, 
                backgroundColor: 'rgba(0, 0, 0, 0.08)', 
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                {/* Calculate progress - assuming 6 months (180 days) total trip planning time */}
                <Box 
                  sx={{ 
                    height: '100%', 
                    width: `${Math.min(100, Math.max(0, (180 - countdown.days) / 180 * 100))}%`,
                    backgroundColor: 'primary.main',
                    borderRadius: 3
                  }} 
                />
              </Box>
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 1.5, 
                  backgroundColor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {String(countdown.days).padStart(2, '0')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Days
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 1.5, 
                  backgroundColor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {String(countdown.hours).padStart(2, '0')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Hours
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 1.5, 
                  backgroundColor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {String(countdown.minutes).padStart(2, '0')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Minutes
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={3}>
                <Box sx={{ 
                  textAlign: 'center', 
                  p: 1.5, 
                  backgroundColor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {String(countdown.seconds).padStart(2, '0')}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Seconds
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
      
      {/* Your Itinerary Section */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Your Itinerary
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
            See all
          </Typography>
        </Box>
        
        <Card sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          backgroundImage: 'url(https://images.unsplash.com/photo-1534008897995-27a23e859048?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          height: 200,
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            zIndex: 1
          }
        }}>
          <CardContent sx={{ 
            position: 'relative', 
            zIndex: 2, 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}>
            <Card sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              backdropFilter: 'blur(10px)',
              p: 2,
              borderRadius: 2
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1, pr: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#1A1D1F' }}>
                    {itineraryData.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {itineraryData.dates}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, mr: 1, color: '#1A1D1F' }}>
                      Total
                    </Typography>
                    <Chip 
                      label={`${countSpots()} Spots`} 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(51, 102, 255, 0.1)', 
                        color: 'primary.main',
                        fontWeight: 500,
                        fontSize: '0.75rem',
                        borderRadius: 1
                      }} 
                    />
                  </Box>
                </Box>
                
                <Box 
                  sx={{ 
                    width: 100, 
                    height: 100, 
                    borderRadius: 2,
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                    position: 'relative',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)'
                  }}
                >
                  {/* Replace YOUR_API_KEY with your actual Google Maps API key */}
                  <img 
                    src={`https://maps.googleapis.com/maps/api/staticmap?center=Doha,Qatar&zoom=11&size=200x200&scale=2&maptype=roadmap&path=color:0x3366FF|weight:3|25.2854,51.5310|25.3548,51.4244|25.2948,51.5310|25.3090,51.5132&markers=color:red|25.2854,51.5310&key=${apiKey}`}
                    alt="Doha Route Map"
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      borderRadius: '8px',
                      marginTop: '16px'
                    }}
                  />
                </Box>
              </Box>
            </Card>
          </CardContent>
        </Card>
      </Box>
      
      {/* Places to Visit */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Card sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          background: 'linear-gradient(135deg, rgba(51, 102, 255, 0.05) 0%, rgba(51, 102, 255, 0.1) 100%)',
          border: '1px solid rgba(51, 102, 255, 0.2)'
        }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PlaceIcon sx={{ color: 'primary.main', mr: 1 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Places to Visit
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <TextField
                label="Add a place to visit"
                variant="outlined"
                size="small"
                value={newNote}
                onChange={handleNoteInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNote();
                  }
                }}
                sx={{ flex: 1 }}
              />
              <Button 
                variant="contained" 
                onClick={handleAddNote}
                sx={{ ml: 1 }}
              >
                Add
              </Button>
            </Box>
            
            <Box 
              sx={{ 
                height: '180px', 
                overflowY: 'auto',
                border: notes.length > 0 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none',
                borderRadius: 1
              }}
            >
              {notes.length === 0 ? (
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: 'rgba(0, 0, 0, 0.02)', 
                  borderRadius: 1,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '100%'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                    No places added yet. Add some places you want to visit!
                  </Typography>
                </Box>
              ) : (
                notes.map(note => (
                  <Box 
                    key={note.id}
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      p: 1.5,
                      borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                      '&:last-child': {
                        borderBottom: 'none'
                      },
                      backgroundColor: note.completed ? 'rgba(0, 0, 0, 0.02)' : 'transparent',
                      transition: 'background-color 0.2s ease'
                    }}
                  >
                    <Checkbox 
                      checked={note.completed}
                      onChange={() => handleToggleNote(note.id)}
                      sx={{ 
                        color: 'primary.main',
                        '&.Mui-checked': {
                          color: 'primary.main',
                        },
                      }}
                    />
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        flex: 1,
                        textDecoration: note.completed ? 'line-through' : 'none',
                        color: note.completed ? 'text.secondary' : 'text.primary'
                      }}
                    >
                      {note.text}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleDeleteNote(note.id)}
                      sx={{ color: 'text.secondary' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
      
      {/* Popular Destinations */}
      <Box sx={{ px: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Popular Destination
          </Typography>
          <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
            See all
          </Typography>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              height: 120,
              backgroundImage: 'url(https://images.unsplash.com/photo-1518684079-3c830dcef090?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              {/* Pill-style label in top left */}
              <Box sx={{ 
                position: 'absolute', 
                top: 10, 
                left: 10, 
                px: 1.5,
                py: 0.5,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Doha
                </Typography>
              </Box>
              
              {/* Gradient overlay for better contrast */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.4) 100%)'
              }} />
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{ 
              borderRadius: 3, 
              overflow: 'hidden',
              height: 120,
              backgroundImage: 'url(https://images.unsplash.com/photo-1512453979798-5ea266f8880c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1080&q=80)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}>
              {/* Pill-style label in top left */}
              <Box sx={{ 
                position: 'absolute', 
                top: 10, 
                left: 10, 
                px: 1.5,
                py: 0.5,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                borderRadius: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  Dubai
                </Typography>
              </Box>
              
              {/* Gradient overlay for better contrast */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 70%, rgba(0,0,0,0.4) 100%)'
              }} />
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default HomePage; 