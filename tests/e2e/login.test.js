/**
 * @file E2E tests for the login page functionality
 * @description Tests the user login flow using Puppeteer
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';
const TEST_USER = process.env.TEST_USER || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'password123';

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
    const emailInputExists = await page.$('input[type="email"]') !== null;
    const passwordInputExists = await page.$('input[type="password"]') !== null;
    const loginButtonExists = await page.$('button[type="submit"]') !== null;

    expect(emailInputExists).toBe(true);
    expect(passwordInputExists).toBe(true);
    expect(loginButtonExists).toBe(true);

    // Verify login form accessibility
    const emailInputLabel = await page.$eval('input[type="email"]', (el) => el.getAttribute('aria-label') || el.id);
    const passwordInputLabel = await page.$eval('input[type="password"]', (el) => el.getAttribute('aria-label') || el.id);
    
    expect(emailInputLabel).toBeTruthy();
    expect(passwordInputLabel).toBeTruthy();
  });

  test('Displays validation errors for empty fields', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Submit the form without entering any data
    await page.click('button[type="submit"]');

    // Wait for validation errors to appear
    await page.waitForSelector('[data-testid="email-error"], [aria-invalid="true"]', {
      timeout: LOGIN_TIMEOUT,
    });

    // Verify validation error messages are shown
    const emailErrorVisible = await page.evaluate(() => {
      const emailError = document.querySelector('[data-testid="email-error"]');
      return emailError ? window.getComputedStyle(emailError).display !== 'none' : false;
    });

    const passwordErrorVisible = await page.evaluate(() => {
      const passwordError = document.querySelector('[data-testid="password-error"]');
      return passwordError ? window.getComputedStyle(passwordError).display !== 'none' : false;
    });

    expect(emailErrorVisible || await page.$('input[type="email"][aria-invalid="true"]') !== null).toBe(true);
    expect(passwordErrorVisible || await page.$('input[type="password"][aria-invalid="true"]') !== null).toBe(true);
  });

  test('Displays validation error for invalid email format', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Enter invalid email and valid password
    await page.type('input[type="email"]', 'invalid-email');
    await page.type('input[type="password"]', TEST_PASSWORD);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for email validation error to appear
    await page.waitForSelector('[data-testid="email-error"], input[type="email"][aria-invalid="true"]', {
      timeout: LOGIN_TIMEOUT,
    });

    // Verify email validation error message is shown
    const emailErrorVisible = await page.evaluate(() => {
      const emailError = document.querySelector('[data-testid="email-error"]');
      return emailError ? window.getComputedStyle(emailError).display !== 'none' : false;
    });

    expect(emailErrorVisible || await page.$('input[type="email"][aria-invalid="true"]') !== null).toBe(true);
  });

  test('Displays error message for incorrect credentials', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Enter valid email format but incorrect credentials
    await page.type('input[type="email"]', 'incorrect@example.com');
    await page.type('input[type="password"]', 'wrongpassword');

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the error message to appear
    await page.waitForSelector('[data-testid="login-error"], .error-message, [role="alert"]', {
      timeout: LOGIN_TIMEOUT,
    });

    // Verify authentication error message is shown
    const errorMessageVisible = await page.evaluate(() => {
      const errorElement = document.querySelector('[data-testid="login-error"], .error-message, [role="alert"]');
      return errorElement ? window.getComputedStyle(errorElement).display !== 'none' : false;
    });

    expect(errorMessageVisible).toBe(true);
  });

  test('Successfully logs in with valid credentials', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Enter valid credentials
    await page.type('input[type="email"]', TEST_USER);
    await page.type('input[type="password"]', TEST_PASSWORD);

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
    const userMenuExists = await page.$('[data-testid="user-menu"], .user-profile, .avatar') !== null;
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

    // Check for password reset link
    const resetLinkExists = await page.$('a[href*="reset-password"], a:contains("Forgot password")') !== null;
    expect(resetLinkExists).toBe(true);

    // Click the password reset link
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('a[href*="reset-password"], a:contains("Forgot password")')
    ]);

    // Verify we're on the password reset page
    const currentUrl = page.url();
    expect(currentUrl).toContain('reset-password');

    // Verify the reset form has an email input
    const emailInputExists = await page.$('input[type="email"]') !== null;
    expect(emailInputExists).toBe(true);
  });

  test('Logout functionality works correctly', async () => {
    // First login
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    await page.type('input[type="email"]', TEST_USER);
    await page.type('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait for successful login and redirection
    await page.waitForNavigation({
      waitUntil: 'networkidle2',
      timeout: LOGIN_TIMEOUT,
    });

    // Find and click the logout button/link
    // Try different possible selectors for the logout button/link
    const logoutSelectors = [
      '[data-testid="logout-button"]',
      'button:contains("Log out")',
      'a:contains("Log out")',
      '.logout-button',
      '.user-menu button', // If there's a user menu that needs to be clicked first
    ];

    // Try to find a visible logout element
    let logoutElement = null;
    for (const selector of logoutSelectors) {
      try {
        logoutElement = await page.$(selector);
        if (logoutElement) break;
      } catch (e) {
        // Continue to the next selector
      }
    }

    // If we found a user menu that might contain the logout button
    if (!logoutElement && await page.$('[data-testid="user-menu"], .user-profile, .avatar') !== null) {
      // Click the user menu to expand it
      await page.click('[data-testid="user-menu"], .user-profile, .avatar');
      
      // Wait for menu to appear
      await page.waitForTimeout(500);
      
      // Try again with the logout selectors
      for (const selector of logoutSelectors) {
        try {
          logoutElement = await page.$(selector);
          if (logoutElement) break;
        } catch (e) {
          // Continue to the next selector
        }
      }
    }

    // Click the logout element if found
    if (logoutElement) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        logoutElement.click()
      ]);
    } else {
      throw new Error('Could not find logout button/link');
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

    // Check if remember me checkbox exists
    const rememberMeExists = await page.$('input[type="checkbox"][name="remember"], #remember') !== null;
    
    if (rememberMeExists) {
      // Enter valid credentials
      await page.type('input[type="email"]', TEST_USER);
      await page.type('input[type="password"]', TEST_PASSWORD);
      
      // Check the remember me checkbox
      await page.click('input[type="checkbox"][name="remember"], #remember');
      
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
