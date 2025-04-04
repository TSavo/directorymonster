// Authentication test harness for E2E tests
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
 * Check if first user setup is needed
 */
async function checkFirstUserSetup() {
  try {
    console.log('Checking if first user setup is needed...');

    // Check if any users exist
    const response = await api.get('/api/auth/check-users');

    if (response.data && response.data.hasUsers) {
      console.log('Users already exist in the system');
      return false;
    } else {
      console.log('No users found, first user setup is needed');
      return true;
    }
  } catch (error) {
    // If the endpoint doesn't exist or returns an error, we'll assume we need to create a user
    console.log('Error checking users, assuming first user setup is needed');
    return true;
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
    const response = await api.post('/api/auth/setup', {
      username: TEST_USERNAME,
      password: TEST_PASSWORD,
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

      // Save the token to a file for E2E tests to use
      const saved = await saveAuthToken(authToken);
      if (!saved) {
        console.error('❌ Failed to save auth token');
      }

      return true;
    } else {
      console.error('❌ Failed to create first user: No token received');
      return false;
    }
  } catch (error) {
    if (error.response && error.response.data &&
        (error.response.data.error === 'Admin user already exists' ||
         error.response.data.error === 'Users already exist in the system')) {
      console.log('Admin user already exists, proceeding to login');
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
    const response = await api.post('/api/auth/verify', {
      username: TEST_USERNAME,
      proof,
      publicSignals
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

      // Save the token to a file for E2E tests to use
      const saved = await saveAuthToken(authToken);
      if (!saved) {
        console.error('❌ Failed to save auth token');
      }

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

      // Clear any existing users (for testing purposes)
      try {
        await api.post('/api/auth/clear-users', {}, {
          headers: {
            'X-CSRF-Token': generateCsrfToken()
          }
        });
        console.log('Cleared existing users');
      } catch (clearError) {
        console.log('Could not clear users:', clearError.message);
      }

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
 * Save the auth token to a file for E2E tests to use
 */
async function saveAuthToken(token) {
  try {
    const authConfig = {
      token,
      username: TEST_USERNAME,
      expiresAt: Date.now() + 3600000 // 1 hour from now
    };

    // Create the directory if it doesn't exist
    const configDir = path.join(__dirname, '..', 'tests', 'e2e');
    await fs.mkdir(configDir, { recursive: true });

    // Log the directory and current working directory
    console.log(`Config directory: ${configDir}`);
    console.log(`Current working directory: ${process.cwd()}`);

    // Save the auth config to a JSON file
    const configPath = path.join(configDir, 'auth-config.json');
    console.log(`Writing auth config to: ${configPath}`);

    try {
      await fs.writeFile(configPath, JSON.stringify(authConfig, null, 2));
      console.log(`✅ Auth token saved to ${configPath}`);
    } catch (writeError) {
      console.error(`❌ Error writing auth config: ${writeError.message}`);

      // Try writing to a different location
      const altPath = path.join(process.cwd(), 'auth-config.json');
      console.log(`Trying alternate path: ${altPath}`);
      await fs.writeFile(altPath, JSON.stringify(authConfig, null, 2));
      console.log(`✅ Auth token saved to alternate path: ${altPath}`);
    }

    // Also save a copy to localStorage.js for the E2E tests to use
    const localStorageContent = `// Auto-generated file - DO NOT EDIT
// This file is used by the E2E tests to set up authentication

// Set localStorage values for authentication
module.exports = {
  authToken: '${token}',
  username: '${TEST_USERNAME}',
  expiresAt: ${Date.now() + 3600000}
};
`;

    // Save the localStorage.js file
    const localStoragePath = path.join(configDir, 'localStorage.js');
    console.log(`Writing localStorage values to: ${localStoragePath}`);

    try {
      await fs.writeFile(localStoragePath, localStorageContent);
      console.log(`✅ localStorage values saved to ${localStoragePath}`);
    } catch (writeError) {
      console.error(`❌ Error writing localStorage: ${writeError.message}`);

      // Try writing to a different location
      const altPath = path.join(process.cwd(), 'localStorage.js');
      console.log(`Trying alternate path: ${altPath}`);
      await fs.writeFile(altPath, localStorageContent);
      console.log(`✅ localStorage values saved to alternate path: ${altPath}`);
    }

    return true;
  } catch (error) {
    console.error('❌ Error saving auth token:', error.message);
    return false;
  }
}

/**
 * Create a test category
 */
async function createTestCategory() {
  try {
    console.log('Creating test category...');

    // Get all sites
    const sitesResponse = await api.get(`${API_ENDPOINT}/sites`);

    if (!sitesResponse.data || sitesResponse.data.length === 0) {
      console.log('No sites found, creating a test site...');

      // Create a test site
      const siteResponse = await api.post(`${API_ENDPOINT}/sites`, {
        name: 'Test Site',
        slug: 'test-site',
        domain: 'test-site.com',
        primaryKeyword: 'test site',
        metaDescription: 'A test site for E2E testing',
        headerText: 'Test Site',
        defaultLinkAttributes: 'dofollow',
      });

      if (!siteResponse.data) {
        console.error('❌ Failed to create test site');
        return false;
      }

      console.log(`✅ Created test site: ${siteResponse.data.name}`);
      var siteSlug = siteResponse.data.slug;
    } else {
      console.log(`Found ${sitesResponse.data.length} sites`);
      var siteSlug = sitesResponse.data[0].slug;
    }

    // Create a test category
    const categoryResponse = await api.post(`${API_ENDPOINT}/sites/${siteSlug}/categories`, {
      name: 'Test Category',
      slug: 'test-category',
      metaDescription: 'A test category for E2E testing',
    });

    if (categoryResponse.data) {
      console.log(`✅ Created test category: ${categoryResponse.data.name}`);

      // Update the category test to use this slug
      await updateCategoryTest(categoryResponse.data.slug);

      return categoryResponse.data;
    } else {
      console.error('❌ Failed to create test category');
      return false;
    }
  } catch (error) {
    if (error.response?.data?.error === 'A category with this name or slug already exists') {
      console.log('Test category already exists');

      // Try to get the existing category
      try {
        const categoriesResponse = await api.get(`${API_ENDPOINT}/sites/${siteSlug}/categories`);
        const existingCategory = categoriesResponse.data.find(cat => cat.slug === 'test-category');

        if (existingCategory) {
          console.log(`Found existing test category: ${existingCategory.name}`);
          return existingCategory;
        }
      } catch (getError) {
        console.error('❌ Error getting existing category:', getError.message);
      }
    }

    console.error('❌ Error creating test category:', error.response?.data?.error || error.message);
    return false;
  }
}

/**
 * Update the category test file to use the correct category slug
 */
async function updateCategoryTest(categorySlug) {
  try {
    const testFilePath = path.join(__dirname, '..', 'tests', 'e2e', 'category.spec.ts');

    // Read the current test file
    const testFileContent = await fs.readFile(testFilePath, 'utf8');

    // Check if we need to update the category options
    if (testFileContent.includes('const categoryOptions = [')) {
      // Update the category options to include our new category first
      const updatedContent = testFileContent.replace(
        /const categoryOptions = \[(.*?)\]/s,
        `const categoryOptions = ['${categorySlug}', $1]`
      );

      // Write the updated file
      await fs.writeFile(testFilePath, updatedContent);
      console.log(`✅ Updated category test to use '${categorySlug}'`);
    } else {
      console.log('❓ Could not find category options in the test file');
    }
  } catch (error) {
    console.error('❌ Error updating category test:', error.message);
  }
}

/**
 * Main function to set up the test environment
 */
async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment with authentication...');

  try {
    // Check if first user setup is needed
    const needsFirstUser = await checkFirstUserSetup();

    let authenticated = false;

    if (needsFirstUser) {
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

    // Try to create a test category
    try {
      const testCategory = await createTestCategory();

      if (testCategory) {
        console.log('\n✅ Test environment setup completed successfully');
        console.log('\nTest category details:');
        console.log(`- Name: ${testCategory.name}`);
        console.log(`- Slug: ${testCategory.slug}`);
        console.log(`- URL: /${testCategory.slug}`);
      } else {
        console.log('\n✅ Authentication successful, but could not create test category');
        console.log('\nYou can still run the E2E tests, but the category test may fail');
        console.log('Consider creating a test category manually in the admin dashboard');
      }
    } catch (error) {
      console.log('\n✅ Authentication successful, but could not create test category');
      console.log(`Error: ${error.message}`);
      console.log('\nYou can still run the E2E tests, but the category test may fail');
      console.log('Consider creating a test category manually in the admin dashboard');
    }

    console.log('\nYou can now run the E2E tests:');
    console.log('npm run test:e2e:playwright:parallel');

  } catch (error) {
    console.error('❌ Error setting up test environment:', error);
    process.exit(1);
  }
}

// Execute the function
setupTestEnvironment();
