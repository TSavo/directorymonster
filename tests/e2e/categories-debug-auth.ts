/**
 * @file Authentication utilities for categories debug tests
 */

import { Page } from 'puppeteer';
import { logDebug, BASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD } from './categories-debug-setup';
import { analyzePageComprehensively } from './categories-debug-utils';

/**
 * Helper function for login
 * @param page - Puppeteer page object
 * @returns Whether login was successful
 */
export async function login(page: Page): Promise<boolean> {
  logDebug('Starting login process...');
  
  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/admin/login`);
    await analyzePageComprehensively(page, 'login-page');
    
    // Check if we need to do first-user setup
    const isFirstUserSetup = await page.evaluate(() => {
      return document.body.textContent?.includes('First User') || 
             document.body.textContent?.includes('Create Admin') || false;
    });
    
    if (isFirstUserSetup) {
      logDebug('First user setup detected, creating admin user');
      
      // Fill out first user form
      await page.type('input[name="username"]', ADMIN_USERNAME);
      await page.type('input[name="password"]', ADMIN_PASSWORD);
      
      // Look for confirm password
      const confirmPasswordField = await page.$('input[name="confirmPassword"]');
      if (confirmPasswordField) {
        await confirmPasswordField.type(ADMIN_PASSWORD);
      }
      
      // Take intermediate screenshot
      await analyzePageComprehensively(page, 'first-user-form-filled');
      
      // Submit form
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      logDebug('First user setup submitted');
    } else {
      logDebug('Regular login form detected');
      
      // Fill login form
      await page.type('input[name="username"]', ADMIN_USERNAME);
      await page.type('input[name="password"]', ADMIN_PASSWORD);
      
      // Take intermediate screenshot
      await analyzePageComprehensively(page, 'login-form-filled');
      
      // Submit form
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      logDebug('Login form submitted');
    }
    
    // Check if login was successful
    const currentUrl = await page.url();
    const isLoggedIn = currentUrl.includes('/admin');
    
    if (isLoggedIn) {
      logDebug('Login successful! Now on admin page');
      await analyzePageComprehensively(page, 'after-login-success');
      return true;
    } else {
      logDebug('Login failed, still on login page');
      await analyzePageComprehensively(page, 'login-failure');
      
      // Try to identify why login failed
      const errorMessages = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.text-red-500, .text-red-600, .error, .alert');
        return Array.from(errorElements).map(el => el.textContent?.trim() || '');
      });
      
      if (errorMessages.length > 0) {
        logDebug('Login error messages:');
        errorMessages.forEach(msg => logDebug(` - ${msg}`));
      }
      
      return false;
    }
  } catch (error) {
    logDebug(`Login error: ${(error as Error).message}`);
    await analyzePageComprehensively(page, 'login-error');
    return false;
  }
}
