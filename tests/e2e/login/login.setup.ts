/**
 * @file Login test setup
 * @description Common setup and teardown functions for login tests
 */

import * as puppeteer from 'puppeteer';
import { takeScreenshot, log } from '../utils/test-utils';
import { LoginCredentials, LoginOptions, LoginSelectors, LoginTestSetup, NavigateOptions } from './types/login.types';

// Configuration
export const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
export const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123456';

// Test timeouts
export const DEFAULT_TIMEOUT = 45000; // 45 seconds
export const LOGIN_TIMEOUT = 15000; // 15 seconds
export const NAVIGATION_TIMEOUT = 30000; // 30 seconds

/**
 * Sets up the browser and page for login tests
 * @returns Object containing browser and page
 */
export async function setupLoginTest(): Promise<LoginTestSetup> {
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
 * @param browser Browser instance to close
 */
export async function teardownLoginTest(browser: puppeteer.Browser): Promise<void> {
  if (browser) {
    await browser.close();
  }
}

/**
 * Navigates to the login page
 * @param page Page to use for navigation
 * @param options Additional options
 */
export async function navigateToLoginPage(page: puppeteer.Page, options: NavigateOptions = {}): Promise<void> {
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
 * @param page Page to use for login
 * @param credentials Credentials to use for login
 * @param options Additional options
 * @returns Whether login was successful
 */
export async function attemptLogin(
  page: puppeteer.Page, 
  credentials: LoginCredentials = {}, 
  options: LoginOptions = {}
): Promise<boolean> {
  const { 
    username = ADMIN_USERNAME, 
    password = ADMIN_PASSWORD,
    takeScreenshots = true
  } = credentials;
  
  const { 
    selectors,
    screenshotPrefix = 'login-attempt'
  } = options;
  
  if (!selectors) {
    throw new Error('Selectors are required for login attempt');
  }
  
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
