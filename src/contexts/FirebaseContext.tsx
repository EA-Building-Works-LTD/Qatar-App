import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { database, auth } from '../firebase';
import { ref, onValue, set, get, DataSnapshot, DatabaseReference } from 'firebase/database';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { ItineraryData, dohaItinerary } from '../data/itineraryData';
import { requestNotificationPermission } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// Define Note type
export interface Note {
  id: number;
  text: string;
  completed: boolean;
  author: {
    name: string;
    email: string;
  };
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

// Define a constant for the shared trip ID
// In a real app, this would be dynamic based on the trip the user is viewing
const SHARED_TRIP_ID = 'doha-trip-2025';

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
  // Authentication related properties
  currentUser: User | null;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  signOutUser: () => Promise<void>;
  // Current page state
  currentPage: number;
  updateCurrentPage: (page: number) => Promise<void>;
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
  
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Current page state
  const [currentPage, setCurrentPage] = useState<number>(0);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      setLoading(false);
      
      if (user) {
        // If user is authenticated, set up real-time listeners for their data
        const userId = user.uid;
        
        // Set up listener for user profile
        const userProfileRef = ref(database, `users/${userId}/userProfile`);
        const profileUnsubscribe = onValue(userProfileRef, (snapshot) => {
          if (snapshot.exists()) {
            setUserProfile(snapshot.val());
          } else {
            // Initialize with default profile if none exists
            const defaultProfile = {
              name: user.displayName || 'User',
              email: user.email || 'user@example.com',
              avatar: user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'
            };
            setUserProfile(defaultProfile);
            // Save default profile to Firebase
            set(userProfileRef, defaultProfile).catch(err => {
              console.error("Error setting default user profile:", err);
            });
          }
        }, (error) => {
          console.error("Error loading user profile:", error);
        });
        
        // Set up listener for notification settings
        const notificationSettingsRef = ref(database, `users/${userId}/notificationSettings`);
        const notificationsUnsubscribe = onValue(notificationSettingsRef, (snapshot) => {
          if (snapshot.exists()) {
            setNotificationSettings(snapshot.val());
          } else {
            // Initialize with default settings if none exist
            const defaultSettings = {
              email: true,
              push: true,
              updates: false
            };
            setNotificationSettings(defaultSettings);
            // Save default settings to Firebase
            set(notificationSettingsRef, defaultSettings).catch(err => {
              console.error("Error setting default notification settings:", err);
            });
          }
        }, (error) => {
          console.error("Error loading notification settings:", error);
        });
        
        // Set up listener for preferences
        const preferencesRef = ref(database, `users/${userId}/preferences`);
        const preferencesUnsubscribe = onValue(preferencesRef, (snapshot) => {
          if (snapshot.exists()) {
            setPreferences(snapshot.val());
          } else {
            // Initialize with default preferences if none exist
            const defaultPreferences = {
              darkMode: false,
              language: 'English',
              sound: true
            };
            setPreferences(defaultPreferences);
            // Save default preferences to Firebase
            set(preferencesRef, defaultPreferences).catch(err => {
              console.error("Error setting default preferences:", err);
            });
          }
        }, (error) => {
          console.error("Error loading preferences:", error);
        });
        
        // Set up listener for shared notes (instead of user-specific notes)
        const sharedNotesRef = ref(database, `shared/${SHARED_TRIP_ID}/notes`);
        const notesUnsubscribe = onValue(sharedNotesRef, (snapshot) => {
          if (snapshot.exists()) {
            setNotes(snapshot.val());
          } else {
            // Initialize with an empty array if no notes exist
            const emptyNotes: Note[] = [];
            setNotes(emptyNotes);
            // Save empty notes to Firebase
            set(sharedNotesRef, emptyNotes).catch(err => {
              console.error("Error setting empty notes:", err);
            });
          }
        }, (error) => {
          console.error("Error loading notes:", error);
        });
        
        // Set up listener for shared expenses data
        const sharedExpensesDataRef = ref(database, `shared/${SHARED_TRIP_ID}/expensesData`);
        const expensesUnsubscribe = onValue(sharedExpensesDataRef, (snapshot) => {
          if (snapshot.exists()) {
            setExpensesData(snapshot.val());
          } else {
            // Initialize with default expenses data if none exist
            const defaultExpensesData = {
              people: [
                { id: 1, name: user.displayName || 'User', expenses: [] },
                { id: 2, name: 'Travel Companion 1', expenses: [] },
                { id: 3, name: 'Travel Companion 2', expenses: [] }
              ],
              totalSpent: 0
            };
            setExpensesData(defaultExpensesData);
            // Save default expenses data to Firebase
            set(sharedExpensesDataRef, defaultExpensesData).catch(err => {
              console.error("Error setting default expenses data:", err);
            });
          }
        }, (error) => {
          console.error("Error loading expenses data:", error);
        });
        
        // Set up listener for shared itinerary data
        const sharedItineraryDataRef = ref(database, `shared/${SHARED_TRIP_ID}/itineraryData`);
        const itineraryUnsubscribe = onValue(sharedItineraryDataRef, (snapshot) => {
          if (snapshot.exists()) {
            setItineraryData(snapshot.val());
          } else {
            // Initialize with default itinerary data if none exist
            setItineraryData(dohaItinerary);
            // Save default itinerary data to Firebase
            set(sharedItineraryDataRef, dohaItinerary).catch(err => {
              console.error("Error setting default itinerary data:", err);
            });
          }
        }, (error) => {
          console.error("Error loading itinerary data:", error);
        });
        
        // Return a cleanup function to unsubscribe from all listeners when component unmounts
        return () => {
          profileUnsubscribe();
          notificationsUnsubscribe();
          preferencesUnsubscribe();
          notesUnsubscribe();
          expensesUnsubscribe();
          itineraryUnsubscribe();
          unsubscribe();
        };
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Function to sign out
  const signOutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setCurrentUser(null);
      
      // Reset to default values
      setUserProfile({
        name: 'Guest User',
        email: 'guest@example.com',
        avatar: 'G'
      });
      setNotificationSettings({
        email: true,
        push: true,
        updates: false
      });
      setPreferences({
        darkMode: false,
        language: 'English',
        sound: true
      });
      setNotes([]);
      setExpensesData({
        people: [],
        totalSpent: 0
      });
      setCurrentPage(0);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error signing out:", errorMessage);
      setError("Failed to sign out");
      throw err;
    }
  };

  // Function to update user profile
  const updateUserProfile = async (newProfile: UserProfile): Promise<void> => {
    try {
      if (!currentUser) {
        console.log("No authenticated user, skipping Firebase update");
        return;
      }
      
      const userId = currentUser.uid;
      const userProfileRef: DatabaseReference = ref(database, `users/${userId}/userProfile`);
      await set(userProfileRef, newProfile);
      // No need to update local state here as the onValue listener will handle it
      console.log("User profile successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating user profile:", errorMessage);
      // Don't throw the error, just log it
    }
  };

  // Function to update notification settings
  const updateNotificationSettings = async (newSettings: NotificationSettings): Promise<void> => {
    try {
      if (!currentUser) {
        console.log("No authenticated user, skipping Firebase update");
        return;
      }
      
      const userId = currentUser.uid;
      const notificationSettingsRef: DatabaseReference = ref(database, `users/${userId}/notificationSettings`);
      await set(notificationSettingsRef, newSettings);
      // No need to update local state here as the onValue listener will handle it
      console.log("Notification settings successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating notification settings:", errorMessage);
      // Don't throw the error, just log it
    }
  };

  // Function to update preferences
  const updatePreferences = async (newPreferences: Preferences): Promise<void> => {
    try {
      if (!currentUser) {
        console.log("No authenticated user, skipping Firebase update");
        return;
      }
      
      const userId = currentUser.uid;
      const preferencesRef: DatabaseReference = ref(database, `users/${userId}/preferences`);
      await set(preferencesRef, newPreferences);
      // No need to update local state here as the onValue listener will handle it
      console.log("Preferences successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating preferences:", errorMessage);
      // Don't throw the error, just log it
    }
  };

  // Function to update itinerary data (now updates shared data)
  const updateItineraryData = async (newData: ItineraryData): Promise<void> => {
    try {
      if (!currentUser) {
        console.log("No authenticated user, skipping Firebase update");
        return;
      }
      
      // Update shared itinerary data
      const sharedItineraryRef: DatabaseReference = ref(database, `shared/${SHARED_TRIP_ID}/itineraryData`);
      await set(sharedItineraryRef, newData);
      // No need to update local state here as the onValue listener will handle it
      console.log("Shared itinerary data successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating itinerary data:", errorMessage);
      // Don't throw the error, just log it
    }
  };

  // Request notification permission when user logs in
  useEffect(() => {
    if (currentUser && notificationSettings.push) {
      console.log('Requesting notification permission for user:', currentUser.email);
      requestNotificationPermission()
        .then(token => {
          console.log('FCM Token received:', token);
          if (!token) {
            console.warn('No FCM token received');
          }
        })
        .catch(err => {
          console.error('Error requesting notification permission:', err);
        });
    }
  }, [currentUser, notificationSettings.push]);

  // Function to send notification to all users except the author
  const sendNotificationToUsers = async (noteAuthor: string, noteText: string) => {
    try {
      console.log('Attempting to send notifications for new note by:', noteAuthor);
      
      // Get all users
      const usersRef = ref(database, 'users');
      const snapshot = await get(usersRef);
      
      if (snapshot.exists()) {
        const users = snapshot.val();
        console.log('Found users:', Object.keys(users).length);
        
        // For each user that has a FCM token
        Object.entries(users).forEach(async ([userId, userData]: [string, any]) => {
          console.log('Checking user:', userData.userProfile?.email, 'FCM Token:', userData.fcmToken ? 'Present' : 'Missing');
          
          if (userData.fcmToken && userData.userProfile?.email !== noteAuthor) {
            console.log('Sending notification to:', userData.userProfile?.email);
            
            try {
              // Call the Firebase Cloud Function
              const sendNotificationFn = httpsCallable(functions, 'sendNotification');
              const result = await sendNotificationFn({
                token: userData.fcmToken,
                notification: {
                  title: `New Place Added`,
                  body: `${noteAuthor} added "${noteText}" to places to visit`
                }
              });
              
              console.log('Notification sent successfully:', result);
            } catch (error) {
              console.error('Error calling sendNotification function:', error);
            }
          }
        });
      } else {
        console.log('No users found in database');
      }
    } catch (err) {
      console.error('Error in sendNotificationToUsers:', err);
    }
  };

  // Function to add a new note (now updates shared data and sends notifications)
  const addNote = async (text: string): Promise<void> => {
    try {
      if (text.trim() === '') return;
      
      if (!currentUser) {
        console.log("No authenticated user, skipping Firebase update");
        return;
      }
      
      const newId = notes.length > 0 ? Math.max(...notes.map(note => note.id)) + 1 : 1;
      const updatedNotes = [...notes, { 
        id: newId, 
        text, 
        completed: false,
        author: {
          name: currentUser.displayName || 'Anonymous',
          email: currentUser.email || ''
        }
      }];
      
      // Update shared notes
      const sharedNotesRef: DatabaseReference = ref(database, `shared/${SHARED_TRIP_ID}/notes`);
      await set(sharedNotesRef, updatedNotes);
      
      // Send notifications to other users
      await sendNotificationToUsers(
        currentUser.email || 'Anonymous',
        text
      );
      
      console.log("Shared note successfully added to Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error adding note:", errorMessage);
      // Don't throw the error, just log it
    }
  };

  // Function to toggle a note's completed status (now updates shared data)
  const toggleNote = async (id: number): Promise<void> => {
    try {
      if (!currentUser) {
        console.log("No authenticated user, skipping Firebase update");
        return;
      }
      
      const updatedNotes = notes.map(note => 
        note.id === id ? { ...note, completed: !note.completed } : note
      );
      
      // Update shared notes
      const sharedNotesRef: DatabaseReference = ref(database, `shared/${SHARED_TRIP_ID}/notes`);
      await set(sharedNotesRef, updatedNotes);
      // No need to update local state here as the onValue listener will handle it
      console.log("Shared note successfully toggled in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error toggling note:", errorMessage);
      // Don't throw the error, just log it
    }
  };

  // Function to delete a note (now updates shared data)
  const deleteNote = async (id: number): Promise<void> => {
    try {
      if (!currentUser) {
        console.log("No authenticated user, skipping Firebase update");
        return;
      }
      
      const updatedNotes = notes.filter(note => note.id !== id);
      
      // Update shared notes
      const sharedNotesRef: DatabaseReference = ref(database, `shared/${SHARED_TRIP_ID}/notes`);
      await set(sharedNotesRef, updatedNotes);
      // No need to update local state here as the onValue listener will handle it
      console.log("Shared note successfully deleted from Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error deleting note:", errorMessage);
      // Don't throw the error, just log it
    }
  };

  // Function to update expenses data (now updates shared data)
  const updateExpensesData = async (newData: ExpensesData): Promise<void> => {
    try {
      if (!currentUser) {
        console.log("No authenticated user, skipping Firebase update");
        return;
      }
      
      // Update shared expenses data
      const sharedExpensesRef: DatabaseReference = ref(database, `shared/${SHARED_TRIP_ID}/expensesData`);
      await set(sharedExpensesRef, newData);
      // No need to update local state here as the onValue listener will handle it
      console.log("Shared expenses data successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating expenses data:", errorMessage);
      // Don't throw the error, just log it
    }
  };

  // Function to update current page
  const updateCurrentPage = async (page: number): Promise<void> => {
    try {
      // Update local state immediately for better UX
      setCurrentPage(page);
      
      if (!currentUser) {
        console.log("No authenticated user, skipping Firebase update");
        return;
      }
      
      const userId = currentUser.uid;
      const currentPageRef: DatabaseReference = ref(database, `users/${userId}/currentPage`);
      await set(currentPageRef, page);
      console.log("Current page successfully updated in Firebase");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Error updating current page:", errorMessage);
      // Don't throw the error, just log it
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
    error,
    currentUser,
    isAuthenticated,
    setIsAuthenticated,
    signOutUser,
    currentPage,
    updateCurrentPage
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}; 