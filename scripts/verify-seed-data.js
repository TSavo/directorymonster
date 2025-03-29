#!/usr/bin/env node

/**
 * Verifies seed data in Redis database and creates it if missing
 * This script is designed to be run before E2E tests to ensure test data exists
 */

const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const REQUIRED_SITES = [
  {
    name: 'Fishing Gear Reviews',
    slug: 'fishing-gear',
    domain: 'fishinggearreviews.com'
  },
  {
    name: 'Hiking Gear Directory',
    slug: 'hiking-gear',
    domain: 'hikinggearreviews.com'
  }
];

// Create logs directory if it doesn't exist
const LOGS_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Helper function to save logs
function saveLog(filename, content) {
  const logPath = path.join(LOGS_DIR, filename);
  fs.writeFileSync(logPath, content);
  console.log(`Log saved to: ${logPath}`);
}

// Function to check API health
async function checkApiHealth() {
  try {
    console.log('Checking API health...');
    const response = await axios.get(`${API_BASE_URL}/healthcheck`);
    console.log(`API Health Check: ${response.status === 200 ? 'OK' : 'FAILED'}`);
    return response.status === 200;
  } catch (error) {
    console.error('API Health Check failed:', error.message);
    return false;
  }
}

// Function to check Redis connection
async function checkRedisConnection() {
  try {
    console.log('Checking Redis connection...');
    const response = await axios.get(`${API_BASE_URL}/healthcheck/redis`);
    const isHealthy = response.data.status === 'ok';
    console.log(`Redis Health Check: ${isHealthy ? 'OK' : 'FAILED'}`);
    
    if (!isHealthy) {
      console.log('Redis Error:', response.data.message);
    }
    
    return isHealthy;
  } catch (error) {
    console.error('Redis Health Check failed:', error.message);
    return false;
  }
}

// Function to check if a site exists
async function checkSiteExists(slug) {
  try {
    console.log(`Checking if site '${slug}' exists...`);
    const response = await axios.get(`${API_BASE_URL}/sites`);
    const sites = response.data;
    
    // Save all sites info for debugging
    saveLog('all-sites.json', JSON.stringify(sites, null, 2));
    
    const site = sites.find(s => s.slug === slug);
    const exists = !!site;
    console.log(`Site '${slug}' exists: ${exists ? 'YES' : 'NO'}`);
    
    return { exists, site };
  } catch (error) {
    console.error(`Error checking if site '${slug}' exists:`, error.message);
    return { exists: false, site: null };
  }
}

// Function to run the seed script
async function runSeedScript() {
  return new Promise((resolve, reject) => {
    console.log('Running seed script...');
    
    // Using spawn instead of exec to handle larger outputs
    const seedProcess = spawn('bash', ['scripts/run-seed.sh'], { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    seedProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      process.stdout.write(output);
    });
    
    seedProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      process.stderr.write(output);
    });
    
    seedProcess.on('close', (code) => {
      saveLog('seed-script-stdout.log', stdout);
      saveLog('seed-script-stderr.log', stderr);
      
      if (code === 0) {
        console.log('Seed script completed successfully');
        resolve(true);
      } else {
        console.error(`Seed script failed with code ${code}`);
        resolve(false);  // Resolve with false instead of rejecting to continue execution
      }
    });
  });
}

// Function to verify all required sites exist and create them if missing
async function verifySeedData() {
  console.log('\n=== VERIFYING SEED DATA ===');
  
  // Check API health
  const apiHealthy = await checkApiHealth();
  if (!apiHealthy) {
    console.error('API is not healthy. Please start the server and try again.');
    process.exit(1);
  }
  
  // Check Redis connection
  const redisHealthy = await checkRedisConnection();
  if (!redisHealthy) {
    console.warn('Redis connection issue detected. Using in-memory fallback.');
    // Continue execution as the app should use in-memory fallback
  }
  
  // Check if required sites exist
  const siteResults = [];
  for (const siteInfo of REQUIRED_SITES) {
    const { exists, site } = await checkSiteExists(siteInfo.slug);
    siteResults.push({ required: siteInfo, exists, site });
  }
  
  // If any required site is missing, run the seed script
  const missingSites = siteResults.filter(result => !result.exists);
  if (missingSites.length > 0) {
    console.log(`\n${missingSites.length} required sites are missing. Running seed script...`);
    const seedSuccess = await runSeedScript();
    
    if (seedSuccess) {
      // Verify sites after seeding
      for (const missingSite of missingSites) {
        const { exists, site } = await checkSiteExists(missingSite.required.slug);
        if (exists) {
          console.log(`Site '${missingSite.required.slug}' successfully created.`);
        } else {
          console.error(`Failed to create site '${missingSite.required.slug}' after seeding.`);
        }
      }
    } else {
      console.error('Seed script failed. Tests may not run correctly.');
    }
  } else {
    console.log('\nAll required sites exist. No seeding needed.');
  }
  
  // Final verification
  let allSitesExist = true;
  for (const siteInfo of REQUIRED_SITES) {
    const { exists } = await checkSiteExists(siteInfo.slug);
    if (!exists) {
      allSitesExist = false;
      console.error(`Site '${siteInfo.slug}' is still missing after seeding.`);
    }
  }
  
  console.log(`\n=== SEED DATA VERIFICATION ${allSitesExist ? 'SUCCESSFUL' : 'FAILED'} ===\n`);
  return allSitesExist;
}

// Function to create a site directly via API
async function createSiteDirectly(siteInfo) {
  try {
    console.log(`Creating site '${siteInfo.slug}' directly via API...`);
    const response = await axios.post(`${API_BASE_URL}/sites`, {
      name: siteInfo.name,
      slug: siteInfo.slug,
      domain: siteInfo.domain,
      primaryKeyword: `${siteInfo.slug} directory`,
      metaDescription: `A directory of ${siteInfo.slug} for testing purposes`,
      headerText: siteInfo.name
    });
    
    console.log(`Site '${siteInfo.slug}' created successfully:`, response.data.slug);
    return response.data;
  } catch (error) {
    console.error(`Error creating site '${siteInfo.slug}':`, error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
    }
    return null;
  }
}

// Function to create missing sites directly via API
async function createMissingSites() {
  console.log('\n=== CREATING MISSING SITES DIRECTLY ===');
  
  for (const siteInfo of REQUIRED_SITES) {
    const { exists } = await checkSiteExists(siteInfo.slug);
    if (!exists) {
      const site = await createSiteDirectly(siteInfo);
      if (site) {
        console.log(`Successfully created site: ${site.name} (${site.slug})`);
      } else {
        console.error(`Failed to create site: ${siteInfo.name} (${siteInfo.slug})`);
      }
    } else {
      console.log(`Site '${siteInfo.slug}' already exists. Skipping creation.`);
    }
  }
  
  // Final verification
  let allSitesExist = true;
  for (const siteInfo of REQUIRED_SITES) {
    const { exists } = await checkSiteExists(siteInfo.slug);
    if (!exists) {
      allSitesExist = false;
      console.error(`Site '${siteInfo.slug}' is still missing after direct creation.`);
    }
  }
  
  console.log(`\n=== DIRECT SITE CREATION ${allSitesExist ? 'SUCCESSFUL' : 'FAILED'} ===\n`);
  return allSitesExist;
}

// Main function
async function main() {
  console.log('=== SEED DATA VERIFICATION TOOL ===');
  
  // First try the regular verification and seeding
  const seedResult = await verifySeedData();
  
  // If normal seeding fails, try direct API creation
  if (!seedResult) {
    console.log('\nRegular seeding failed. Attempting direct API creation...');
    const directCreationResult = await createMissingSites();
    
    if (!directCreationResult) {
      console.error('\nFAILED: Could not create all required sites. Tests will likely fail.');
      process.exit(1);
    }
  }
  
  console.log('\nSUCCESS: All required sites are available for testing.');
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('An error occurred:', error.message);
    process.exit(1);
  });
}

module.exports = { verifySeedData, createMissingSites };
