/**
 * @file Authentication utilities for E2E testing
 */

const { 
  BASE_URL, 
  ADMIN_USERNAME, 
  ADMIN_PASSWORD, 
  log, 
  wait, 
  takeScreenshot 
} = require('./test-utils');

/**
 * Logs in as an admin user
 * @param {Object} page - Puppeteer page object 
 * @returns {Promise<boolean>} - Whether login was successful
 */
async function loginAsAdmin(page) {
  log('Starting admin login process');
  
  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'login-page');
    
    // Check if we're on first user setup instead
    const isFirstUserSetup = await page.evaluate(() => {
      return document.body.textContent.includes('First User Setup') || 
             document.body.textContent.includes('Create Admin');
    });
    
    if (isFirstUserSetup) {
      log('Detected first user setup page');
      return handleFirstUserSetup(page);
    }
    
    // Standard login
    log(`Logging in with username: ${ADMIN_USERNAME}`);
    await page.type('input[id="username"], input[name="username"]', ADMIN_USERNAME);
    await page.type('input[id="password"], input[name="password"]', ADMIN_PASSWORD);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.waitForSelector('#admin-dashboard, .admin-dashboard', { timeout: 30000 })
      ]);
    } catch (error) {
      log(`Navigation timeout: ${error.message}`, 'warning');
    }
    
    // Verify successful login
    const currentUrl = await page.url();
    const isLoggedIn = currentUrl.includes('/admin');
    
    if (isLoggedIn) {
      log('Successfully logged in as admin');
      await takeScreenshot(page, 'after-login');
      return true;
    } else {
      log('Login failed - not on admin page', 'error');
      await takeScreenshot(page, 'login-failed');
      return false;
    }
  } catch (error) {
    log(`Error during login: ${error.message}`, 'error');
    await takeScreenshot(page, 'login-error');
    return false;
  }
}

/**
 * Handles the first user setup process
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<boolean>} - Whether setup was successful
 */
async function handleFirstUserSetup(page) {
  log('Handling first user setup');
  await takeScreenshot(page, 'first-user-setup');
  
  try {
    // Fill in username/email field
    const usernameField = await page.$('input[id="username"], input[name="username"], input[type="email"]');
    if (usernameField) {
      await usernameField.type(ADMIN_USERNAME);
    } else {
      log('Could not find username field', 'error');
      return false;
    }
    
    // Fill in password field
    const passwordField = await page.$('input[id="password"], input[name="password"], input[type="password"]');
    if (passwordField) {
      await passwordField.type(ADMIN_PASSWORD);
    } else {
      log('Could not find password field', 'error');
      return false;
    }
    
    // Check for confirm password field
    const confirmPasswordField = await page.$('input[id="confirmPassword"], input[name="confirmPassword"], input[type="password"]:nth-of-type(2)');
    if (confirmPasswordField) {
      await confirmPasswordField.type(ADMIN_PASSWORD);
    }
    
    // Fill optional name field if present
    const nameField = await page.$('input[id="name"], input[name="name"]');
    if (nameField) {
      await nameField.type('Admin User');
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.waitForSelector('#admin-dashboard, .admin-dashboard', { timeout: 30000 })
      ]);
    } catch (error) {
      log(`Navigation timeout after setup: ${error.message}`, 'warning');
    }
    
    // Verify successful setup
    const currentUrl = await page.url();
    const isAdmin = currentUrl.includes('/admin');
    
    if (isAdmin) {
      log('First user setup completed successfully');
      await takeScreenshot(page, 'after-setup');
      return true;
    } else {
      log('First user setup failed - not on admin page', 'error');
      await takeScreenshot(page, 'setup-failed');
      return false;
    }
  } catch (error) {
    log(`Error during first user setup: ${error.message}`, 'error');
    await takeScreenshot(page, 'setup-error');
    return false;
  }
}

/**
 * Checks if user is currently logged in
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<boolean>} - Whether user is logged in
 */
async function isLoggedIn(page) {
  return page.evaluate(() => {
    // Check for admin layout/elements
    const hasAdminNav = document.querySelector('#admin-nav, .admin-sidebar, .admin-header') !== null;
    // Check for login elements (negative check)
    const hasLoginForm = document.querySelector('form#login-form, input[name="password"]') !== null;
    
    return hasAdminNav && !hasLoginForm;
  });
}

module.exports = {
  loginAsAdmin,
  handleFirstUserSetup,
  isLoggedIn
};
