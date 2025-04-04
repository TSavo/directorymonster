// Seed script with proper authentication
const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Base URL for API requests
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const API_ENDPOINT = `${API_BASE_URL}/api`;

// Test user credentials
const TEST_USERNAME = 'testadmin';
const TEST_PASSWORD = 'Test@123456';
const TEST_EMAIL = 'testadmin@example.com';
const TEST_SITE_NAME = 'Test Site';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Store auth token
let authToken = null;

/**
 * Generate a CSRF token
 */
function generateCsrfToken() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

/**
 * Generate a public key from credentials (same as in the ZKP library)
 */
async function generatePublicKey(username, password, salt) {
  // Combine the inputs
  const combined = `${username}:${password}:${salt}`;

  // Create a SHA-256 hash
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Generate a proof for authentication (same as in the ZKP library)
 */
async function generateProof(username, password, salt) {
  // Generate a mock proof (same structure as in the ZKP library)
  const proof = {
    pi_a: [`${username}_proof_a`, "2", "3"],
    pi_b: [["4", "5"], ["6", "7"], ["8", "9"]],
    pi_c: [`${password.length}_proof_c`, "11", "12"],
    protocol: "groth16"
  };

  // Generate public signals
  const publicSignals = [
    await generatePublicKey(username, password, salt),
    `${Date.now()}`
  ];

  return { proof, publicSignals };
}

/**
 * Check if any users exist in the system
 */
async function checkForExistingUsers() {
  try {
    console.log('Checking if any users exist...');

    // Try to access the login page
    const response = await api.get('/login');

    // Check if the response contains the first user setup form
    const hasFirstUserSetup = response.data.includes('Create First Admin User') ||
                             response.data.includes('Create Admin Account');

    if (hasFirstUserSetup) {
      console.log('No users found, first user setup is needed');
      return false;
    } else {
      console.log('Users already exist in the system');
      return true;
    }
  } catch (error) {
    console.error('Error checking for existing users:', error.message);
    return false;
  }
}

/**
 * Create the first admin user
 */
async function createFirstUser() {
  try {
    console.log(`Creating first admin user: ${TEST_USERNAME}...`);

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Create the first user
    // For testing purposes, we'll use a direct approach
    const response = await api.post('/api/auth/register-first-user', {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
      confirmPassword: TEST_PASSWORD,
      email: TEST_EMAIL,
      siteName: TEST_SITE_NAME
    }, {
      headers: {
        'X-CSRF-Token': csrfToken
      }
    });

    if (response.data && response.data.token) {
      console.log('✅ First admin user created successfully');
      authToken = response.data.token;

      // Update the API instance with the auth token
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      api.defaults.headers.common['x-tenant-id'] = 'default';

      return true;
    } else {
      console.error('❌ Failed to create first user: No token received');
      return false;
    }
  } catch (error) {
    if (error.response && error.response.data &&
        (error.response.data.error === 'Users already exist in the system')) {
      console.log('Users already exist, proceeding to login');
      return true;
    }

    console.error('❌ Error creating first user:', error.response?.data?.error || error.message);
    return false;
  }
}

/**
 * Login with the test user credentials
 */
async function login() {
  try {
    console.log(`Logging in as ${TEST_USERNAME}...`);

    // Generate CSRF token
    const csrfToken = generateCsrfToken();

    // Generate salt (in a real system, this would be retrieved from the server)
    const salt = 'test-salt-value';

    // Generate proof for authentication
    const { proof, publicSignals } = await generateProof(TEST_USERNAME, TEST_PASSWORD, salt);

    // Login with the test user
    // For testing purposes, we'll use a direct approach
    const response = await api.post('/api/auth/login', {
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    }, {
      headers: {
        'X-CSRF-Token': csrfToken
      }
    });

    if (response.data && response.data.token) {
      console.log('✅ Login successful');
      authToken = response.data.token;

      // Update the API instance with the auth token
      api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      api.defaults.headers.common['x-tenant-id'] = 'default';

      return true;
    } else {
      console.error('❌ Login failed: No token received');
      return false;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.error || error.message);

    // If the error is related to invalid credentials, try creating a new user
    if (error.response?.status === 401) {
      console.log('Invalid credentials, trying to create a new user...');

      // Try creating the first user again
      const created = await createFirstUser();
      if (created) {
        return true;
      }
    }

    return false;
  }
}

/**
 * Create a site via the API
 */
async function createSite(siteData) {
  try {
    console.log(`Creating site: ${siteData.name}...`);
    const response = await api.post(`${API_ENDPOINT}/sites`, siteData);
    console.log(`✅ Created site: ${response.data.name} (${response.data.slug})`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error === 'Site slug already exists') {
      console.log(`Site ${siteData.slug} already exists, retrieving...`);
      // Try to fetch the existing site
      const sitesResponse = await api.get(`${API_ENDPOINT}/sites`);
      const existingSite = sitesResponse.data.find(site => site.slug === siteData.slug);
      if (existingSite) {
        console.log(`Retrieved existing site: ${existingSite.name}`);
        return existingSite;
      }
    }
    console.error(`❌ Error creating site:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a category via the API
 */
async function createCategory(siteSlug, categoryData) {
  try {
    console.log(`Creating category: ${categoryData.name}...`);
    const response = await api.post(`${API_ENDPOINT}/sites/${siteSlug}/categories`, categoryData);
    console.log(`✅ Created category: ${response.data.name}`);
    return response.data;
  } catch (error) {
    if (error.response?.data?.error === 'A category with this name or slug already exists') {
      console.log(`Category ${categoryData.name} already exists, retrieving...`);
      // Try to fetch all categories and find the one we want
      const categoriesResponse = await api.get(`${API_ENDPOINT}/sites/${siteSlug}/categories`);
      const slug = categoryData.slug || categoryData.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existingCategory = categoriesResponse.data.find(category => category.slug === slug);
      if (existingCategory) {
        console.log(`Retrieved existing category: ${existingCategory.name}`);
        return existingCategory;
      }
    }
    console.error(`❌ Error creating category:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a listing via the API
 */
async function createListing(siteSlug, categoryId, listingData) {
  try {
    console.log(`Creating listing: ${listingData.title}...`);
    // Add the category ID to the listing data
    const listingWithCategory = {
      ...listingData,
      categoryId
    };

    const response = await api.post(`${API_ENDPOINT}/sites/${siteSlug}/listings`, listingWithCategory);
    console.log(`✅ Created listing: ${response.data.title}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error creating listing:`, error.response?.data || error.message);
    throw error;
  }
}

/**
 * Set the default site
 */
async function setDefaultSite(siteSlug) {
  try {
    console.log(`Setting ${siteSlug} as the default site...`);
    await api.post(`${API_ENDPOINT}/config/default-site`, { siteSlug });
    console.log('✅ Default site set successfully');
    return true;
  } catch (error) {
    console.error('❌ Error setting default site:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Main seeding function
 */
async function seedData() {
  console.log('🌱 Starting seeding process with authentication...');

  try {
    // Check if users exist
    const usersExist = await checkForExistingUsers();

    let authenticated = false;

    if (!usersExist) {
      // Create the first user
      const firstUserCreated = await createFirstUser();
      if (firstUserCreated) {
        authenticated = true;
      } else {
        console.error('❌ Failed to create first user, trying to login instead');
      }
    }

    // If not authenticated yet, try to login
    if (!authenticated) {
      const loginSuccessful = await login();
      if (!loginSuccessful) {
        console.error('❌ Failed to login');
        process.exit(1);
      }
    }

    // Create test site
    const site = await createSite({
      name: 'Test Site',
      slug: 'test-site',
      domain: 'test-site.com',
      primaryKeyword: 'test site',
      metaDescription: 'A test site for E2E testing',
      headerText: 'Test Site',
      defaultLinkAttributes: 'dofollow',
    });

    // Create test categories
    const categories = [];

    const testCategory = await createCategory(site.slug, {
      name: 'Test Category',
      slug: 'test-category',
      metaDescription: 'A test category for E2E testing',
    });
    categories.push(testCategory);

    const servicesCategory = await createCategory(site.slug, {
      name: 'Services',
      slug: 'services',
      metaDescription: 'Services category for testing',
    });
    categories.push(servicesCategory);

    const productsCategory = await createCategory(site.slug, {
      name: 'Products',
      slug: 'products',
      metaDescription: 'Products category for testing',
    });
    categories.push(productsCategory);

    // Create test listings
    const listings = [];

    // Create listings in the test category
    for (let i = 1; i <= 5; i++) {
      const listing = await createListing(site.slug, testCategory.id, {
        title: `Test Listing ${i}`,
        description: `This is test listing ${i} for E2E testing`,
        price: 99.99 + i,
        status: 'active',
        featured: i === 1 // Make the first listing featured
      });
      listings.push(listing);
    }

    // Create listings in the services category
    for (let i = 1; i <= 3; i++) {
      const listing = await createListing(site.slug, servicesCategory.id, {
        title: `Service ${i}`,
        description: `This is service listing ${i} for testing`,
        price: 199.99 + i,
        status: 'active',
        featured: i === 1 // Make the first listing featured
      });
      listings.push(listing);
    }

    // Create listings in the products category
    for (let i = 1; i <= 3; i++) {
      const listing = await createListing(site.slug, productsCategory.id, {
        title: `Product ${i}`,
        description: `This is product listing ${i} for testing`,
        price: 299.99 + i,
        status: 'active',
        featured: i === 1 // Make the first listing featured
      });
      listings.push(listing);
    }

    // Set the default site
    await setDefaultSite(site.slug);

    console.log('\n✅ Seeding completed successfully');
    console.log(`Created ${categories.length} categories and ${listings.length} listings`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Execute the seeding function
seedData();
