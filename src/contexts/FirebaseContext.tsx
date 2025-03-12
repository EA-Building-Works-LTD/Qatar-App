import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { database } from '../firebase';
import { ref, onValue, set, get, DataSnapshot, DatabaseReference } from 'firebase/database';
import { ItineraryData, dohaItinerary } from '../data/itineraryData';

// Define Note type
export interface Note {
  id: number;
  text: string;
  completed: boolean;
}

// Define UserProfile type
export interface UserProfile {
  name: string;
  email: string;
  avatar: string;
}

// Define NotificationSettings type
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  updates: boolean;
}

// Define Preferences type
export interface Preferences {
  darkMode: boolean;
  language: string;
  sound: boolean;
}

// Define Person type for expenses
export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  paidBy: string;
}

export interface Person {
  id: number;
  name: string;
  expenses: Expense[];
}

export interface ExpensesData {
  people: Person[];
  totalSpent: number;
}

interface FirebaseContextType {
  itineraryData: ItineraryData;
  updateItineraryData: (newData: ItineraryData) => Promise<void>;
  notes: Note[];
  addNote: (text: string) => Promise<void>;
  toggleNote: (id: number) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
  userProfile: UserProfile;
  updateUserProfile: (newProfile: UserProfile) => Promise<void>;
  notificationSettings: NotificationSettings;
  updateNotificationSettings: (newSettings: NotificationSettings) => Promise<void>;
  preferences: Preferences;
  updatePreferences: (newPreferences: Preferences) => Promise<void>;
  expensesData: ExpensesData;
  updateExpensesData: (newData: ExpensesData) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

interface FirebaseProviderProps {
  children: ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({ children }) => {
  const [itineraryData, setItineraryData] = useState<ItineraryData>(dohaItinerary);
  const [notes, setNotes] = useState<Note[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Guest User',
    email: 'guest@example.com',
    avatar: 'G'
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: true,
    push: true,
    updates: false
  });
  const [preferences, setPreferences] = useState<Preferences>({
    darkMode: false,
    language: 'English',
    sound: true
  });
  const [expensesData, setExpensesData] = useState<ExpensesData>({
    people: [
      { id: 1, name: 'Ehsaan', expenses: [] },
      { id: 2, name: 'Amar', expenses: [] },
      { id: 3, name: 'Wahees', expenses: [] }
    ],
    totalSpent: 0
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize and sync data with Firebase
  useEffect(() => {
    // Set up references to all data in Firebase
    const itineraryRef: DatabaseReference = ref(database, 'itinerary');
    const notesRef: DatabaseReference = ref(database, 'notes');
    const userProfileRef: DatabaseReference = ref(database, 'userProfile');
    const notificationSettingsRef: DatabaseReference = ref(database, 'notificationSettings');
    const preferencesRef: DatabaseReference = ref(database, 'preferences');
    const expensesDataRef: DatabaseReference = ref(database, 'expensesData');
    
    // Check and initialize itinerary data
    get(itineraryRef).then((snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        set(itineraryRef, dohaItinerary)
          .then(() => console.log("Default itinerary data initialized in Firebase"))
          .catch((err: Error) => {
            console.error("Error initializing itinerary data:", err);
            setError("Failed to initialize itinerary data");
          });
      }
    }).catch((err: Error) => {
      console.error("Error checking for existing itinerary data:", err);
      setError("Failed to check for existing itinerary data");
    });

    // Check and initialize notes data
    get(notesRef).then((snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        const defaultNotes = [
          { id: 1, text: 'Visit Museum of Islamic Art', completed: false },
          { id: 2, text: 'Try local street food at Souq Waqif', completed: false },
          { id: 3, text: 'Shop at Villaggio Mall', completed: false }
        ];
        set(notesRef, defaultNotes)
          .then(() => console.log("Default notes initialized in Firebase"))
          .catch((err: Error) => {
            console.error("Error initializing notes:", err);
            setError("Failed to initialize notes");
          });
      }
    }).catch((err: Error) => {
      console.error("Error checking for existing notes:", err);
      setError("Failed to check for existing notes");
    });

    // Check and initialize user profile data
    get(userProfileRef).then((snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        const defaultProfile = {
          name: 'Guest User',
          email: 'guest@example.com',
          avatar: 'G'
        };
        set(userProfileRef, defaultProfile)
          .then(() => console.log("Default user profile initialized in Firebase"))
          .catch((err: Error) => {
            console.error("Error initializing user profile:", err);
            setError("Failed to initialize user profile");
          });
      }
    }).catch((err: Error) => {
      console.error("Error checking for existing user profile:", err);
      setError("Failed to check for existing user profile");
    });

    // Check and initialize notification settings
    get(notificationSettingsRef).then((snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        const defaultSettings = {
          email: true,
          push: true,
          updates: false
        };
        set(notificationSettingsRef, defaultSettings)
          .then(() => console.log("Default notification settings initialized in Firebase"))
          .catch((err: Error) => {
            console.error("Error initializing notification settings:", err);
            setError("Failed to initialize notification settings");
          });
      }
    }).catch((err: Error) => {
      console.error("Error checking for existing notification settings:", err);
      setError("Failed to check for existing notification settings");
    });

    // Check and initialize preferences
    get(preferencesRef).then((snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        const defaultPreferences = {
          darkMode: false,
          language: 'English',
          sound: true
        };
        set(preferencesRef, defaultPreferences)
          .then(() => console.log("Default preferences initialized in Firebase"))
          .catch((err: Error) => {
            console.error("Error initializing preferences:", err);
            setError("Failed to initialize preferences");
          });
      }
    }).catch((err: Error) => {
      console.error("Error checking for existing preferences:", err);
      setError("Failed to check for existing preferences");
    });

    // Check and initialize expenses data
    get(expensesDataRef).then((snapshot: DataSnapshot) => {
      if (!snapshot.exists()) {
        const defaultExpensesData = {
          people: [
            { id: 1, name: 'Ehsaan', expenses: [] },
            { id: 2, name: 'Amar', expenses: [] },
            { id: 3, name: 'Wahees', expenses: [] }
          ],
          totalSpent: 0
        };
        set(expensesDataRef, defaultExpensesData)
          .then(() => console.log("Default expenses data initialized in Firebase"))
          .catch((err: Error) => {
            console.error("Error initializing expenses data:", err);
            setError("Failed to initialize expenses data");
          });
      }
    }).catch((err: Error) => {
      console.error("Error checking for existing expenses data:", err);
      setError("Failed to check for existing expenses data");
    });

    // Set up real-time listeners for all data
    const unsubscribeItinerary = onValue(itineraryRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log("Received updated itinerary data from Firebase");
        setItineraryData(data);
      }
      setLoading(false);
    }, (err: Error) => {
      console.error("Error syncing itinerary with Firebase:", err);
      setError("Failed to sync itinerary with server");
      setLoading(false);
    });

    const unsubscribeNotes = onValue(notesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log("Received updated notes from Firebase");
        setNotes(data);
      }
    }, (err: Error) => {
      console.error("Error syncing notes with Firebase:", err);
      setError("Failed to sync notes with server");
    });

    const unsubscribeUserProfile = onValue(userProfileRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log("Received updated user profile from Firebase");
        setUserProfile(data);
      }
    }, (err: Error) => {
      console.error("Error syncing user profile with Firebase:", err);
      setError("Failed to sync user profile with server");
    });

    const unsubscribeNotificationSettings = onValue(notificationSettingsRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log("Received updated notification settings from Firebase");
        setNotificationSettings(data);
      }
    }, (err: Error) => {
      console.error("Error syncing notification settings with Firebase:", err);
      setError("Failed to sync notification settings with server");
    });

    const unsubscribePreferences = onValue(preferencesRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log("Received updated preferences from Firebase");
        setPreferences(data);
      }
    }, (err: Error) => {
      console.error("Error syncing preferences with Firebase:", err);
      setError("Failed to sync preferences with server");
    });

    const unsubscribeExpensesData = onValue(expensesDataRef, (snapshot: DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        console.log("Received updated expenses data from Firebase");
        setExpensesData(data);
      }
    }, (err: Error) => {
      console.error("Error syncing expenses data with Firebase:", err);
      setError("Failed to sync expenses data with server");
    });

    // Clean up listeners on unmount
    return () => {
      unsubscribeItinerary();
      unsubscribeNotes();
      unsubscribeUserProfile();
      unsubscribeNotificationSettings();
      unsubscribePreferences();
      unsubscribeExpensesData();
    };
  }, []);

  // Function to update itinerary data
  const updateItineraryData = async (newData: ItineraryData): Promise<void> => {
    try {
      const itineraryRef: DatabaseReference = ref(database, 'itinerary');
      await set(itineraryRef, newData);
      console.log("Itinerary data successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating itinerary data:", errorMessage);
      setError("Failed to update itinerary data");
      throw err;
    }
  };

  // Function to add a new note
  const addNote = async (text: string): Promise<void> => {
    try {
      if (text.trim() === '') return;
      
      const newId = notes.length > 0 ? Math.max(...notes.map(note => note.id)) + 1 : 1;
      const updatedNotes = [...notes, { id: newId, text, completed: false }];
      
      const notesRef: DatabaseReference = ref(database, 'notes');
      await set(notesRef, updatedNotes);
      console.log("Note successfully added to Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error adding note:", errorMessage);
      setError("Failed to add note");
      throw err;
    }
  };

  // Function to toggle a note's completed status
  const toggleNote = async (id: number): Promise<void> => {
    try {
      const updatedNotes = notes.map(note => 
        note.id === id ? { ...note, completed: !note.completed } : note
      );
      
      const notesRef: DatabaseReference = ref(database, 'notes');
      await set(notesRef, updatedNotes);
      console.log("Note successfully toggled in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error toggling note:", errorMessage);
      setError("Failed to update note");
      throw err;
    }
  };

  // Function to delete a note
  const deleteNote = async (id: number): Promise<void> => {
    try {
      const updatedNotes = notes.filter(note => note.id !== id);
      
      const notesRef: DatabaseReference = ref(database, 'notes');
      await set(notesRef, updatedNotes);
      console.log("Note successfully deleted from Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error deleting note:", errorMessage);
      setError("Failed to delete note");
      throw err;
    }
  };

  // Function to update user profile
  const updateUserProfile = async (newProfile: UserProfile): Promise<void> => {
    try {
      const userProfileRef: DatabaseReference = ref(database, 'userProfile');
      await set(userProfileRef, newProfile);
      console.log("User profile successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating user profile:", errorMessage);
      setError("Failed to update user profile");
      throw err;
    }
  };

  // Function to update notification settings
  const updateNotificationSettings = async (newSettings: NotificationSettings): Promise<void> => {
    try {
      const notificationSettingsRef: DatabaseReference = ref(database, 'notificationSettings');
      await set(notificationSettingsRef, newSettings);
      console.log("Notification settings successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating notification settings:", errorMessage);
      setError("Failed to update notification settings");
      throw err;
    }
  };

  // Function to update preferences
  const updatePreferences = async (newPreferences: Preferences): Promise<void> => {
    try {
      const preferencesRef: DatabaseReference = ref(database, 'preferences');
      await set(preferencesRef, newPreferences);
      console.log("Preferences successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating preferences:", errorMessage);
      setError("Failed to update preferences");
      throw err;
    }
  };

  // Function to update expenses data
  const updateExpensesData = async (newData: ExpensesData): Promise<void> => {
    try {
      const expensesDataRef: DatabaseReference = ref(database, 'expensesData');
      await set(expensesDataRef, newData);
      console.log("Expenses data successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating expenses data:", errorMessage);
      setError("Failed to update expenses data");
      throw err;
    }
  };

  const value = {
    itineraryData,
    updateItineraryData,
    notes,
    addNote,
    toggleNote,
    deleteNote,
    userProfile,
    updateUserProfile,
    notificationSettings,
    updateNotificationSettings,
    preferences,
    updatePreferences,
    expensesData,
    updateExpensesData,
    loading,
    error
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}; 