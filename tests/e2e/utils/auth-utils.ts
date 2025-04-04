/**
 * @file Authentication utilities for E2E testing
 * Supports both Playwright and Puppeteer testing frameworks
 */

// Playwright imports
import { Page as PlaywrightPage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Puppeteer imports
import { Page as PuppeteerPage } from 'puppeteer';
import {
  BASE_URL,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
  log,
  wait,
  takeScreenshot
} from './test-utils';

// Import the localStorage values
let authValues: { authToken: string; username: string; expiresAt: number } | null = null;

try {
  // Try to import the localStorage.js file
  authValues = require('../localStorage');
} catch (error) {
  console.log('localStorage.js not found. Run "npm run setup:test-env" to create it.');
}

interface AuthConfig {
  token: string;
  username: string;
  expiresAt: number;
}

/**
 * Load authentication configuration from the auth-config.json file
 * @returns The authentication configuration or null if not found
 */
export function loadAuthConfig(): AuthConfig | null {
  // First try to use the imported localStorage values
  if (authValues) {
    // Check if the token has expired
    if (authValues.expiresAt < Date.now()) {
      console.log('Auth token has expired. Run "npm run setup:test-env" to refresh it.');
      return null;
    }

    return {
      token: authValues.authToken,
      username: authValues.username,
      expiresAt: authValues.expiresAt
    };
  }

  // Fall back to reading from the JSON file
  try {
    const configPath = path.join(__dirname, '..', 'auth-config.json');

    if (!fs.existsSync(configPath)) {
      console.log('Auth config file not found. Run "npm run setup:test-env" to create it.');
      return null;
    }

    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent) as AuthConfig;

    // Check if the token has expired
    if (config.expiresAt < Date.now()) {
      console.log('Auth token has expired. Run "npm run setup:test-env" to refresh it.');
      return null;
    }

    return config;
  } catch (error) {
    console.error('Error loading auth config:', error);
    return null;
  }
}

/**
 * Set the authentication token in localStorage for the page
 * @param page Playwright page object
 * @returns True if authentication was successful, false otherwise
 */
export async function authenticatePage(page: PlaywrightPage): Promise<boolean> {
  const config = loadAuthConfig();

  if (!config) {
    return false;
  }

  // Navigate to the site first (required to set localStorage)
  await page.goto('/');

  // Set the authentication token in localStorage
  await page.evaluate((token) => {
    localStorage.setItem('authToken', token);
  }, config.token);

  console.log(`Authenticated as ${config.username}`);
  return true;
}

/**
 * Check if the user is logged in (Playwright version)
 * @param page Playwright page object
 * @returns True if the user is logged in, false otherwise
 */
export async function isLoggedInPlaywright(page: PlaywrightPage): Promise<boolean> {
  return await page.evaluate(() => {
    return !!localStorage.getItem('authToken');
  });
}

/**
 * Log out the current user (Playwright version)
 * @param page Playwright page object
 */
export async function logoutPlaywright(page: PlaywrightPage): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('authToken');
  });
  console.log('Logged out');
}

/**
 * Logs in as an admin user (Puppeteer version)
 * @param page - Puppeteer page object
 * @returns Whether login was successful
 */
export async function loginAsAdmin(page: PuppeteerPage): Promise<boolean> {
  log('Starting admin login process');

  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, 'login-page');

    // Check if we're on first user setup instead
    const isFirstUserSetup = await page.evaluate(() => {
      return document.body.textContent?.includes('First User Setup') ||
             document.body.textContent?.includes('Create Admin') || false;
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
      log(`Navigation timeout: ${(error as Error).message}`, 'warning');
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
    log(`Error during login: ${(error as Error).message}`, 'error');
    await takeScreenshot(page, 'login-error');
    return false;
  }
}

/**
 * Handles the first user setup process (Puppeteer version)
 * @param page - Puppeteer page object
 * @returns Whether setup was successful
 */
export async function handleFirstUserSetup(page: PuppeteerPage): Promise<boolean> {
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
      log(`Navigation timeout after setup: ${(error as Error).message}`, 'warning');
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
    log(`Error during first user setup: ${(error as Error).message}`, 'error');
    await takeScreenshot(page, 'setup-error');
    return false;
  }
}

/**
 * Checks if user is currently logged in (Puppeteer version)
 * @param page - Puppeteer page object
 * @returns Whether user is logged in
 */
export async function isLoggedIn(page: PuppeteerPage | PlaywrightPage): Promise<boolean> {
  // Determine which type of page we're dealing with
  if ('evaluate' in page && typeof page.evaluate === 'function') {
    // For Playwright pages
    if ('url' in page && typeof page.url === 'function' && page.url().includes('playwright')) {
      return isLoggedInPlaywright(page as PlaywrightPage);
    }

    // For Puppeteer pages
    return page.evaluate(() => {
      // Check for admin layout/elements
      const hasAdminNav = document.querySelector('#admin-nav, .admin-sidebar, .admin-header') !== null;
      // Check for login elements (negative check)
      const hasLoginForm = document.querySelector('form#login-form, input[name="password"]') !== null;

      return hasAdminNav && !hasLoginForm;
    });
  }

  return false;
}
