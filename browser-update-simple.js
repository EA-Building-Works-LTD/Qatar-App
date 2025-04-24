/*
 * SIMPLE FIREBASE NAME UPDATE SCRIPT
 * 
 * INSTRUCTIONS:
 * 1. Open your app in the browser (the Expenses page)
 * 2. Press F12 to open Developer Tools (or right-click and select "Inspect")
 * 3. Go to the "Console" tab
 * 4. Copy and paste this ENTIRE script into the console
 * 5. Press Enter to run it
 */

(async function() {
  try {
    // Check if we're on the Expenses page
    if (!document.querySelector('h4')?.textContent.includes('Trip Expenses')) {
      console.error('Please navigate to the Expenses page first!');
      return;
    }
    
    // Find all the elements that display people names
    const nameElements = Array.from(document.querySelectorAll('p, h6, span, div'))
      .filter(el => 
        el.textContent === 'Travel Companion 1' || 
        el.textContent === 'Travel Companion 2'
      );
    
    console.log(`Found ${nameElements.length} elements with companion names to update`);
    
    // Create a map of replacements
    const replacements = {
      'Travel Companion 1': 'Amar',
      'Travel Companion 2': 'Wahees'
    };
    
    // Update the text content of these elements (this is just temporary visual change)
    nameElements.forEach(el => {
      const originalName = el.textContent;
      el.textContent = replacements[originalName] || originalName;
      console.log(`Updated display: "${originalName}" → "${el.textContent}"`);
    });
    
    // Now look for the React props/context
    console.log('Looking for React context...');
    
    // Option 1: Try to find FirebaseContext by looking at React props
    let foundContext = false;
    
    // Find the first element with __reactProps
    const reactElements = Array.from(document.querySelectorAll('*'))
      .filter(el => Object.keys(el).some(key => key.startsWith('__react')));
    
    console.log(`Found ${reactElements.length} React elements to check`);
    
    // Try to find the firebase context or component with expenses data
    for (const el of reactElements) {
      const keys = Object.keys(el).filter(key => key.startsWith('__react'));
      
      for (const key of keys) {
        try {
          // Look for expensesData and updateExpensesData in props or state
          const reactData = el[key];
          
          if (reactData && typeof reactData === 'object') {
            // Look for any object with expensesData
            const findExpensesContext = (obj, path = '') => {
              if (!obj || typeof obj !== 'object') return null;
              
              // Check if this object has the properties we're looking for
              if (obj.expensesData && 
                  obj.expensesData.people && 
                  Array.isArray(obj.expensesData.people) && 
                  typeof obj.updateExpensesData === 'function') {
                return { context: obj, path };
              }
              
              // Don't go too deep to avoid infinite recursion
              if (path.split('.').length > 5) return null;
              
              // Check all properties
              for (const prop in obj) {
                if (prop === 'children' || prop === 'parent' || prop === 'sibling') continue;
                const result = findExpensesContext(obj[prop], `${path}.${prop}`);
                if (result) return result;
              }
              
              return null;
            };
            
            const result = findExpensesContext(reactData);
            
            if (result) {
              console.log(`Found Firebase context at ${result.path}`);
              const context = result.context;
              
              // Log current names
              console.log('Current people:', context.expensesData.people.map(p => p.name).join(', '));
              
              // Create updated data
              const updatedPeople = context.expensesData.people.map(person => {
                if (person.name === 'Travel Companion 1') {
                  return { ...person, name: 'Amar' };
                } else if (person.name === 'Travel Companion 2') {
                  return { ...person, name: 'Wahees' };
                }
                return person;
              });
              
              // Update the data in Firebase
              console.log('Updating people in Firebase:', updatedPeople.map(p => p.name).join(', '));
              await context.updateExpensesData({
                ...context.expensesData,
                people: updatedPeople
              });
              
              console.log('Names updated successfully in Firebase!');
              console.log('Refresh the page to see the changes.');
              foundContext = true;
              break;
            }
          }
        } catch (err) {
          // Ignore errors in accessing React props
        }
      }
      
      if (foundContext) break;
    }
    
    if (!foundContext) {
      console.log('Could not find Firebase context automatically.');
      console.log('As a workaround, the names have been visually updated on the current page.');
      console.log('You will need to manually update the names in your Firebase database.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
})(); 