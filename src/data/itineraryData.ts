export interface Activity {
  date: string;
  time: string;
  description: string;
  icon?: string;
  location?: string;
}

export interface Day {
  date: string;
  dayNumber: number;
  dayName: string;
  title: string;
  activities: Activity[];
}

export interface ItineraryData {
  title: string;
  dates: string;
  hotel: string;
  flightDetails: {
    outbound: string;
    return: string;
  };
  group: string;
  description: string;
  days: Day[];
}

export const dohaItinerary: ItineraryData = {
  title: "7-Night Doha Itinerary",
  dates: "14 May – 21 May 2025",
  hotel: "Steigenberger Hotel Doha",
  flightDetails: {
    outbound: "MAN → DOH (08:15 AM - 17:05 PM)",
    return: "DOH → MAN (14:35 PM - 19:55 PM)",
  },
  group: "3 Adults (2 Rooms)",
  description: "Muslim-Friendly & Late-Night Schedule, Waking Up at 8:30-9:30 AM Daily. This itinerary ensures prayer times, halal-friendly food spots, sightseeing, shopping, and adventure, with wakeup time between 8:30-9:30 AM and return to the hotel between 12:00 AM - 1:00 AM daily for maximum experiences.",
  days: [
    {
      date: "14 May 2025",
      dayNumber: 1,
      dayName: "Wednesday",
      title: "Arrival & Late-Night Walk",
      activities: [
        { date: "14 May 2025", time: "08:15 AM", description: "Flight from Manchester (MAN)" },
        { date: "14 May 2025", time: "17:05 PM", description: "Arrive at Hamad International Airport (DOH)" },
        { date: "14 May 2025", time: "18:00 PM", description: "Transfer & check-in at Steigenberger Hotel Doha", location: "Freshen up, Maghrib prayer" },
        { date: "14 May 2025", time: "20:00 PM", description: "Dinner at Flo Cafe 🍰", location: "Desserts & drinks" },
        { date: "14 May 2025", time: "22:00 PM", description: "Late-night stroll at West Walk", location: "Relaxing vibes" },
        { date: "14 May 2025", time: "00:30 AM", description: "Return to hotel" }
      ]
    },
    {
      date: "15 May 2025",
      dayNumber: 2,
      dayName: "Thursday",
      title: "Doha City Tour & Late-Night Souq",
      activities: [
        { date: "15 May 2025", time: "09:30 AM", description: "Wake up & Breakfast at Café Lovella ☕" },
        { date: "15 May 2025", time: "11:00 AM - 15:00 PM", description: "Doha City Guided Tour", location: "The Pearl (Luxury marina, high-end shopping), Katara Cultural Village & Katara Mosque, Mina District (Colorful port area, great for photos)" },
        { date: "15 May 2025", time: "15:30 PM", description: "Lunch at Milkbun 🍔" },
        { date: "15 May 2025", time: "17:00 PM", description: "Shopping & gondola rides at Villaggio Mall" },
        { date: "15 May 2025", time: "19:00 PM", description: "Maghrib prayer at Hamad Bin Jassim Mosque" },
        { date: "15 May 2025", time: "20:00 PM", description: "Dinner at Cheesecake Factory 🍰" },
        { date: "15 May 2025", time: "22:30 PM", description: "Explore Souq Waqif", location: "Late-Night Shopping & Tea" },
        { date: "15 May 2025", time: "00:30 AM", description: "Return to hotel" }
      ]
    },
    {
      date: "16 May 2025",
      dayNumber: 3,
      dayName: "Friday",
      title: "Desert Safari, Inland Sea & Afternoon Tea",
      activities: [
        { date: "16 May 2025", time: "09:30 AM", description: "Wake up & Breakfast at Arabica ☕" },
        { date: "16 May 2025", time: "11:00 AM - 15:00 PM", description: "Desert Safari, Quad Biking & Camel Ride", location: "Dune bashing, sandboarding, camel riding, Inland Sea (Khor Al Adaid) 🌊" },
        { date: "16 May 2025", time: "16:00 PM", description: "Return to hotel, freshen up" },
        { date: "16 May 2025", time: "17:00 PM", description: "Jummah prayer at Education City Mosque" },
        { date: "16 May 2025", time: "18:00 PM", description: "Afternoon Tea at Raffles Hotel 🍵" },
        { date: "16 May 2025", time: "20:30 PM", description: "Dinner at Raising Cane's 🍗" },
        { date: "16 May 2025", time: "22:30 PM", description: "Late-night chill at Place Vendôme Mall", location: "Fountains, night views" },
        { date: "16 May 2025", time: "00:30 AM", description: "Return to hotel" }
      ]
    },
    {
      date: "17 May 2025",
      dayNumber: 4,
      dayName: "Saturday",
      title: "Banana Island & Late-Night Corniche",
      activities: [
        { date: "17 May 2025", time: "09:30 AM", description: "Wake up & Breakfast at Lemeridien Doha ☕" },
        { date: "17 May 2025", time: "11:00 AM - 17:00 PM", description: "Banana Island Day Trip 🏝️", location: "Beach, water sports" },
        { date: "17 May 2025", time: "18:00 PM", description: "Return to Doha, freshen up" },
        { date: "17 May 2025", time: "20:00 PM", description: "Dinner at Dave's Hot Chicken 🔥🍗" },
        { date: "17 May 2025", time: "22:00 PM", description: "Night stroll at West Bay Corniche" },
        { date: "17 May 2025", time: "00:30 AM", description: "Return to the hotel" }
      ]
    },
    {
      date: "18 May 2025",
      dayNumber: 5,
      dayName: "Sunday",
      title: "Islamic Heritage & Museum Tour",
      activities: [
        { date: "18 May 2025", time: "09:30 AM", description: "Wake up & Breakfast at Creme & Butter 🍰" },
        { date: "18 May 2025", time: "11:00 AM", description: "Visit Museum of Islamic Art 🎨" },
        { date: "18 May 2025", time: "13:30 PM", description: "Lunch at Arabesq 🍽️", location: "Authentic Arabian cuisine" },
        { date: "18 May 2025", time: "15:00 PM", description: "Relax at MIA Park", location: "Skyline views" },
        { date: "18 May 2025", time: "17:00 PM", description: "Maghrib prayer at Hamad Bin Jassim Mosque" },
        { date: "18 May 2025", time: "19:00 PM", description: "Dinner at The Pearl 🍽️" },
        { date: "18 May 2025", time: "21:30 PM", description: "Late-night visit to Katara Cultural Village" },
        { date: "18 May 2025", time: "00:30 AM", description: "Return to hotel" }
      ]
    },
    {
      date: "19 May 2025",
      dayNumber: 6,
      dayName: "Monday",
      title: "Shopping, Entertainment & Msheireb Downtown",
      activities: [
        { date: "19 May 2025", time: "09:30 AM", description: "Wake up & Breakfast at Zawya Café ☕" },
        { date: "19 May 2025", time: "11:30 AM", description: "Shopping at Villaggio Mall / Mall of Qatar" },
        { date: "19 May 2025", time: "14:00 PM", description: "Lunch at Cheesecake Factory" },
        { date: "19 May 2025", time: "16:30 PM", description: "Shopping & fountains at Place Vendôme Mall" },
        { date: "19 May 2025", time: "18:00 PM", description: "Maghrib prayer at Education City Mosque" },
        { date: "19 May 2025", time: "20:00 PM", description: "Dinner at Milkbun", location: "Try new menu items" },
        { date: "19 May 2025", time: "22:30 PM", description: "Explore Msheireb Downtown Doha", location: "Nightlife, Coffee" },
        { date: "19 May 2025", time: "00:30 AM", description: "Return to hotel" }
      ]
    },
    {
      date: "20 May 2025",
      dayNumber: 7,
      dayName: "Tuesday",
      title: "Final Shopping & Late-Night Souq Visit",
      activities: [
        { date: "20 May 2025", time: "09:30 AM", description: "Wake up & Breakfast at Lemeridien Doha" },
        { date: "20 May 2025", time: "11:30 AM", description: "Last shopping at Place Vendôme Mall" },
        { date: "20 May 2025", time: "14:00 PM", description: "Lunch at Creme & Butter" },
        { date: "20 May 2025", time: "16:30 PM", description: "Visit Katara Cultural Village" },
        { date: "20 May 2025", time: "18:30 PM", description: "Maghrib prayer at Katara Mosque" },
        { date: "20 May 2025", time: "20:00 PM", description: "Final dinner at Arabesq" },
        { date: "20 May 2025", time: "22:30 PM", description: "Final visit to Souq Waqif", location: "Shopping, Shisha, Tea" },
        { date: "20 May 2025", time: "00:30 AM", description: "Back to the hotel, pack up" }
      ]
    },
    {
      date: "21 May 2025",
      dayNumber: 8,
      dayName: "Wednesday",
      title: "Departure Day",
      activities: [
        { date: "21 May 2025", time: "09:00 AM", description: "Wake up & Breakfast at Lemeridien Doha ☕" },
        { date: "21 May 2025", time: "10:30 AM - 12:00 PM", description: "Final morning activity: Visit Mina District 🏝️", location: "Explore the colorful streets, cafes, and waterfront views. Last chance for scenic pictures and relaxing walks" },
        { date: "21 May 2025", time: "12:00 PM", description: "Head back to hotel, final packing" },
        { date: "21 May 2025", time: "13:00 PM", description: "Check out & airport transfer 🚕" },
        { date: "21 May 2025", time: "14:35 PM", description: "Flight to Manchester" }
      ]
    }
  ]
}; 