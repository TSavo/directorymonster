/**
 * Check all debug endpoints to get a quick overview of the application state
 */

const fetch = require('node-fetch');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const endpoints = [
  '/api/healthcheck',
  '/api/healthcheck/redis',
  '/api/debug/env',
  '/api/debug/redis-data',
  '/api/debug/module-paths',
  '/api/debug/site-resolver?domain=fishing-gear.mydirectory.com',
  '/api/debug/site-resolver?domain=hiking-gear.mydirectory.com',
  '/api/debug/auth-bypass'
];

// Function to check an endpoint
async function checkEndpoint(url) {
  console.log(`\n=== Checking ${url} ===`);
  
  try {
    const response = await fetch(`${BASE_URL}${url}`);
    const statusCode = response.status;
    console.log(`Status: ${statusCode}`);
    
    if (statusCode === 200) {
      const contentType = response.headers.get('content-type');
      console.log(`Content-Type: ${contentType}`);
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Response:');
        console.log(JSON.stringify(data, null, 2));
      } else {
        const text = await response.text();
        console.log('Response (first 200 chars):');
        console.log(text.substring(0, 200));
      }
    } else {
      console.log('Error response:', await response.text());
    }
  } catch (error) {
    console.error('Failed to fetch:', error.message);
  }
}

// Check all endpoints
async function checkAllEndpoints() {
  console.log('Starting debug endpoint checks...');
  console.log(`Base URL: ${BASE_URL}`);
  
  for (const endpoint of endpoints) {
    await checkEndpoint(endpoint);
  }
  
  console.log('\nAll endpoint checks complete.');
}

// Run the checks
checkAllEndpoints();
