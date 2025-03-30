/**
 * @file Login test setup
 * @description Common setup and teardown functions for login tests
 */

const puppeteer = require('puppeteer');
const { takeScreenshot, log } = require('../utils/test-utils');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123456';

// Test timeouts
const DEFAULT_TIMEOUT = 45000; // 45 seconds
const LOGIN_TIMEOUT = 15000; // 15 seconds
const NAVIGATION_TIMEOUT = 30000; // 30 seconds

/**
 * Sets up the browser and page for login tests
 * @returns {Promise<Object>} Object containing browser and page
 */
async function setupLoginTest() {
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

  // Add hostname parameter for multitenancy using URL parameter
  // This is more reliable than using cookies which can cause Protocol errors

  // Enable console logging for debugging
  page.on('console', (message) => {
    if (process.env.DEBUG) {
      console.log(`Browser console: ${message.text()}`);
    }
  });

  return { browser, page };
}

/**
 * Tears down the browser after login tests
 * @param {puppeteer.Browser} browser Browser instance to close
 */
async function teardownLoginTest(browser) {
  if (browser) {
    await browser.close();
  }
}

/**
 * Navigates to the login page
 * @param {puppeteer.Page} page Page to use for navigation
 * @param {Object} options Additional options
 * @returns {Promise<void>}
 */
async function navigateToLoginPage(page, options = {}) {
  const { screenshotName = 'login-page' } = options;
  
  log('Navigating to login page...');
  
  // Navigate to login page with hostname parameter
  await page.goto(`${BASE_URL}/login?hostname=${SITE_DOMAIN}`, {
    waitUntil: 'networkidle2',
    timeout: LOGIN_TIMEOUT,
  });
  
  // Take screenshot for debugging
  await takeScreenshot(page, screenshotName);
  
  log(`Navigated to: ${await page.url()}`);
}

/**
 * Attempts to login with provided credentials
 * @param {puppeteer.Page} page Page to use for login
 * @param {Object} credentials Credentials to use for login
 * @param {Object} options Additional options
 * @returns {Promise<boolean>} Whether login was successful
 */
async function attemptLogin(page, credentials = {}, options = {}) {
  const { 
    username = ADMIN_USERNAME, 
    password = ADMIN_PASSWORD,
    takeScreenshots = true
  } = credentials;
  
  const { 
    selectors,
    screenshotPrefix = 'login-attempt'
  } = options;
  
  log(`Attempting login with username: ${username}`);
  
  // Navigate to login page
  await navigateToLoginPage(page, { screenshotName: `${screenshotPrefix}-1-page-loaded` });
  
  // Find the form elements
  log('Looking for form elements...');
  const usernameInput = await page.$(selectors.inputs.username || selectors.fallback.username);
  const passwordInput = await page.$(selectors.inputs.password || selectors.fallback.password);
  const submitButton = await page.$(selectors.buttons.submit || selectors.fallback.submitButton);
  
  log('Form elements found:', {
    usernameInput: !!usernameInput,
    passwordInput: !!passwordInput,
    submitButton: !!submitButton
  });
  
  // Skip login if we can't find the form
  if (!usernameInput || !passwordInput || !submitButton) {
    log('Login form elements not found, skipping login attempt');
    return false;
  }
  
  // Enter credentials
  log(`Typing username: ${username}`);
  await usernameInput.type(username);
  log('Typing password: [REDACTED]');
  await passwordInput.type(password);
  
  if (takeScreenshots) {
    await takeScreenshot(page, `${screenshotPrefix}-2-credentials-entered`);
  }
  
  // Submit the form
  log('Submitting login form...');
  await submitButton.click();
  
  // Wait a moment for form submission
  await page.waitForTimeout(200);
  
  if (takeScreenshots) {
    await takeScreenshot(page, `${screenshotPrefix}-3-form-submitted`);
  }
  
  // Check if we were redirected to admin page
  const currentUrl = await page.url();
  const isAdminPage = currentUrl.includes('/admin');
  
  if (isAdminPage) {
    log('Login successful! Redirected to admin page.');
  } else {
    log(`Login may have failed. Current URL: ${currentUrl}`);
  }
  
  return isAdminPage;
}

module.exports = {
  setupLoginTest,
  teardownLoginTest,
  navigateToLoginPage,
  attemptLogin,
  BASE_URL,
  SITE_DOMAIN,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  DEFAULT_TIMEOUT,
  LOGIN_TIMEOUT,
  NAVIGATION_TIMEOUT
};
