/**
 * @file E2E tests for the login page functionality
 * @description Tests the user login flow using Puppeteer
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';  // Updated to use port 3000
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';
const TEST_USER = process.env.TEST_USER || 'testuser';  // Updated to match username field 
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123456';  // Ensure 8+ characters

// Test timeouts
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const LOGIN_TIMEOUT = 10000; // 10 seconds
const NAVIGATION_TIMEOUT = 5000; // 5 seconds

/**
 * Login page E2E test suite
 */
describe('Login Page', () => {
  /** @type {puppeteer.Browser} */
  let browser;
  
  /** @type {puppeteer.Page} */
  let page;

  // Set up the browser and page before running tests
  beforeAll(async () => {
    browser = await puppeteer.launch({
      // Run in non-headless mode during development for debugging
      headless: process.env.NODE_ENV === 'production',
      // Enable Chrome DevTools for debugging
      devtools: process.env.NODE_ENV !== 'production',
      // Additional arguments for better testing performance
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
      ],
    });
    
    page = await browser.newPage();
    
    // Configure reasonable timeouts
    page.setDefaultTimeout(DEFAULT_TIMEOUT);
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

    // Set viewport to a standard desktop size
    await page.setViewport({
      width: 1280,
      height: 800,
    });

    // Add hostname parameter for multitenancy testing
    await page.setCookie({
      name: 'hostname',
      value: SITE_DOMAIN,
      domain: 'localhost',
      path: '/',
    });

    // Enable console logging for debugging
    page.on('console', (message) => {
      if (process.env.DEBUG) {
        console.log(`Browser console: ${message.text()}`);
      }
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('Login page renders correctly', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Verify the page title
    const title = await page.title();
    expect(title).toContain('Login');

    // Verify essential login page elements
    // Using the actual component IDs from ZKPLogin
    const usernameInputExists = await page.$('#username') !== null;
    const passwordInputExists = await page.$('#password') !== null;
    const loginButtonExists = await page.$('button[type="submit"]') !== null;
    const rememberMeExists = await page.$('#remember-me') !== null;

    expect(usernameInputExists).toBe(true);
    expect(passwordInputExists).toBe(true);
    expect(loginButtonExists).toBe(true);
    expect(rememberMeExists).toBe(true);

    // Verify login form accessibility
    const usernameInputLabel = await page.$eval('#username', (el) => el.getAttribute('aria-label') || el.id);
    const passwordInputLabel = await page.$eval('#password', (el) => el.getAttribute('aria-label') || el.id);
    
    expect(usernameInputLabel).toBeTruthy();
    expect(passwordInputLabel).toBeTruthy();
    
    // Verify the app has the correct heading
    const heading = await page.$eval('h2', (el) => el.textContent);
    expect(heading).toContain('Admin Login');
  });

  test('Displays validation errors for empty fields', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Submit the form without entering any data
    await page.click('button[type="submit"]');

    // Wait for validation errors to appear
    // The component uses p.text-red-600 for error messages
    await page.waitForSelector('p.text-red-600, [aria-invalid="true"]', {
      timeout: LOGIN_TIMEOUT,
    });

    // Verify validation error messages are shown
    const usernameErrorVisible = await page.evaluate(() => {
      // Look for error message paragraphs that follow username input
      const usernameField = document.querySelector('#username');
      if (!usernameField) return false;
      const errorElement = usernameField.parentElement.querySelector('p.text-red-600, p.text-sm.text-red-600');
      return errorElement ? window.getComputedStyle(errorElement).display !== 'none' : false;
    });

    const passwordErrorVisible = await page.evaluate(() => {
      // Look for error message paragraphs that follow password input
      const passwordField = document.querySelector('#password');
      if (!passwordField) return false;
      const errorElement = passwordField.parentElement.querySelector('p.text-red-600, p.text-sm.text-red-600');
      return errorElement ? window.getComputedStyle(errorElement).display !== 'none' : false;
    });

    expect(usernameErrorVisible || await page.$('#username[aria-invalid="true"]') !== null).toBe(true);
    expect(passwordErrorVisible || await page.$('#password[aria-invalid="true"]') !== null).toBe(true);
    
    // Verify the error message content
    const errorText = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('p.text-red-600, p.text-sm.text-red-600'));
      return errors.map(e => e.textContent);
    });
    
    expect(errorText.some(text => text.includes('required'))).toBe(true);
  });

  test('Displays validation error for short password', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Enter username and short password
    await page.type('#username', 'testuser');
    await page.type('#password', 'short');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for password validation error to appear
    await page.waitForSelector('p.text-red-600, p.text-sm.text-red-600, #password[aria-invalid="true"]', {
      timeout: LOGIN_TIMEOUT,
    });

    // Verify password validation error message is shown
    const passwordErrorVisible = await page.evaluate(() => {
      const passwordField = document.querySelector('#password');
      if (!passwordField) return false;
      const errorElement = passwordField.parentElement.querySelector('p.text-red-600, p.text-sm.text-red-600');
      return errorElement ? window.getComputedStyle(errorElement).display !== 'none' : false;
    });

    expect(passwordErrorVisible || await page.$('#password[aria-invalid="true"]') !== null).toBe(true);
    
    // Verify the error message mentions password length
    const errorText = await page.evaluate(() => {
      const errors = Array.from(document.querySelectorAll('p.text-red-600, p.text-sm.text-red-600'));
      return errors.map(e => e.textContent);
    });
    
    expect(errorText.some(text => text.includes('8'))).toBe(true); // The error should mention 8 characters minimum
  });

  test('Displays error message for incorrect credentials', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Enter valid format but incorrect credentials
    await page.type('#username', 'incorrect-user');
    await page.type('#password', 'password123456');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the error message to appear
    // ZKPLogin component uses a div with bg-red-100 class for error messages
    await page.waitForSelector('div.bg-red-100, div.text-red-700, .mb-4.p-3.bg-red-100', {
      timeout: LOGIN_TIMEOUT,
    });

    // Verify authentication error message is shown
    const errorMessageVisible = await page.evaluate(() => {
      const errorElement = document.querySelector('div.bg-red-100, div.text-red-700, .mb-4.p-3.bg-red-100');
      return errorElement ? window.getComputedStyle(errorElement).display !== 'none' : false;
    });

    expect(errorMessageVisible).toBe(true);
    
    // Verify the error message content
    const errorText = await page.evaluate(() => {
      const errorElement = document.querySelector('div.bg-red-100, div.text-red-700, .mb-4.p-3.bg-red-100');
      return errorElement ? errorElement.textContent : '';
    });
    
    expect(errorText).toBeTruthy();
    // The error message should indicate authentication failure
    expect(errorText.includes('Invalid') || errorText.includes('failed') || errorText.includes('incorrect')).toBe(true);
  });

  test('Successfully logs in with valid credentials', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Enter valid credentials
    await page.type('#username', TEST_USER);
    await page.type('#password', TEST_PASSWORD);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for successful login and redirection
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: LOGIN_TIMEOUT,
    });

    // Verify we've been redirected to a protected page (likely dashboard)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');
    
    // Verify user is logged in (check for user-specific elements)
    // The admin layout typically includes a user menu or profile element
    const userMenuExists = await page.$('[data-testid="user-menu"], .user-profile, .avatar, .admin-header') !== null;
    expect(userMenuExists).toBe(true);

    // Verify access to protected content
    const dashboardHeading = await page.$eval('h1, .page-title', (el) => el.textContent);
    expect(dashboardHeading).toContain('Dashboard');
  });

  test('Shows password reset link and functionality', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Check for forgot password button - in the component it's a button with "Forgot password?" text
    const forgotPasswordExists = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      return elements.some(el => el.textContent && el.textContent.includes('Forgot password'));
    });
    expect(forgotPasswordExists).toBe(true);

    // Click the forgot password button
    // This needs to handle both button and link cases
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a'));
        const forgotPasswordElement = elements.find(el => el.textContent && el.textContent.includes('Forgot password'));
        if (forgotPasswordElement) forgotPasswordElement.click();
      })
    ]);

    // Verify we're on the password reset page
    const currentUrl = page.url();
    expect(currentUrl).toContain('forgot-password');

    // Verify the reset form has an input field
    // Might be username instead of email in our implementation
    const formInputExists = await page.$('input[type="text"], input[type="email"]') !== null;
    expect(formInputExists).toBe(true);
  });

  test('Logout functionality works correctly', async () => {
    // First login
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    await page.type('#username', TEST_USER);
    await page.type('#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for successful login and redirection
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: LOGIN_TIMEOUT,
    });

    // Find and click the logout button/link in the admin interface
    // Looking at both header and sidebar
    try {
      // First check if there's a user menu that needs to be clicked
      const userMenuSelector = '[data-testid="user-menu"], .user-menu, .avatar, button:has(.avatar)';
      const hasUserMenu = await page.$(userMenuSelector) !== null;
      
      if (hasUserMenu) {
        // Click user menu to expand it
        await page.click(userMenuSelector);
        await page.waitForTimeout(500); // Wait for menu animation
      }
      
      // Look for logout button/link with various strategies
      let logoutFound = false;
      
      // Strategy 1: Try common logout selectors
      const logoutSelectors = [
        '[data-testid="logout-button"]',
        '.logout-button',
        'button.logout',
        'a.logout'
      ];
      
      for (const selector of logoutSelectors) {
        const exists = await page.$(selector) !== null;
        if (exists) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click(selector)
          ]);
          logoutFound = true;
          break;
        }
      }
      
      // Strategy 2: Try text content-based approach
      if (!logoutFound) {
        const logoutButtonExists = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button, a'));
          const logoutButton = buttons.find(el => 
            el.textContent && 
            (el.textContent.toLowerCase().includes('log out') || 
             el.textContent.toLowerCase().includes('logout') ||
             el.textContent.toLowerCase().includes('sign out'))
          );
          
          if (logoutButton) {
            // Mark the button for easy selection
            logoutButton.setAttribute('data-test-logout', 'true');
            return true;
          }
          return false;
        });
        
        if (logoutButtonExists) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('[data-test-logout="true"]')
          ]);
          logoutFound = true;
        }
      }
      
      // Strategy 3: Check admin sidebar for last item (often logout)
      if (!logoutFound) {
        const sidebarLogoutExists = await page.evaluate(() => {
          const sidebarLinks = document.querySelectorAll('.admin-sidebar a, .sidebar a');
          const lastLink = sidebarLinks[sidebarLinks.length - 1];
          
          if (lastLink) {
            lastLink.setAttribute('data-test-sidebar-last', 'true');
            return true;
          }
          return false;
        });
        
        if (sidebarLogoutExists) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            page.click('[data-test-sidebar-last="true"]')
          ]);
          logoutFound = true;
        }
      }
      
      if (!logoutFound) {
        throw new Error('Could not find logout button/link');
      }
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }

    // Verify we've been logged out and redirected
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');

    // Navigate to a protected page and verify we're redirected back to login
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
    });
    
    const redirectedUrl = page.url();
    expect(redirectedUrl).toContain('/login');
  });

  test('Remember me functionality works correctly', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Check if remember me checkbox exists (using the ID from the component)
    const rememberMeExists = await page.$('#remember-me') !== null;
    
    if (rememberMeExists) {
      // Enter valid credentials
      await page.type('#username', TEST_USER);
      await page.type('#password', TEST_PASSWORD);
      
      // Check the remember me checkbox
      await page.click('#remember-me');
      
      // Submit the form
      await page.click('button[type="submit"]');
      
      // Wait for successful login and redirection
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: LOGIN_TIMEOUT,
      });
      
      // Close the browser to clear session cookies, but keep persistent cookies
      await browser.close();
      
      // Relaunch the browser
      browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'production',
        devtools: process.env.NODE_ENV !== 'production',
        args: [
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-sandbox',
        ],
      });
      
      page = await browser.newPage();
      
      // Configure timeouts
      page.setDefaultTimeout(DEFAULT_TIMEOUT);
      page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
      
      // Set viewport
      await page.setViewport({
        width: 1280,
        height: 800,
      });
      
      // Add hostname parameter for multitenancy testing (re-add after browser restart)
      await page.setCookie({
        name: 'hostname',
        value: SITE_DOMAIN,
        domain: 'localhost',
        path: '/',
      });
      
      // Navigate to a protected page
      await page.goto(`${BASE_URL}/admin`, {
        waitUntil: 'networkidle2',
      });
      
      // If remember me works, we should be on the admin page
      // If not, we'll be redirected to login
      const currentUrl = page.url();
      
      // Verify we're still authenticated
      expect(currentUrl).toContain('/admin');
      expect(currentUrl).not.toContain('/login');
    } else {
      // Skip this test if remember me functionality doesn't exist
      console.log('Remember me functionality not found, skipping test');
    }
  });
});
