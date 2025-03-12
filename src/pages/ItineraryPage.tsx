import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Card, 
  CardContent, 
  Chip,
  Grid,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Menu
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ItineraryData, Activity } from '../data/itineraryData';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import FlightIcon from '@mui/icons-material/Flight';
import HotelIcon from '@mui/icons-material/Hotel';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import MosqueIcon from '@mui/icons-material/Mosque';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface FormActivityState {
  date: string;
  time: string;
  description: string;
  location: string;
}

interface ItineraryPageProps {
  itineraryData: ItineraryData;
  updateItineraryData: (data: ItineraryData) => void;
  firstDayWithEvents: number | null;
  selectedDayIndex: number | null;
  onDayChange: (dayIndex: number) => void;
}

const ItineraryPage: React.FC<ItineraryPageProps> = ({ 
  itineraryData,
  updateItineraryData,
  firstDayWithEvents,
  selectedDayIndex,
  onDayChange
}) => {
  // Use selectedDayIndex from props if available, otherwise use local state
  const [currentDayIndex, setCurrentDayIndex] = useState(selectedDayIndex ?? 0);

  // Update currentDayIndex when selectedDayIndex changes
  useEffect(() => {
    if (selectedDayIndex !== null && selectedDayIndex !== currentDayIndex) {
      setCurrentDayIndex(selectedDayIndex);
    }
  }, [selectedDayIndex]);

  // Update parent only when currentDayIndex changes due to user interaction
  const handleDayChange = (newDayIndex: number) => {
    setCurrentDayIndex(newDayIndex);
    onDayChange(newDayIndex);
  };

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date(2025, 4, 11)); // May 11, 2025 (Sunday)
  
  // State for managing activities
  const [localItineraryData, setLocalItineraryData] = useState<ItineraryData>(itineraryData);
  // Safely access the selected day, handling the case where it might be undefined
  const selectedDay = localItineraryData && 
                     localItineraryData.days && 
                     Array.isArray(localItineraryData.days) && 
                     currentDayIndex >= 0 && 
                     currentDayIndex < localItineraryData.days.length ? 
                     localItineraryData.days[currentDayIndex] : 
                     undefined;
  
  // Update local state when prop changes
  useEffect(() => {
    setLocalItineraryData(itineraryData);
  }, [itineraryData]);
  
  // Update parent state when local state changes
  useEffect(() => {
    // Only update if the local data has changed from the prop
    if (JSON.stringify(localItineraryData) !== JSON.stringify(itineraryData)) {
      updateItineraryData(localItineraryData);
    }
  }, [localItineraryData, itineraryData, updateItineraryData]);
  
  // State for dialogs
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [currentActivityIndex, setCurrentActivityIndex] = useState<number>(-1);
  
  // State for activity menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuActivityIndex, setMenuActivityIndex] = useState<number>(-1);
  
  // Form state
  const [formActivity, setFormActivity] = useState<FormActivityState>({
    date: '',
    time: '',
    description: '',
    location: ''
  });
  
  // Add state for activity filtering
  const [activityFilter, setActivityFilter] = useState<'all' | 'spots' | 'meals'>('all');
  
  // Initialize the week to include the first day of the itinerary
  useEffect(() => {
    if (localItineraryData.days.length > 0) {
      try {
        // Get the first day of the itinerary
        const firstDay = new Date(localItineraryData.days[0].date);
        
        // Set the current week to start with the Sunday before or on the first day
        const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const daysToSubtract = dayOfWeek; // Subtract days to get to Sunday
        
        const startOfWeek = new Date(firstDay);
        startOfWeek.setDate(firstDay.getDate() - daysToSubtract);
        
        setCurrentWeekStart(startOfWeek);
      } catch (error) {
        console.error("Error initializing week:", error);
      }
    }
  }, [localItineraryData.days]);
  
  // Set the selected day to the first day with events when the component mounts or firstDayWithEvents changes
  useEffect(() => {
    if (firstDayWithEvents !== null && currentDayIndex === 0) {
      handleDayChange(firstDayWithEvents);
      
      // Also update the current week to include this day
      if (itineraryData.days[firstDayWithEvents]) {
        try {
          const dayDate = new Date(itineraryData.days[firstDayWithEvents].date);
          const dayOfWeek = dayDate.getDay();
          const daysToSubtract = dayOfWeek;
          
          const startOfWeek = new Date(dayDate);
          startOfWeek.setDate(dayDate.getDate() - daysToSubtract);
          
          setCurrentWeekStart(startOfWeek);
        } catch (error) {
          console.error("Error setting week for first day with events:", error);
        }
      }
    }
  }, [firstDayWithEvents, itineraryData.days]);
  
  // Function to get icon based on activity description
  const getActivityIcon = (description: string) => {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('flight') || lowerDesc.includes('airport')) {
      return <FlightIcon sx={{ color: '#3366FF' }} />;
    } else if (lowerDesc.includes('hotel') || lowerDesc.includes('check-in') || lowerDesc.includes('check out') || lowerDesc.includes('return to hotel')) {
      return <HotelIcon sx={{ color: '#3366FF' }} />;
    } else if (lowerDesc.includes('breakfast') || lowerDesc.includes('lunch') || lowerDesc.includes('dinner') || lowerDesc.includes('café') || lowerDesc.includes('cafe') || lowerDesc.includes('restaurant') || lowerDesc.includes('food') || lowerDesc.includes('meal')) {
      return <RestaurantIcon sx={{ color: '#4CAF50' }} />;
    } else if (lowerDesc.includes('walk') || lowerDesc.includes('stroll') || lowerDesc.includes('explore')) {
      return <DirectionsWalkIcon sx={{ color: '#FF6B00' }} />;
    } else if (lowerDesc.includes('prayer') || lowerDesc.includes('mosque')) {
      return <MosqueIcon sx={{ color: '#FF6B00' }} />;
    } else if (lowerDesc.includes('shopping') || lowerDesc.includes('mall') || lowerDesc.includes('souq')) {
      return <ShoppingBagIcon sx={{ color: '#3366FF' }} />;
    } else {
      return <LocalActivityIcon sx={{ color: '#3366FF' }} />;
    }
  };

  const handlePrevWeek = () => {
    setCurrentWeekStart(prev => {
      const newWeekStart = new Date(prev);
      newWeekStart.setDate(newWeekStart.getDate() - 7);
      return newWeekStart;
    });
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => {
      const newWeekStart = new Date(prev);
      newWeekStart.setDate(newWeekStart.getDate() + 7);
      return newWeekStart;
    });
  };

  // Get day of month from the date
  const getDayOfMonth = (dateStr: string) => {
    try {
      const parts = dateStr.split(' ');
      return parts[0];
    } catch (error) {
      console.error("Error parsing date:", dateStr);
      return "1"; // Default to 1 if there's an error
    }
  };

  // Generate calendar days for the current week
  const generateWeekDays = () => {
    const days = [];
    const startDate = new Date(currentWeekStart);
    
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push({
        date: currentDate,
        day: currentDate.getDate()
      });
    }
    
    return days;
  };

  // Check if a day has events in the itinerary
  const dayHasEvents = (day: number, month: number) => {
    return localItineraryData.days.some(d => {
      try {
        const dateParts = d.date.split(' ');
        const dayNum = parseInt(dateParts[0]);
        const monthName = dateParts[1];
        const monthNum = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(monthName);
        
        // Check if the day matches and has activities
        return dayNum === day && monthNum === month && d.activities.length > 0;
      } catch (error) {
        return false;
      }
    });
  };

  // Get the index of the day in the itinerary
  const getDayIndexInItinerary = (day: number, month: number) => {
    const date = new Date(currentWeekStart);
    date.setDate(day);
    date.setMonth(month);
    
    // Format the date to match the format in the itinerary data
    const formattedDate = `${day} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month]} ${date.getFullYear()}`;
    
    // Find the day index in the itinerary data
    const dayIndex = localItineraryData.days.findIndex(d => d.date === formattedDate);
    
    // If the day doesn't exist in the itinerary, create a temporary day for it
    if (dayIndex === -1) {
      // Get the day name
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
      
      // Create a temporary day object
      const tempDay = {
        date: formattedDate,
        dayNumber: localItineraryData.days.length + 1,
        dayName: dayName,
        title: `${dayName}`,
        activities: []
      };
      
      // Add the temporary day to the local itinerary data
      setLocalItineraryData(prev => {
        const updatedDays = [...prev.days, tempDay];
        
        // Sort days chronologically
        updatedDays.sort((a, b) => {
          const dateA = new Date(a.date.split(' ').join(' '));
          const dateB = new Date(b.date.split(' ').join(' '));
          return dateA.getTime() - dateB.getTime();
        });
        
        return {
          ...prev,
          days: updatedDays
        };
      });
      
      // Return the index of the newly added day
      return localItineraryData.days.length;
    }
    
    return dayIndex;
  };

  // Sort activities chronologically
  const sortActivitiesChronologically = () => {
    // Check if selectedDay and activities exist
    if (!selectedDay || !selectedDay.activities || !Array.isArray(selectedDay.activities)) {
      return [];
    }
    
    const sortedActivities = [...selectedDay.activities];
    
    return sortedActivities.sort((a, b) => {
      try {
        // Extract hours for comparison
        const getTimeValue = (timeStr: string) => {
          // Handle ranges like "11:00 AM - 15:00 PM"
          const time = timeStr.split('-')[0].trim();
          const [hourMinute, ampm] = time.split(' ');
          let [hour, minute] = hourMinute.split(':').map(Number);
          
          // Convert to 24-hour format for proper sorting
          if (ampm && ampm.toUpperCase() === 'PM' && hour < 12) {
            hour += 12;
          } else if (ampm && ampm.toUpperCase() === 'AM' && hour === 12) {
            hour = 0;
          }
          
          // Special case for activities after midnight (like 00:30 AM)
          if (hour < 4 && ampm && ampm.toUpperCase() === 'AM') {
            hour += 24;  // Add 24 to put it after the PM times
          }
          
          return hour * 60 + (minute || 0);
        };
        
        const timeA = getTimeValue(a.time);
        const timeB = getTimeValue(b.time);
        
        return timeA - timeB;
      } catch (error) {
        console.error("Error sorting activities:", error);
        return 0;
      }
    });
  };
  
  // Format the week display
  const formatWeekDisplay = () => {
    try {
      const startMonth = currentWeekStart.toLocaleString('default', { month: 'long' });
      const endDate = new Date(currentWeekStart);
      endDate.setDate(currentWeekStart.getDate() + 6);
      const endMonth = endDate.toLocaleString('default', { month: 'long' });
      
      if (startMonth === endMonth) {
        return `${startMonth} ${currentWeekStart.getFullYear()}`;
      } else {
        return `${startMonth} - ${endMonth} ${currentWeekStart.getFullYear()}`;
      }
    } catch (error) {
      console.error("Error formatting week display:", error);
      return "May 2025"; // Default if there's an error
    }
  };
  
  // Handle opening the activity menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, index: number) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuActivityIndex(index);
  };
  
  // Handle closing the activity menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuActivityIndex(-1);
  };
  
  // Handle opening the edit dialog
  const handleEditClick = () => {
    if (menuActivityIndex !== -1) {
      // Safely access the activity
      if (!localItineraryData || 
          !localItineraryData.days || 
          !Array.isArray(localItineraryData.days) ||
          currentDayIndex < 0 ||
          currentDayIndex >= localItineraryData.days.length ||
          !localItineraryData.days[currentDayIndex] ||
          !localItineraryData.days[currentDayIndex].activities ||
          !Array.isArray(localItineraryData.days[currentDayIndex].activities) ||
          menuActivityIndex >= localItineraryData.days[currentDayIndex].activities.length) {
        console.error("Cannot access activity: Invalid data structure or indices");
        handleMenuClose();
        return;
      }
      
      const activity = localItineraryData.days[currentDayIndex].activities[menuActivityIndex];
      setCurrentActivityIndex(menuActivityIndex);
      
      // Convert date string to YYYY-MM-DD format for input
      const dateParts = activity.date.split(' ');
      const day = dateParts[0].padStart(2, '0');
      const month = getMonthNumber(dateParts[1]);
      const year = dateParts[2];
      const formattedDate = `${year}-${month}-${day}`;
      
      // Convert time string to HH:MM format for input
      const timeParts = activity.time.match(/(\d+):(\d+)\s*([AP]M)/i);
      let hours = parseInt(timeParts?.[1] || '0');
      const minutes = timeParts?.[2] || '00';
      const ampm = timeParts?.[3]?.toUpperCase() || 'AM';
      
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes}`;
      
      setFormActivity({
        date: formattedDate,
        time: formattedTime,
        description: activity.description,
        location: activity.location || ''
      });
      
      setEditDialogOpen(true);
      setMenuAnchorEl(null);
    }
  };
  
  // Handle opening the delete dialog
  const handleDeleteClick = () => {
    if (menuActivityIndex !== -1) {
      setCurrentActivityIndex(menuActivityIndex);
      setDeleteDialogOpen(true);
      handleMenuClose();
    }
  };
  
  // Handle saving edited activity
  const handleSaveEdit = () => {
    if (currentActivityIndex !== -1 && formActivity.date && formActivity.time) {
      // Safely check if we can access the activity
      if (!localItineraryData || 
          !localItineraryData.days || 
          !Array.isArray(localItineraryData.days) ||
          currentDayIndex < 0 ||
          currentDayIndex >= localItineraryData.days.length ||
          !localItineraryData.days[currentDayIndex] ||
          !localItineraryData.days[currentDayIndex].activities ||
          !Array.isArray(localItineraryData.days[currentDayIndex].activities) ||
          currentActivityIndex >= localItineraryData.days[currentDayIndex].activities.length) {
        console.error("Cannot save edit: Invalid data structure or indices");
        setEditDialogOpen(false);
        setCurrentActivity(null);
        setCurrentActivityIndex(-1);
        return;
      }
      
      // Create a deep copy of the current itinerary data
      const updatedItineraryData = JSON.parse(JSON.stringify(localItineraryData)) as ItineraryData;
      
      // Update the activity
      updatedItineraryData.days[currentDayIndex].activities[currentActivityIndex] = {
        date: formatDateForDisplay(formActivity.date),
        time: formatTimeForDisplay(formActivity.time),
        description: formActivity.description,
        location: formActivity.location
      };
      
      // Update both local state and parent state
      setLocalItineraryData(updatedItineraryData);
      updateItineraryData(updatedItineraryData);
      
      console.log("Updated activity at index:", currentActivityIndex);
      console.log("Final updated itinerary:", updatedItineraryData);
      
      setEditDialogOpen(false);
      setCurrentActivity(null);
      setCurrentActivityIndex(-1);
    }
  };
  
  // Handle adding new activity
  const handleAddActivity = () => {
    setFormActivity({
      date: '',
      time: '',
      description: '',
      location: ''
    });
    setAddDialogOpen(true);
  };
  
  // Helper function to format date from input to display format
  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    
    try {
      const date = new Date(dateStr);
      console.log("Formatting date:", dateStr, "to Date object:", date);
      
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      const formattedDate = `${day} ${month} ${year}`;
      console.log("Formatted date result:", formattedDate);
      return formattedDate;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateStr;
    }
  };

  // Helper function to format time from input to display format
  const formatTimeForDisplay = (timeStr: string): string => {
    if (!timeStr) return '';
    
    try {
      console.log("Formatting time:", timeStr);
      
      const [hours, minutes] = timeStr.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      
      const formattedTime = `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
      console.log("Formatted time result:", formattedTime);
      return formattedTime;
    } catch (error) {
      console.error("Error formatting time:", error);
      return timeStr;
    }
  };

  // Handle saving new activity
  const handleSaveNewActivity = () => {
    if (formActivity.date && formActivity.time) {
      const formattedDate = formatDateForDisplay(formActivity.date);
      const formattedTime = formatTimeForDisplay(formActivity.time);
      
      console.log("Adding new activity with date:", formattedDate);
      console.log("Adding new activity with time:", formattedTime);
      
      const newActivity: Activity = {
        date: formattedDate,
        time: formattedTime,
        description: formActivity.description,
        location: formActivity.location
      };
      
      console.log("New activity object:", newActivity);
      
      // Create a deep copy of the current itinerary data
      const updatedItineraryData = JSON.parse(JSON.stringify(localItineraryData)) as ItineraryData;
      
      // Find the correct day index for the new activity
      const dayIndex = updatedItineraryData.days.findIndex(day => {
        console.log(`Comparing day.date: "${day.date}" with formattedDate: "${formattedDate}"`);
        return day.date === formattedDate;
      });
      
      console.log("Found day index:", dayIndex);
      
      if (dayIndex !== -1) {
        // Add to existing day
        updatedItineraryData.days[dayIndex].activities.push(newActivity);
        
        // Sort activities by time
        updatedItineraryData.days[dayIndex].activities.sort((a, b) => {
          // Convert times to 24-hour format for comparison
          const getTimeValue = (timeStr: string) => {
            const match = timeStr.match(/(\d+):(\d+)\s*([AP]M)/i);
            if (!match) return 0;
            
            let hours = parseInt(match[1]);
            const minutes = parseInt(match[2]);
            const ampm = match[3].toUpperCase();
            
            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;
            
            return hours * 60 + minutes;
          };
          
          return getTimeValue(a.time) - getTimeValue(b.time);
        });
        
        // Update selected day if different from current
        if (dayIndex !== currentDayIndex) {
          handleDayChange(dayIndex);
        }
      } else {
        console.log("Day not found, creating new day");
        
        // Create a new day if it doesn't exist
        const date = new Date(formActivity.date);
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        
        const newDay = {
          date: formattedDate,
          dayNumber: updatedItineraryData.days.length + 1,
          dayName: dayName,
          title: `Day ${updatedItineraryData.days.length + 1}`,
          activities: [newActivity]
        };
        
        console.log("New day object:", newDay);
        
        // Add the new day
        updatedItineraryData.days.push(newDay);
        
        // Sort days chronologically
        updatedItineraryData.days.sort((a, b) => {
          const dateA = new Date(a.date.split(' ').join(' '));
          const dateB = new Date(b.date.split(' ').join(' '));
          return dateA.getTime() - dateB.getTime();
        });
        
        // Find the index of the newly added day
        const newDayIndex = updatedItineraryData.days.findIndex(day => day.date === formattedDate);
        handleDayChange(newDayIndex);
      }
      
      // Update both local state and parent state
      setLocalItineraryData(updatedItineraryData);
      updateItineraryData(updatedItineraryData);
      
      console.log("Final updated itinerary:", updatedItineraryData);
      
      setAddDialogOpen(false);
    }
  };
  
  // Handle deleting activity
  const handleDeleteActivity = () => {
    if (currentActivityIndex !== -1) {
      // Safely check if we can access the activity
      if (!localItineraryData || 
          !localItineraryData.days || 
          !Array.isArray(localItineraryData.days) ||
          currentDayIndex < 0 ||
          currentDayIndex >= localItineraryData.days.length ||
          !localItineraryData.days[currentDayIndex] ||
          !localItineraryData.days[currentDayIndex].activities ||
          !Array.isArray(localItineraryData.days[currentDayIndex].activities) ||
          currentActivityIndex >= localItineraryData.days[currentDayIndex].activities.length) {
        console.error("Cannot delete activity: Invalid data structure or indices");
        setDeleteDialogOpen(false);
        setCurrentActivityIndex(-1);
        return;
      }
      
      // Create a deep copy of the current itinerary data
      const updatedItineraryData = JSON.parse(JSON.stringify(localItineraryData)) as ItineraryData;
      
      // Remove the activity
      updatedItineraryData.days[currentDayIndex].activities = 
        updatedItineraryData.days[currentDayIndex].activities.filter(
          (_, index) => index !== currentActivityIndex
        );
      
      // Update both local state and parent state
      setLocalItineraryData(updatedItineraryData);
      updateItineraryData(updatedItineraryData);
      
      console.log("Deleted activity at index:", currentActivityIndex);
      console.log("Final updated itinerary:", updatedItineraryData);
      
      setDeleteDialogOpen(false);
      setCurrentActivityIndex(-1);
    }
  };
  
  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormActivity(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Helper function to get month number from month name
  const getMonthNumber = (monthName: string): string => {
    const months: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
      'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
      'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    return months[monthName] || '01';
  };

  // Count the number of days in the itinerary that have events
  const countDays = () => {
    // Check if days array exists
    if (!localItineraryData || !localItineraryData.days || !Array.isArray(localItineraryData.days)) {
      return 0;
    }
    
    // Only count days that have at least one activity
    return localItineraryData.days.filter(day => 
      day && day.activities && Array.isArray(day.activities) && day.activities.length > 0
    ).length;
  };

  // Count the number of spots (activities that are not meals or hotel-related)
  const countSpots = () => {
    let spotCount = 0;
    
    // Check if days array exists
    if (!localItineraryData || !localItineraryData.days || !Array.isArray(localItineraryData.days)) {
      return 0;
    }
    
    localItineraryData.days.forEach(day => {
      // Check if day and activities exist
      if (day && day.activities && Array.isArray(day.activities)) {
        day.activities.forEach(activity => {
          // Check if activity and description exist
          if (activity && activity.description) {
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
          }
        });
      }
    });
    
    return spotCount;
  };

  // Count the number of meals (breakfast, lunch, dinner)
  const countMeals = () => {
    let mealCount = 0;
    
    // Check if days array exists
    if (!localItineraryData || !localItineraryData.days || !Array.isArray(localItineraryData.days)) {
      return 0;
    }
    
    localItineraryData.days.forEach(day => {
      // Check if day and activities exist
      if (day && day.activities && Array.isArray(day.activities)) {
        day.activities.forEach(activity => {
          // Check if activity and description exist
          if (activity && activity.description) {
            const lowerDesc = activity.description.toLowerCase();
            
            if (lowerDesc.includes('breakfast') || 
                lowerDesc.includes('lunch') || 
                lowerDesc.includes('dinner') || 
                lowerDesc.includes('café') || 
                lowerDesc.includes('cafe') || 
                lowerDesc.includes('restaurant') || 
                lowerDesc.includes('food') || 
                lowerDesc.includes('meal') ||
                // Include specific food places from the itinerary
                lowerDesc.includes('cheesecake factory') ||
                lowerDesc.includes('flo cafe') ||
                lowerDesc.includes('milkbun') ||
                lowerDesc.includes('arabesq') ||
                lowerDesc.includes('creme & butter') ||
                lowerDesc.includes('dave\'s hot chicken') ||
                lowerDesc.includes('raising cane\'s')) {
              mealCount++;
            }
          }
        });
      }
    });
    
    return mealCount;
  };

  // Function to filter activities based on the selected filter
  const getFilteredActivities = () => {
    if (activityFilter === 'all') {
      return sortActivitiesChronologically();
    }
    
    return sortActivitiesChronologically().filter(activity => {
      const lowerDesc = activity.description.toLowerCase();
      
      if (activityFilter === 'spots') {
        // Show only spots (non-meal, non-hotel, non-flight activities)
        return !lowerDesc.includes('breakfast') && 
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
               !lowerDesc.includes('wake up');
      } else if (activityFilter === 'meals') {
        // Show only meals
        return lowerDesc.includes('breakfast') || 
               lowerDesc.includes('lunch') || 
               lowerDesc.includes('dinner') || 
               lowerDesc.includes('café') || 
               lowerDesc.includes('cafe') || 
               lowerDesc.includes('restaurant') || 
               lowerDesc.includes('food') || 
               lowerDesc.includes('meal') ||
               lowerDesc.includes('cheesecake factory') ||
               lowerDesc.includes('flo cafe') ||
               lowerDesc.includes('milkbun') ||
               lowerDesc.includes('arabesq') ||
               lowerDesc.includes('creme & butter') ||
               lowerDesc.includes('dave\'s hot chicken') ||
               lowerDesc.includes('raising cane\'s');
      }
      
      return false;
    });
  };

  // Check if a day is in the itinerary (always return true to make all dates selectable)
  const isDayInItinerary = (day: number, month: number) => {
    // Always return true to make all dates selectable
    return true;
  };

  // Update all click handlers to use handleDayChange instead of setCurrentDayIndex
  const handleDayClick = (dayIndex: number) => {
    handleDayChange(dayIndex);
  };

  return (
    <Box sx={{ pb: 2, position: 'relative' }}>
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        mb: 1
      }}>
        <IconButton sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Travelling to Doha
        </Typography>
      </Box>
      
      {/* Trip Summary */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
            Manchester → Doha
          </Typography>
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={4}>
              <Chip 
                icon={<MosqueIcon />} 
                label={`${countDays()} Days`} 
                onClick={() => setActivityFilter('all')}
                sx={{ 
                  backgroundColor: activityFilter === 'all' ? 'secondary.main' : 'rgba(255, 107, 0, 0.1)', 
                  color: activityFilter === 'all' ? 'white' : 'secondary.main',
                  fontWeight: 500,
                  borderRadius: 1,
                  width: '100%',
                  justifyContent: 'flex-start',
                  '& .MuiChip-icon': { 
                    color: activityFilter === 'all' ? 'white' : 'secondary.main' 
                  },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }} 
              />
            </Grid>
            <Grid item xs={4}>
              <Chip 
                icon={<ShoppingBagIcon />} 
                label={`${countSpots()} Spots`} 
                onClick={() => setActivityFilter('spots')}
                sx={{ 
                  backgroundColor: activityFilter === 'spots' ? 'primary.main' : 'rgba(51, 102, 255, 0.1)', 
                  color: activityFilter === 'spots' ? 'white' : 'primary.main',
                  fontWeight: 500,
                  borderRadius: 1,
                  width: '100%',
                  justifyContent: 'flex-start',
                  '& .MuiChip-icon': { 
                    color: activityFilter === 'spots' ? 'white' : 'primary.main' 
                  },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }} 
              />
            </Grid>
            <Grid item xs={4}>
              <Chip 
                icon={<RestaurantIcon />} 
                label={`${countMeals()} Meals`} 
                onClick={() => setActivityFilter('meals')}
                sx={{ 
                  backgroundColor: activityFilter === 'meals' ? '#4CAF50' : 'rgba(76, 175, 80, 0.1)', 
                  color: activityFilter === 'meals' ? 'white' : '#4CAF50',
                  fontWeight: 500,
                  borderRadius: 1,
                  width: '100%',
                  justifyContent: 'flex-start',
                  '& .MuiChip-icon': { 
                    color: activityFilter === 'meals' ? 'white' : '#4CAF50' 
                  },
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }} 
              />
            </Grid>
          </Grid>
        </Box>
      </Box>
      
      {/* Calendar */}
      <Box sx={{ px: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handlePrevWeek} size="small">
            <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
          </IconButton>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {formatWeekDisplay()}
          </Typography>
          <IconButton onClick={handleNextWeek} size="small">
            <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
        
        <Grid container spacing={0.5} sx={{ mb: 3 }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Grid item xs={12/7} key={`header-${index}`}>
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    fontWeight: 500,
                    color: 'text.secondary'
                  }}
                >
                  {day}
                </Typography>
              </Box>
            </Grid>
          ))}
          
          {generateWeekDays().map((dayInfo, index) => (
            <Grid item xs={12/7} key={`day-${index}`}>
              <Box 
                onClick={() => {
                  const dayIndex = getDayIndexInItinerary(dayInfo.day, dayInfo.date.getMonth());
                  handleDayClick(dayIndex);
                }}
                sx={{ 
                  textAlign: 'center',
                  py: 1,
                  borderRadius: 1,
                  backgroundColor: getDayIndexInItinerary(dayInfo.day, dayInfo.date.getMonth()) === currentDayIndex 
                    ? 'primary.main' 
                    : dayHasEvents(dayInfo.day, dayInfo.date.getMonth())
                      ? 'rgba(51, 102, 255, 0.15)'
                      : 'rgba(0, 0, 0, 0.03)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: dayHasEvents(dayInfo.day, dayInfo.date.getMonth()) 
                    ? '1px solid rgba(51, 102, 255, 0.3)' 
                    : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: getDayIndexInItinerary(dayInfo.day, dayInfo.date.getMonth()) === currentDayIndex 
                      ? 'primary.main' 
                      : dayHasEvents(dayInfo.day, dayInfo.date.getMonth())
                        ? 'rgba(51, 102, 255, 0.25)'
                        : 'rgba(0, 0, 0, 0.06)',
                  },
                  position: 'relative'
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: getDayIndexInItinerary(dayInfo.day, dayInfo.date.getMonth()) === currentDayIndex 
                      ? 'white' 
                      : dayHasEvents(dayInfo.day, dayInfo.date.getMonth())
                        ? 'primary.main'
                        : 'text.secondary'
                  }}
                >
                  {dayInfo.day}
                </Typography>
                
                {/* Event indicator dot */}
                {dayHasEvents(dayInfo.day, dayInfo.date.getMonth()) && 
                  getDayIndexInItinerary(dayInfo.day, dayInfo.date.getMonth()) !== currentDayIndex && (
                  <Box 
                    sx={{
                      position: 'absolute',
                      bottom: 2,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main'
                    }}
                  />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
      
      {/* Timeline */}
      <Box sx={{ px: 2 }}>
        <Box sx={{ position: 'relative' }}>
          {/* Vertical timeline line */}
          <Box sx={{ 
            position: 'absolute',
            left: 60,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.06)',
            zIndex: 0
          }} />
          
          {/* Activities */}
          {getFilteredActivities().length > 0 ? (
            getFilteredActivities().map((activity, index) => {
              // Extract hour for display
              const timeDisplay = activity.time.split(' ')[0].split(':')[0].padStart(2, '0');
              const isPM = activity.time.includes('PM');
              const timeLabel = `${timeDisplay}:00 ${isPM ? 'PM' : 'AM'}`;
              
              return (
                <Box key={`activity-${index}`} sx={{ mb: 3, position: 'relative' }}>
                  {/* Time indicator */}
                  <Box sx={{ 
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 60,
                    textAlign: 'right',
                    pr: 2,
                    zIndex: 1
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {timeDisplay}:00
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {isPM ? 'PM' : 'AM'}
                    </Typography>
                  </Box>
                  
                  {/* Time dot */}
                  <Box sx={{ 
                    position: 'absolute',
                    left: 60,
                    top: 6,
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    transform: 'translateX(-50%)',
                    zIndex: 1
                  }} />
                  
                  {/* Activity card */}
                  <Card 
                    sx={{ 
                      ml: 8, 
                      borderRadius: 2,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                      position: 'relative'
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                          <Box sx={{ 
                            mr: 2, 
                            mt: 0.5, 
                            width: 32, 
                            height: 32, 
                            borderRadius: '50%', 
                            backgroundColor: 'rgba(51, 102, 255, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            {getActivityIcon(activity.description)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {activity.description}
                            </Typography>
                            {activity.location && (
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {activity.location}
                                </Typography>
                              </Box>
                            )}
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                              <Typography variant="body2" color="text.secondary">
                                {activity.time}
                              </Typography>
                            </Box>
                          </Box>
                        </Box>
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleMenuOpen(e, index)}
                          sx={{ mt: -0.5, mr: -0.5 }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              );
            })
          ) : (
            <Box 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: 200,
                mt: 4,
                backgroundColor: 'rgba(0, 0, 0, 0.02)',
                borderRadius: 2,
                p: 3
              }}
            >
              <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 1 }}>
                {activityFilter === 'all' ? 'No events added.' : 
                 activityFilter === 'spots' ? 'No spots added.' : 
                 'No meals added.'}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Use the <AddIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> icon to add an event.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Activity Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
      
      {/* Edit Activity Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Activity</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Date"
              type="date"
              name="date"
              value={formActivity.date}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Time"
              type="time"
              name="time"
              value={formActivity.time}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              value={formActivity.description}
              onChange={handleFormChange}
              placeholder="e.g. Breakfast at Hotel"
            />
            <TextField
              fullWidth
              margin="normal"
              label="Location (Optional)"
              name="location"
              value={formActivity.location}
              onChange={handleFormChange}
              placeholder="e.g. Hotel Restaurant"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            color="primary"
            disabled={!formActivity.date || !formActivity.time || !formActivity.description}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Activity Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Activity</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              margin="normal"
              label="Date"
              type="date"
              name="date"
              value={formActivity.date}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Time"
              type="time"
              name="time"
              value={formActivity.time}
              onChange={handleFormChange}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              value={formActivity.description}
              onChange={handleFormChange}
              placeholder="e.g. Breakfast at Hotel"
            />
            <TextField
              fullWidth
              margin="normal"
              label="Location (Optional)"
              name="location"
              value={formActivity.location}
              onChange={handleFormChange}
              placeholder="e.g. Hotel Restaurant"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveNewActivity} 
            variant="contained" 
            color="primary"
            disabled={!formActivity.date || !formActivity.time || !formActivity.description}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Activity</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this activity? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteActivity} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab 
        color="primary" 
        aria-label="add" 
        onClick={handleAddActivity}
        sx={{ 
          position: 'fixed', 
          bottom: 80, 
          right: 16,
          boxShadow: '0px 4px 10px rgba(51, 102, 255, 0.3)'
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default ItineraryPage; 