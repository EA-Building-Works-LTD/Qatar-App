// Direct Firebase update script using REST API
const https = require('https');

// Firebase database URL with your project info
const databaseBaseUrl = 'https://doha-itinerary-a7c89-default-rtdb.europe-west1.firebasedatabase.app';

// Potential paths to check
const pathsToCheck = [
  '/shared/doha-trip-2025/expensesData',
  '/expensesData', 
  '/shared/expensesData',
  '/shared/doha-trip-2025',
  '/',
];

// Function to make the HTTP request
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`Status Code: ${res.statusCode}, Body: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Function to check a specific path
async function checkPath(path) {
  const options = {
    method: 'GET',
    hostname: databaseBaseUrl.replace('https://', ''),
    path: `${path}.json`,
  };
  
  try {
    console.log(`Checking path: ${path}`);
    const data = await makeRequest(options);
    console.log(`Found data at path: ${path}`);
    console.log('Data preview:', JSON.stringify(data).substring(0, 100) + '...');
    return { path, data };
  } catch (error) {
    console.log(`No data found at path: ${path}`);
    return null;
  }
}

// Function to explore the database structure
async function exploreDatabase() {
  for (const path of pathsToCheck) {
    const result = await checkPath(path);
    if (result) {
      // If we found data at this path, check if it has the people array
      if (result.data && result.data.people && Array.isArray(result.data.people)) {
        console.log(`Found people array at path: ${path}`);
        return { path, people: result.data.people };
      } 
      // If it's an object, look through all keys for a people array
      else if (result.data && typeof result.data === 'object') {
        for (const key in result.data) {
          if (result.data[key] && result.data[key].people && Array.isArray(result.data[key].people)) {
            console.log(`Found people array at path: ${path}/${key}`);
            return { path: `${path}/${key}`, people: result.data[key].people };
          }
        }
      }
    }
  }
  
  return null;
}

// Function to update the people names
async function updatePeopleNames() {
  try {
    console.log('Exploring database to find the people array...');
    const result = await exploreDatabase();
    
    if (!result) {
      console.error('Could not find people array in the database');
      return;
    }
    
    const { path, people } = result;
    console.log('Current people:', people.map(p => p.name).join(', '));
    
    // Update the names
    const updatedPeople = people.map(person => {
      if (person.name === 'Travel Companion 1') {
        return { ...person, name: 'Amar' };
      } else if (person.name === 'Travel Companion 2') {
        return { ...person, name: 'Wahees' };
      }
      // You can also update Ehsaan Ali to Ehsaan if desired
      // else if (person.name === 'Ehsaan Ali') {
      //   return { ...person, name: 'Ehsaan' };
      // }
      return person;
    });
    
    console.log('Updated people:', updatedPeople.map(p => p.name).join(', '));
    
    // PUT request to update the data
    const peopleUpdatePath = `${path}/people`;
    const putOptions = {
      method: 'PUT',
      hostname: databaseBaseUrl.replace('https://', ''),
      path: `${peopleUpdatePath}.json`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    console.log(`Updating names in Firebase at path: ${peopleUpdatePath}`);
    await makeRequest(putOptions, JSON.stringify(updatedPeople));
    console.log('Names updated successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the update function
updatePeopleNames().then(() => {
  console.log('Script completed.');
}); 