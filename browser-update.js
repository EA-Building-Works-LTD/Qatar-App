// You can run this script in your browser's console while the app is open
// To open the console, press F12 or right-click and select "Inspect Element", then go to "Console" tab

// This script will update the names in the Firebase database
async function updateNamesInFirebase() {
  try {
    // Get the Firebase context from the React app
    const app = document.querySelector('#root').__reactContainer.current.child.pendingProps.children._owner.pendingProps.value;
    
    // Make sure we have the context with the expensesData
    if (!app || !app.expensesData || !app.expensesData.people || !Array.isArray(app.expensesData.people)) {
      console.error('Could not find expenses data in the app context');
      return;
    }
    
    // Current data
    const currentPeople = app.expensesData.people;
    console.log('Current people:', currentPeople.map(p => p.name).join(', '));
    
    // Create updated people data
    const updatedPeople = currentPeople.map(person => {
      if (person.name === 'Travel Companion 1') {
        return { ...person, name: 'Amar' };
      } else if (person.name === 'Travel Companion 2') {
        return { ...person, name: 'Wahees' };
      }
      // You can uncomment this line if you want to change Ehsaan Ali to Ehsaan
      // else if (person.name === 'Ehsaan Ali') {
      //   return { ...person, name: 'Ehsaan' };
      // }
      return person;
    });
    
    console.log('Updating people:', updatedPeople.map(p => p.name).join(', '));
    
    // Use the context function to update the data in Firebase
    if (app.updateExpensesData && typeof app.updateExpensesData === 'function') {
      await app.updateExpensesData({
        ...app.expensesData,
        people: updatedPeople
      });
      console.log('Names updated successfully! Refresh the page to see the changes.');
    } else {
      console.error('updateExpensesData function not found in the app context');
    }
  } catch (error) {
    console.error('Error updating names:', error);
  }
}

// Run the function
updateNamesInFirebase(); 