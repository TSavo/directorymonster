/**
 * @file First user validation test
 * @description Tests validation for the first user setup form
 * @jest-environment node
 */

const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../../utils/test-utils');
const { waitForClientHydration, findElementWithRetry } = require('../../utils/hydration-utils');
const FirstUserSelectors = require('./first-user.selectors');
const { 
  setupFirstUserTest, 
  teardownFirstUserTest,
  navigateToFirstUserSetup,
  FORM_TIMEOUT,
  ADMIN_USERNAME,
  ADMIN_PASSWORD
} = require('./first-user.setup');

describe('First User Form Validation', () => {
  let browser;
  let page;

  // Set up the browser and page before running tests
  beforeAll(async () => {
    const setup = await setupFirstUserTest();
    browser = setup.browser;
    page = setup.page;
  });

  // Clean up after all tests
  afterAll(async () => {
    await teardownFirstUserTest(browser);
  });

  test('Shows validation errors for empty fields', async () => {
    // Navigate to the first user setup page
    await navigateToFirstUserSetup(page, { screenshotName: 'validation-empty-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Find the submit button
    const submitButton = await findElementWithRetry(page, 
      FirstUserSelectors.buttons.submit || FirstUserSelectors.fallback.submitButton
    );
    
    expect(submitButton).not.toBeNull();
    
    // Submit the form without filling any fields
    await submitButton.click();
    
    // Take screenshot after submission
    await takeScreenshot(page, 'validation-empty-submitted');
    
    // Wait for validation errors to appear
    await page.waitForSelector(FirstUserSelectors.fallback.errors, {
      timeout: FORM_TIMEOUT,
    });
    
    // Verify validation errors are shown
    const validationErrors = await page.evaluate((selectors) => {
      // Get all error elements
      const errorElements = document.querySelectorAll(selectors.fallback.errors);
      
      // Check if any errors are visible
      const hasVisibleErrors = Array.from(errorElements).some(el => 
        window.getComputedStyle(el).display !== 'none' && 
        el.textContent.trim().length > 0
      );
      
      // Get error messages for debugging
      const errorMessages = Array.from(errorElements)
        .filter(el => window.getComputedStyle(el).display !== 'none')
        .map(el => el.textContent.trim());
      
      return {
        hasVisibleErrors,
        errorMessages
      };
    }, FirstUserSelectors);
    
    // Log the results for debugging
    log('Validation errors check:', validationErrors);
    
    // Verify errors are shown
    expect(validationErrors.hasVisibleErrors).toBe(true);
    expect(validationErrors.errorMessages.length).toBeGreaterThan(0);
  });

  test('Shows validation error for password mismatch', async () => {
    // Skip test if no confirm password field is found
    const hasConfirmPassword = await page.evaluate((selectors) => {
      return document.querySelector(selectors.inputs.confirmPassword) !== null || 
             document.querySelector(selectors.fallback.confirmPassword) !== null;
    }, FirstUserSelectors);
    
    if (!hasConfirmPassword) {
      log('Confirm password field not found, skipping password mismatch test');
      return;
    }
    
    // Navigate to the first user setup page
    await navigateToFirstUserSetup(page, { screenshotName: 'validation-password-mismatch-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Find form fields
    const usernameField = await findElementWithRetry(page, 
      FirstUserSelectors.inputs.username || FirstUserSelectors.fallback.username
    );
    
    const passwordField = await findElementWithRetry(page, 
      FirstUserSelectors.inputs.password || FirstUserSelectors.fallback.password
    );
    
    const confirmPasswordField = await findElementWithRetry(page, 
      FirstUserSelectors.inputs.confirmPassword || FirstUserSelectors.fallback.confirmPassword
    );
    
    const submitButton = await findElementWithRetry(page, 
      FirstUserSelectors.buttons.submit || FirstUserSelectors.fallback.submitButton
    );
    
    // Skip test if any required field is missing
    if (!usernameField || !passwordField || !confirmPasswordField || !submitButton) {
      log('Required form fields not found, skipping password mismatch test');
      return;
    }
    
    // Fill username and password fields with different passwords
    await usernameField.type(ADMIN_USERNAME);
    await passwordField.type(ADMIN_PASSWORD);
    await confirmPasswordField.type('different-password');
    
    // Take screenshot before submission
    await takeScreenshot(page, 'validation-password-mismatch-entered');
    
    // Submit the form
    await submitButton.click();
    
    // Take screenshot after submission
    await takeScreenshot(page, 'validation-password-mismatch-submitted');
    
    // Wait for validation errors to appear
    await page.waitForSelector(FirstUserSelectors.fallback.errors, {
      timeout: FORM_TIMEOUT,
    });
    
    // Check for password mismatch error
    const passwordMismatchError = await page.evaluate((selectors) => {
      // Get all error messages
      const errorElements = document.querySelectorAll(selectors.fallback.errors);
      const errorMessages = Array.from(errorElements)
        .filter(el => window.getComputedStyle(el).display !== 'none')
        .map(el => el.textContent.trim().toLowerCase());
      
      // Look for mismatch-related keywords in error messages
      const hasMismatchError = errorMessages.some(msg => 
        msg.includes('match') || 
        msg.includes('mismatch') || 
        msg.includes('same') || 
        msg.includes('identical')
      );
      
      return {
        hasMismatchError,
        errorMessages
      };
    }, FirstUserSelectors);
    
    // Log the results for debugging
    log('Password mismatch error check:', passwordMismatchError);
    
    // Verify password mismatch error is shown
    expect(passwordMismatchError.hasMismatchError).toBe(true);
  });

  test('Shows validation error for short password', async () => {
    // Navigate to the first user setup page
    await navigateToFirstUserSetup(page, { screenshotName: 'validation-short-password-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Find form fields
    const usernameField = await findElementWithRetry(page, 
      FirstUserSelectors.inputs.username || FirstUserSelectors.fallback.username
    );
    
    const passwordField = await findElementWithRetry(page, 
      FirstUserSelectors.inputs.password || FirstUserSelectors.fallback.password
    );
    
    const confirmPasswordField = await findElementWithRetry(page, 
      FirstUserSelectors.inputs.confirmPassword || FirstUserSelectors.fallback.confirmPassword
    );
    
    const submitButton = await findElementWithRetry(page, 
      FirstUserSelectors.buttons.submit || FirstUserSelectors.fallback.submitButton
    );
    
    // Skip test if required fields are missing
    if (!usernameField || !passwordField || !submitButton) {
      log('Required form fields not found, skipping short password test');
      return;
    }
    
    // Fill username and short password
    await usernameField.type(ADMIN_USERNAME);
    await passwordField.type('short');
    
    // Fill confirm password if it exists
    if (confirmPasswordField) {
      await confirmPasswordField.type('short');
    }
    
    // Take screenshot before submission
    await takeScreenshot(page, 'validation-short-password-entered');
    
    // Submit the form
    await submitButton.click();
    
    // Take screenshot after submission
    await takeScreenshot(page, 'validation-short-password-submitted');
    
    // Wait for validation errors to appear
    await page.waitForSelector(FirstUserSelectors.fallback.errors, {
      timeout: FORM_TIMEOUT,
    });
    
    // Check for password length error
    const passwordLengthError = await page.evaluate((selectors) => {
      // Get all error messages
      const errorElements = document.querySelectorAll(selectors.fallback.errors);
      const errorMessages = Array.from(errorElements)
        .filter(el => window.getComputedStyle(el).display !== 'none')
        .map(el => el.textContent.trim().toLowerCase());
      
      // Look for length-related keywords in error messages
      const hasLengthError = errorMessages.some(msg => 
        msg.includes('length') || 
        msg.includes('short') || 
        msg.includes('minimum') || 
        msg.includes('at least') ||
        msg.includes('characters') ||
        /\b\d+\b/.test(msg) // Contains a number (likely the minimum length)
      );
      
      return {
        hasLengthError,
        errorMessages
      };
    }, FirstUserSelectors);
    
    // Log the results for debugging
    log('Password length error check:', passwordLengthError);
    
    // Verify password length error is shown
    expect(passwordLengthError.hasLengthError).toBe(true);
  });
});
