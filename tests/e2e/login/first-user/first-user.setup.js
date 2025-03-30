/**
 * @file First user test setup
 * @description Setup and utility functions for first user E2E tests
 */

const puppeteer = require('puppeteer');
const { takeScreenshot, log } = require('../../utils/test-utils');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123456';

// Test timeouts
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const NAVIGATION_TIMEOUT = 5000; // 5 seconds
const FORM_TIMEOUT = 10000; // 10 seconds

/**
 * Clears all users from the database
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function clearAllUsers() {
  log('Clearing all users before tests...');
  try {
    const clearResponse = await fetch(`${BASE_URL}/api/test/clear-users`, { 
      method: 'POST' 
    });
    const clearResult = await clearResponse.json();
    log('Clear users response:', clearResult);
    return true;
  } catch (error) {
    log('Failed to clear users:', error.message);
    return false;
  }
}

/**
 * Sets up the browser and page for first user tests
 * @returns {Promise<Object>} Browser and page objects
 */
async function setupFirstUserTest() {
  // Clear all users first to ensure we're in first-user mode
  await clearAllUsers();
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: process.env.NODE_ENV === 'production',
    devtools: process.env.NODE_ENV !== 'production',
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
    ],
  });
  
  // Create new page
  const page = await browser.newPage();
  
  // Configure timeouts
  page.setDefaultTimeout(DEFAULT_TIMEOUT);
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

  // Set viewport to standard desktop size
  await page.setViewport({
    width: 1280,
    height: 800,
  });

  // Enable console logging for debugging
  page.on('console', (message) => {
    if (process.env.DEBUG) {
      log(`Browser console: ${message.text()}`);
    }
  });

  return { browser, page };
}

/**
 * Navigates to the login page in first-user mode
 * @param {puppeteer.Page} page Page to navigate with
 * @param {Object} options Additional options
 * @returns {Promise<void>}
 */
async function navigateToFirstUserSetup(page, options = {}) {
  const { screenshotName = 'first-user-setup' } = options;
  
  log('Navigating to login page in first-user mode...');
  
  // Clear cookies to ensure a fresh session
  await page.deleteCookie();
  
  // Navigate to login page with hostname parameter
  await page.goto(`${BASE_URL}/login?hostname=${SITE_DOMAIN}`, {
    waitUntil: 'networkidle2',
    timeout: 10000,
  });
  
  // Take screenshot for debugging
  await takeScreenshot(page, screenshotName);
  
  log(`Navigated to: ${await page.url()}`);
}

/**
 * Fills out the first user setup form with test data
 * @param {puppeteer.Page} page Page object
 * @param {Object} selectors Selector object
 * @param {Object} userData User data to fill in form
 * @returns {Promise<boolean>} Whether form was filled successfully
 */
async function fillFirstUserForm(page, selectors, userData = {}) {
  const {
    username = ADMIN_USERNAME,
    password = ADMIN_PASSWORD,
    name = 'Admin User',
    email = 'admin@example.com',
    siteName = 'Test Directory'
  } = userData;
  
  log('Filling out first user setup form...');
  
  // Find form fields
  const usernameField = await page.$(selectors.inputs.username || selectors.fallback.username);
  const passwordField = await page.$(selectors.inputs.password || selectors.fallback.password);
  const confirmPasswordField = await page.$(selectors.inputs.confirmPassword || selectors.fallback.confirmPassword);
  const nameField = await page.$(selectors.inputs.name || selectors.fallback.name);
  const emailField = await page.$(selectors.inputs.email || selectors.fallback.email);
  const siteNameField = await page.$(selectors.inputs.siteName || selectors.fallback.siteName);
  
  // Check required fields
  if (!usernameField || !passwordField) {
    log('Required form fields not found, cannot fill form');
    return false;
  }
  
  // Fill required fields
  await usernameField.type(username);
  await passwordField.type(password);
  
  // Fill optional fields if they exist
  if (confirmPasswordField) {
    await confirmPasswordField.type(password);
  }
  
  if (nameField) {
    await nameField.type(name);
  }
  
  if (emailField) {
    await emailField.type(email);
  }
  
  if (siteNameField) {
    await siteNameField.type(siteName);
  }
  
  return true;
}

/**
 * Submits the first user form and waits for redirect
 * @param {puppeteer.Page} page Page object
 * @param {Object} selectors Selector object
 * @returns {Promise<boolean>} Whether submission was successful
 */
async function submitFirstUserForm(page, selectors) {
  log('Submitting first user setup form...');
  
  // Find submit button
  const submitButton = await page.$(selectors.buttons.submit || selectors.fallback.submitButton);
  
  if (!submitButton) {
    log('Submit button not found, cannot submit form');
    return false;
  }
  
  // Take screenshot before submission
  await takeScreenshot(page, 'first-user-before-submit');
  
  // Click submit button
  await submitButton.click();
  
  // Wait for navigation to complete
  try {
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    log('Navigation completed after submission');
  } catch (error) {
    log('Navigation timeout occurred, checking for admin page elements...');
    
    // Alternative: wait for dashboard elements
    try {
      await page.waitForFunction(
        (contentKeywords) => {
          return contentKeywords.some(keyword => document.body.textContent.includes(keyword)) || 
                 window.location.href.includes('/admin');
        },
        { timeout: 30000 },
        selectors.fallback.adminContent
      );
      
      log('Found admin page elements');
    } catch (navError) {
      log('Failed to detect admin page after submission:', navError.message);
      return false;
    }
  }
  
  // Take screenshot after submission
  await takeScreenshot(page, 'first-user-after-submit');
  
  return true;
}

/**
 * Checks if currently on first user setup page
 * @param {puppeteer.Page} page Page to check
 * @param {Object} selectors Selector object
 * @returns {Promise<boolean>} Whether on first user setup page
 */
async function isOnFirstUserSetupPage(page, selectors) {
  return page.evaluate((selectors) => {
    // Check for setup page test id
    if (document.querySelector(selectors.page)) {
      return true;
    }
    
    // Check page content for setup keywords
    const pageContent = document.body.textContent.toLowerCase();
    return selectors.fallback.setupContent.some(keyword => 
      pageContent.toLowerCase().includes(keyword.toLowerCase())
    );
  }, selectors);
}

/**
 * Tears down the test environment
 * @param {puppeteer.Browser} browser Browser to close
 */
async function teardownFirstUserTest(browser) {
  if (browser) {
    await browser.close();
  }
}

module.exports = {
  setupFirstUserTest,
  teardownFirstUserTest,
  navigateToFirstUserSetup,
  fillFirstUserForm,
  submitFirstUserForm,
  isOnFirstUserSetupPage,
  clearAllUsers,
  BASE_URL,
  SITE_DOMAIN,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  DEFAULT_TIMEOUT,
  NAVIGATION_TIMEOUT,
  FORM_TIMEOUT
};
