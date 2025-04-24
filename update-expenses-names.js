// Script to update people names in Firebase database
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set, connectDatabaseEmulator } = require('firebase/database');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Firebase configuration - using the same config from your app
const firebaseConfig = {
  apiKey: "AIzaSyCLN9CasYSdYoNTu6I0NfYGQmZ4deoOkHE",
  authDomain: "doha-itinerary-a7c89.firebaseapp.com",
  databaseURL: "https://doha-itinerary-a7c89-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "doha-itinerary-a7c89",
  storageBucket: "doha-itinerary-a7c89.appspot.com",
  messagingSenderId: "578484315236",
  appId: "1:578484315236:web:6a4b3ae5d4bccc07e71a03",
  measurementId: "G-C62QFKBQ1C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Shared trip ID from your app
const SHARED_TRIP_ID = 'doha-trip-2025';

// Name mapping - old names to new names (from the actual debug data)
const nameMapping = {
  'Travel Companion 1': 'Amar',
  'Travel Companion 2': 'Wahees',
  // Uncomment if you want to change the first name too
  // 'Ehsaan Ali': 'Ehsaan'
};

async function updateNames() {
  try {
    console.log('Starting name update process...');
    
    // Authenticate with Firebase anonymously
    console.log('Authenticating with Firebase...');
    await signInAnonymously(auth);
    console.log('Authentication successful.');
    
    // The exact path where your expense data is stored
    console.log('Retrieving expenses data...');
    const expensesRef = ref(database, `shared/${SHARED_TRIP_ID}/expensesData`);
    const snapshot = await get(expensesRef);
    
    if (!snapshot.exists()) {
      console.log('No expenses data found at the specified path.');
      return;
    }
    
    const expensesData = snapshot.val();
    console.log('Current people in database:', expensesData.people.map(p => p.name).join(', '));
    
    // Update people names
    const updatedPeople = expensesData.people.map(person => {
      if (nameMapping[person.name]) {
        console.log(`Changing "${person.name}" to "${nameMapping[person.name]}"`);
        return {
          ...person,
          name: nameMapping[person.name]
        };
      }
      return person;
    });
    
    // Update paidBy fields in all expenses
    updatedPeople.forEach(person => {
      if (person.expenses && Array.isArray(person.expenses)) {
        person.expenses.forEach(expense => {
          if (nameMapping[expense.paidBy]) {
            console.log(`Updating paidBy from "${expense.paidBy}" to "${nameMapping[expense.paidBy]}" in expense: ${expense.description}`);
            expense.paidBy = nameMapping[expense.paidBy];
          }
          
          // Update split details if any
          if (expense.split && expense.split.details && Array.isArray(expense.split.details)) {
            expense.split.details.forEach(detail => {
              if (nameMapping[detail.personName]) {
                console.log(`Updating split detail from "${detail.personName}" to "${nameMapping[detail.personName]}"`);
                detail.personName = nameMapping[detail.personName];
              }
            });
          }
        });
      }
    });
    
    // Save updated data back to Firebase
    console.log('Saving updated data to Firebase...');
    const updatedExpensesData = {
      ...expensesData,
      people: updatedPeople
    };
    
    await set(expensesRef, updatedExpensesData);
    console.log('Names successfully updated in the database!');
    console.log('New people names:', updatedPeople.map(p => p.name).join(', '));
    
  } catch (error) {
    console.error('Error updating names:', error);
  }
}

// Run the update function
updateNames().then(() => {
  console.log('Script execution completed.');
  setTimeout(() => process.exit(0), 2000); // Give Firebase time to complete operations
}).catch(err => {
  console.error('Script execution failed:', err);
  process.exit(1);
}); 