#!/usr/bin/env node

/**
 * Script to check Redis connection and functionality
 * This is useful for debugging Redis issues during test setup
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Helper function to save logs
function saveLog(filename, content) {
  const logPath = path.join(LOGS_DIR, filename);
  fs.writeFileSync(logPath, typeof content === 'string' ? content : JSON.stringify(content, null, 2));
  console.log(`Log saved to: ${logPath}`);
}

// Function to check Redis connection health
async function checkRedisHealth() {
  try {
    console.log('\n=== CHECKING REDIS HEALTH ===');
    const response = await axios.get(`${API_BASE_URL}/healthcheck/redis`);
    console.log(`Redis health check status: ${response.data.status}`);
    
    if (response.data.status === 'ok') {
      console.log('Redis connection is healthy');
    } else {
      console.warn(`Redis connection issue: ${response.data.message}`);
      console.log('The application should fall back to in-memory Redis');
    }
    
    saveLog('redis-health-check.json', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking Redis health:', error.message);
    saveLog('redis-health-error.txt', `Error: ${error.message}`);
    return { status: 'error', message: error.message, timestamp: Date.now() };
  }
}

// Function to list all sites in Redis
async function listAllSites() {
  try {
    console.log('\n=== LISTING ALL SITES ===');
    const response = await axios.get(`${API_BASE_URL}/sites`);
    console.log(`Found ${response.data.length} sites:`);
    
    // Display summary of each site
    response.data.forEach((site, index) => {
      console.log(`${index + 1}. ${site.name} (${site.slug}) - Domain: ${site.domain || 'Not set'}`);
    });
    
    saveLog('all-sites.json', response.data);
    return response.data;
  } catch (error) {
    console.error('Error listing sites:', error.message);
    saveLog('list-sites-error.txt', `Error: ${error.message}`);
    return [];
  }
}

// Function to check all Redis keys
async function checkRedisKeys() {
  try {
    console.log('\n=== CHECKING REDIS KEYS ===');
    // This is a debug endpoint that needs to be added to the API
    const response = await axios.get(`${API_BASE_URL}/debug/redis-keys`);
    console.log(`Found ${response.data.length} Redis keys`);
    
    // Group keys by prefix for readability
    const keysByPrefix = {};
    response.data.forEach(key => {
      const prefix = key.split(':')[0];
      if (!keysByPrefix[prefix]) {
        keysByPrefix[prefix] = [];
      }
      keysByPrefix[prefix].push(key);
    });
    
    // Display summary of keys by prefix
    Object.entries(keysByPrefix).forEach(([prefix, keys]) => {
      console.log(`- ${prefix}: ${keys.length} keys`);
      // If there are fewer than 10 keys, display them all
      if (keys.length < 10) {
        keys.forEach(key => console.log(`  - ${key}`));
      } else {
        // Otherwise display first 5 and last 5
        console.log(`  - ${keys.slice(0, 5).join('\n  - ')}`);
        console.log(`  - ... ${keys.length - 10} more ...`);
        console.log(`  - ${keys.slice(-5).join('\n  - ')}`);
      }
    });
    
    saveLog('redis-keys.json', keysByPrefix);
    return keysByPrefix;
  } catch (error) {
    // If the debug endpoint doesn't exist, this will fail
    console.warn('Error checking Redis keys:', error.message);
    console.log('This is normal if the debug endpoint is not implemented.');
    saveLog('redis-keys-error.txt', `Error: ${error.message}`);
    return null;
  }
}

// Function to test Redis write and read
async function testRedisWriteRead() {
  try {
    console.log('\n=== TESTING REDIS WRITE AND READ ===');
    
    const testKey = 'test:connection:' + Date.now();
    const testValue = { message: 'Redis test value', timestamp: Date.now() };
    
    // Write test value
    console.log(`Writing test key: ${testKey}`);
    await axios.post(`${API_BASE_URL}/debug/redis-set`, {
      key: testKey,
      value: testValue
    });
    
    // Read test value
    console.log(`Reading test key: ${testKey}`);
    const response = await axios.get(`${API_BASE_URL}/debug/redis-get?key=${testKey}`);
    
    // Verify value was correctly stored and retrieved
    const success = JSON.stringify(response.data) === JSON.stringify(testValue);
    console.log(`Redis write/read test: ${success ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Written: ${JSON.stringify(testValue)}`);
    console.log(`Read: ${JSON.stringify(response.data)}`);
    
    // Delete test key
    console.log(`Deleting test key: ${testKey}`);
    await axios.delete(`${API_BASE_URL}/debug/redis-del?key=${testKey}`);
    
    return success;
  } catch (error) {
    // If the debug endpoints don't exist, this will fail
    console.warn('Error testing Redis write/read:', error.message);
    console.log('This is normal if the debug endpoints are not implemented.');
    saveLog('redis-test-error.txt', `Error: ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log('=== REDIS CONNECTION CHECK TOOL ===');
  
  // Check Redis health
  const healthResult = await checkRedisHealth();
  
  // List all sites
  const sites = await listAllSites();
  
  // Try to check Redis keys (requires debug endpoint)
  try {
    await checkRedisKeys();
  } catch (error) {
    // Ignore errors as this endpoint may not exist
  }
  
  // Try to test Redis write/read (requires debug endpoints)
  try {
    await testRedisWriteRead();
  } catch (error) {
    // Ignore errors as these endpoints may not exist
  }
  
  // Final summary
  console.log('\n=== REDIS CONNECTION CHECK SUMMARY ===');
  console.log(`Redis status: ${healthResult.status.toUpperCase()}`);
  console.log(`Sites found: ${sites.length}`);
  console.log(`Required sites:`);
  const requiredSites = ['fishing-gear', 'hiking-gear'];
  requiredSites.forEach(slug => {
    const exists = sites.some(site => site.slug === slug);
    console.log(`- ${slug}: ${exists ? 'FOUND' : 'MISSING'}`);
  });
  
  // Final assessment
  const allRequiredSitesExist = requiredSites.every(slug => 
    sites.some(site => site.slug === slug)
  );
  
  console.log(`\nOverall status: ${allRequiredSitesExist ? 'READY FOR TESTING' : 'NOT READY - MISSING REQUIRED SITES'}`);
  
  if (!allRequiredSitesExist) {
    console.log('Run the seed script to create required sites: npm run seed');
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('An error occurred:', error.message);
    process.exit(1);
  });
}

module.exports = { checkRedisHealth, listAllSites };
