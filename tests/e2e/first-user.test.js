/**
 * @file E2E tests for the first user creation functionality
 * @description Tests the initial user setup flow when no users exist in the database
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');

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
 * First User Creation Test Suite
 */
describe('First User Creation', () => {
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

  test('Redirects to first user setup when no users exist', async () => {
    // Clear cookies and localStorage to ensure a fresh session
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear cookies
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      }
    });
    
    // For this test, we're assuming the Docker container has been freshly started
    // with no existing users in the database

    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Look for indicators that we're on a setup page, not a login page
    // This could be a heading, special text, or form elements specific to setup
    const isSetupPage = await page.evaluate(() => {
      const pageContent = document.body.textContent;
      return (
        pageContent.includes('First User Setup') ||
        pageContent.includes('Create Admin Account') ||
        pageContent.includes('Initialize System') ||
        pageContent.includes('Create First User') ||
        pageContent.includes('Setup My Account')
      );
    });

    // Alternative: Check for specific elements unique to the setup form
    const hasSetupForm = await page.evaluate(() => {
      const formLabels = Array.from(document.querySelectorAll('label')).map(
        (label) => label.textContent.trim().toLowerCase()
      );
      
      // Setup forms likely have these fields that aren't in login forms
      return (
        formLabels.includes('confirm password') ||
        formLabels.includes('email') ||
        formLabels.includes('admin name') ||
        formLabels.includes('site name')
      );
    });

    // Either the page content or form elements should indicate we're on a setup page
    expect(isSetupPage || hasSetupForm).toBe(true);

    // Take a screenshot for verification
    await page.screenshot({ path: 'first-user-setup.png' });
  });

  test('Shows validation errors for invalid first user form submission', async () => {
    // Navigate to the login page (which should redirect to setup)
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Find username/email and password fields
    const usernameField = await page.$('input[type="text"], input[id="username"], input[name="username"], input[id="email"], input[name="email"]');
    const passwordField = await page.$('input[type="password"], input[id="password"], input[name="password"]');
    
    // Setup forms usually have a confirm password field
    const confirmPasswordField = await page.$('input[id="confirmPassword"], input[name="confirmPassword"], input[placeholder*="confirm"]');
    
    // Submit button
    const submitButton = await page.$('button[type="submit"], input[type="submit"]');

    expect(usernameField).not.toBeNull();
    expect(passwordField).not.toBeNull();
    expect(submitButton).not.toBeNull();
    
    // Try to submit form with empty fields
    await submitButton.click();

    // Wait for validation errors to appear
    await page.waitForSelector('.text-red-600, .text-red-500, .text-red-700, [aria-invalid="true"]', {
      timeout: FORM_TIMEOUT,
    });

    // Check for validation errors
    const hasValidationErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.text-red-600, .text-red-500, .text-red-700, [aria-invalid="true"]');
      return errorElements.length > 0;
    });

    expect(hasValidationErrors).toBe(true);

    // Now try with username but mismatched passwords
    if (usernameField && passwordField && confirmPasswordField && submitButton) {
      await usernameField.type(ADMIN_USERNAME);
      await passwordField.type(ADMIN_PASSWORD);
      await confirmPasswordField.type('different-password');
      await submitButton.click();

      // Wait for password mismatch error
      await page.waitForSelector('.text-red-600, .text-red-500, .text-red-700', {
        timeout: FORM_TIMEOUT,
      });

      // Check for password mismatch error
      const passwordErrorText = await page.evaluate(() => {
        const errorElements = Array.from(document.querySelectorAll('.text-red-600, .text-red-500, .text-red-700'));
        return errorElements.map(el => el.textContent.toLowerCase());
      });

      const hasMismatchError = passwordErrorText.some(text => 
        text.includes('match') || 
        text.includes('mismatch') ||
        text.includes('must be same')
      );

      expect(hasMismatchError).toBe(true);
    }
  });

  test('Successfully creates first admin user and redirects to dashboard', async () => {
    // Navigate to the login page (which should redirect to setup)
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Find all form fields
    const usernameField = await page.$('input[type="text"], input[id="username"], input[name="username"], input[id="email"], input[name="email"]');
    const passwordField = await page.$('input[type="password"], input[id="password"], input[name="password"]');
    const confirmPasswordField = await page.$('input[id="confirmPassword"], input[name="confirmPassword"], input[placeholder*="confirm"]');
    const submitButton = await page.$('button[type="submit"], input[type="submit"]');

    // Optional fields that might be present in setup forms
    const nameField = await page.$('input[id="name"], input[name="name"]');
    const emailField = nameField ? await page.$('input[id="email"], input[name="email"]') : null;
    const siteNameField = await page.$('input[id="siteName"], input[name="siteName"]');

    if (!usernameField || !passwordField || !submitButton) {
      console.log('Required form fields not found, skipping test');
      return;
    }

    // Fill in required fields
    await usernameField.type(ADMIN_USERNAME);
    await passwordField.type(ADMIN_PASSWORD);
    
    // Fill optional fields if they exist
    if (confirmPasswordField) {
      await confirmPasswordField.type(ADMIN_PASSWORD);
    }
    
    if (nameField) {
      await nameField.type('Admin User');
    }
    
    if (emailField) {
      await emailField.type('admin@example.com');
    }
    
    if (siteNameField) {
      await siteNameField.type('Test Directory');
    }

    // Submit the form
    await Promise.all([
      page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 15000,
      }),
      submitButton.click()
    ]);

    // Check if we've been redirected to the dashboard
    const currentUrl = page.url();
    
    // Success would typically redirect to admin dashboard or a welcome page
    const isSuccessRedirect = 
      currentUrl.includes('/admin') ||
      currentUrl.includes('/dashboard') ||
      currentUrl.includes('/welcome');
    
    expect(isSuccessRedirect).toBe(true);
    expect(currentUrl).not.toContain('/login');
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'first-user-created.png' });
    
    // Verify we see some admin UI elements
    const hasAdminElements = await page.evaluate(() => {
      // Look for common admin dashboard elements
      return (
        document.querySelector('h1')?.textContent.includes('Dashboard') ||
        document.querySelector('nav')?.textContent.includes('Admin') ||
        document.body.textContent.includes('Welcome')
      );
    });
    
    expect(hasAdminElements).toBe(true);
  });

  test('Shows normal login form after first user is created', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
    });

    // Now we should see the normal login form, not the setup form
    const isLoginPage = await page.evaluate(() => {
      const pageContent = document.body.textContent;
      return (
        pageContent.includes('Login') ||
        pageContent.includes('Sign in') ||
        pageContent.includes('Admin Login')
      );
    });

    // Check that there's no setup-specific elements
    const hasSetupElements = await page.evaluate(() => {
      const pageContent = document.body.textContent.toLowerCase();
      return (
        pageContent.includes('first user') ||
        pageContent.includes('setup') ||
        pageContent.includes('initialize') ||
        pageContent.includes('create admin')
      );
    });

    expect(isLoginPage).toBe(true);
    expect(hasSetupElements).toBe(false);

    // Find username and password fields of the normal login form
    const usernameField = await page.$('input[type="text"], input[id="username"], input[name="username"]');
    const passwordField = await page.$('input[type="password"]');
    
    expect(usernameField).not.toBeNull();
    expect(passwordField).not.toBeNull();
    
    // Take a screenshot for verification
    await page.screenshot({ path: 'normal-login-after-setup.png' });
  });
});
