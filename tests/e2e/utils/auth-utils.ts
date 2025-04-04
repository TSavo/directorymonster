import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

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
export async function authenticatePage(page: Page): Promise<boolean> {
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
 * Check if the user is logged in
 * @param page Playwright page object
 * @returns True if the user is logged in, false otherwise
 */
export async function isLoggedIn(page: Page): Promise<boolean> {
  return await page.evaluate(() => {
    return !!localStorage.getItem('authToken');
  });
}

/**
 * Log out the current user
 * @param page Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('authToken');
  });
  console.log('Logged out');
}
