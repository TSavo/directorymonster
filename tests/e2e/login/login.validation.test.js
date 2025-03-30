/**
 * @file Login validation test
 * @description Tests form validation for the login page
 * @jest-environment node
 */

const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../utils/test-utils');
const { waitForClientHydration, waitForFormElement, findElementWithRetry } = require('../utils/hydration-utils');
const LoginSelectors = require('./login.selectors');
const { 
  setupLoginTest, 
  teardownLoginTest,
  navigateToLoginPage,
  LOGIN_TIMEOUT
} = require('./login.setup');

describe('Login Form Validation', () => {
  let browser;
  let page;

  // Set up the browser and page before running tests
  beforeAll(async () => {
    const setup = await setupLoginTest();
    browser = setup.browser;
    page = setup.page;
  });

  // Clean up after all tests
  afterAll(async () => {
    await teardownLoginTest(browser);
  });

  test('Displays validation errors for empty fields', async () => {
    // Navigate to the login page
    await navigateToLoginPage(page, { screenshotName: 'validation-empty-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Wait for form elements to be ready
    const submitButton = await findElementWithRetry(page, 
      LoginSelectors.buttons.submit || LoginSelectors.fallback.submitButton
    );
    
    expect(submitButton).not.toBeNull();
    
    // Submit the form without entering any data
    await submitButton.click();
    
    // Take screenshot after submission
    await takeScreenshot(page, 'validation-empty-submitted');
    
    // Wait for validation errors to appear using any of the possible error selectors
    const errorSelector = `${LoginSelectors.errors.usernameError}, ${LoginSelectors.errors.passwordError}, ${LoginSelectors.fallback.errors}`;
    
    await page.waitForSelector(errorSelector, {
      timeout: LOGIN_TIMEOUT,
    });
    
    // Verify validation errors are shown
    const validationErrors = await page.evaluate((selectors) => {
      // Look for username error
      const usernameField = document.querySelector(selectors.inputs.username) || 
                           document.querySelector(selectors.fallback.username);
      
      let usernameErrorVisible = false;
      if (usernameField) {
        // Check for error in parent element's children
        const parent = usernameField.parentElement;
        const errorElement = parent ? parent.querySelector(selectors.errors.usernameError) || 
                                    parent.querySelector(selectors.fallback.errors) : null;
        usernameErrorVisible = errorElement ? 
          window.getComputedStyle(errorElement).display !== 'none' && 
          errorElement.textContent.trim().length > 0 : false;
      }
      
      // Look for password error
      const passwordField = document.querySelector(selectors.inputs.password) ||
                           document.querySelector(selectors.fallback.password);
      
      let passwordErrorVisible = false;
      if (passwordField) {
        // Check for error in parent element's children
        const parent = passwordField.parentElement;
        const errorElement = parent ? parent.querySelector(selectors.errors.passwordError) || 
                                    parent.querySelector(selectors.fallback.errors) : null;
        passwordErrorVisible = errorElement ? 
          window.getComputedStyle(errorElement).display !== 'none' && 
          errorElement.textContent.trim().length > 0 : false;
      }
      
      // Get all error messages
      const allErrors = Array.from(document.querySelectorAll(selectors.fallback.errors))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0);
      
      return {
        usernameErrorVisible,
        passwordErrorVisible,
        errorMessages: allErrors
      };
    }, LoginSelectors);
    
    // Log the results for debugging
    log('Validation errors check:', validationErrors);
    
    // Verify validation errors are shown
    expect(validationErrors.usernameErrorVisible || validationErrors.passwordErrorVisible).toBe(true);
    expect(validationErrors.errorMessages.length).toBeGreaterThan(0);
    
    // Verify the error messages mention "required" or similar
    const hasRequiredError = validationErrors.errorMessages.some(msg => 
      msg.toLowerCase().includes('required') || 
      msg.toLowerCase().includes('empty') ||
      msg.toLowerCase().includes('enter') ||
      msg.toLowerCase().includes('needed')
    );
    
    expect(hasRequiredError).toBe(true);
  });

  test('Displays validation error for short password', async () => {
    // Navigate to the login page
    await navigateToLoginPage(page, { screenshotName: 'validation-short-pw-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Wait for form elements to be ready
    const usernameInput = await findElementWithRetry(page, 
      LoginSelectors.inputs.username || LoginSelectors.fallback.username
    );
    
    const passwordInput = await findElementWithRetry(page, 
      LoginSelectors.inputs.password || LoginSelectors.fallback.password
    );
    
    const submitButton = await findElementWithRetry(page, 
      LoginSelectors.buttons.submit || LoginSelectors.fallback.submitButton
    );
    
    expect(usernameInput).not.toBeNull();
    expect(passwordInput).not.toBeNull();
    expect(submitButton).not.toBeNull();
    
    // Enter valid username and short password
    await usernameInput.type('testuser');
    await passwordInput.type('short');
    
    // Take screenshot after entering data
    await takeScreenshot(page, 'validation-short-pw-entered');
    
    // Submit the form
    await submitButton.click();
    
    // Take screenshot after submission
    await takeScreenshot(page, 'validation-short-pw-submitted');
    
    // Wait for validation error to appear
    const errorSelector = LoginSelectors.errors.passwordError || LoginSelectors.fallback.errors;
    
    await page.waitForSelector(errorSelector, {
      timeout: LOGIN_TIMEOUT,
    });
    
    // Verify password validation error is shown
    const passwordValidation = await page.evaluate((selectors) => {
      // Get all error messages
      const allErrors = Array.from(document.querySelectorAll(selectors.fallback.errors))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0);
      
      // Look specifically for password-related errors
      const passwordField = document.querySelector(selectors.inputs.password) ||
                           document.querySelector(selectors.fallback.password);
      
      let passwordErrorVisible = false;
      let passwordErrorText = '';
      
      if (passwordField) {
        // Check for error in parent element's children
        const parent = passwordField.parentElement;
        const errorElement = parent ? parent.querySelector(selectors.errors.passwordError) || 
                                    parent.querySelector(selectors.fallback.errors) : null;
        if (errorElement) {
          passwordErrorVisible = window.getComputedStyle(errorElement).display !== 'none';
          passwordErrorText = errorElement.textContent.trim();
        }
      }
      
      return {
        passwordErrorVisible,
        passwordErrorText,
        allErrors
      };
    }, LoginSelectors);
    
    // Log the results for debugging
    log('Password validation check:', passwordValidation);
    
    // Verify password validation error is shown
    expect(passwordValidation.passwordErrorVisible).toBe(true);
    
    // Verify the error message mentions minimum length or similar
    const hasLengthError = passwordValidation.passwordErrorText.includes('8') ||
                          passwordValidation.allErrors.some(msg => 
                            msg.includes('8') || 
                            msg.toLowerCase().includes('length') ||
                            msg.toLowerCase().includes('minimum') ||
                            msg.toLowerCase().includes('short')
                          );
    
    expect(hasLengthError).toBe(true);
  });
});
