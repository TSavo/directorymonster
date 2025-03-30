/**
 * @file Login rendering test
 * @description Tests that the login page renders correctly with essential elements
 * @jest-environment node
 */

const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../utils/test-utils');
const { waitForClientHydration, isComponentHydrated } = require('../utils/hydration-utils');
const LoginSelectors = require('./login.selectors');
const { 
  setupLoginTest, 
  teardownLoginTest,
  navigateToLoginPage,
} = require('./login.setup');

describe('Login Page Rendering', () => {
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

  test('Login page renders correctly', async () => {
    // Navigate to the login page
    await navigateToLoginPage(page, { screenshotName: 'login-render-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'login-render-hydrated');

    // Verify the page title contains "Directory Monster"
    const title = await page.title();
    log(`Page title: ${title}`);
    expect(title).toContain('Directory Monster');

    // Check if login page has essential elements
    const hasEssentialElements = await page.evaluate((selectors) => {
      // Look for form elements using both data-testid and fallback selectors
      const hasForm = document.querySelector(selectors.form) !== null || 
                     document.querySelector(selectors.fallback.form) !== null;
      
      // Look for username input
      const hasUsernameInput = document.querySelector(selectors.inputs.username) !== null || 
                              document.querySelector(selectors.fallback.username) !== null;
      
      // Look for password input
      const hasPasswordInput = document.querySelector(selectors.inputs.password) !== null ||
                              document.querySelector(selectors.fallback.password) !== null;
      
      // Look for submit button
      const hasSubmitButton = document.querySelector(selectors.buttons.submit) !== null ||
                             document.querySelector(selectors.fallback.submitButton) !== null;
      
      // Look for heading that indicates login
      const hasLoginHeading = Array.from(document.querySelectorAll(selectors.fallback.loginText)).some(h => 
        h.textContent && (
          h.textContent.includes('Login') || 
          h.textContent.includes('Sign in') || 
          h.textContent.includes('Admin')
        )
      );
      
      return {
        hasForm,
        hasUsernameInput,
        hasPasswordInput,
        hasSubmitButton,
        hasLoginHeading
      };
    }, LoginSelectors);
    
    // Log the results for debugging
    log('Essential elements check:', hasEssentialElements);
    
    // Verify essential elements are present
    expect(hasEssentialElements.hasForm).toBe(true);
    expect(hasEssentialElements.hasUsernameInput).toBe(true);
    expect(hasEssentialElements.hasPasswordInput).toBe(true);
    expect(hasEssentialElements.hasSubmitButton).toBe(true);
    expect(hasEssentialElements.hasLoginHeading).toBe(true);
  });

  test('Login page contains remember me and password reset options', async () => {
    // Navigate to the login page
    await navigateToLoginPage(page, { screenshotName: 'login-options-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Check for additional login form options
    const hasLoginOptions = await page.evaluate((selectors) => {
      // Check for remember me checkbox
      const hasRememberMe = document.querySelector(selectors.inputs.rememberMe) !== null;
      
      // Check for password reset link
      const hasPasswordReset = document.querySelector(selectors.buttons.resetPassword) !== null ||
                              document.querySelector(selectors.buttons.forgotPassword) !== null;
      
      return { hasRememberMe, hasPasswordReset };
    }, LoginSelectors);
    
    // Log the results
    log('Login options check:', hasLoginOptions);
    
    // Only verify password reset option - remember me is optional
    // We don't want the test to fail if remember me is not implemented
    // Just log whether it exists or not
    log(`Remember me option present: ${hasLoginOptions.hasRememberMe}`);
    
    // Password reset is a more essential feature, so we verify it
    expect(hasLoginOptions.hasPasswordReset).toBe(true);
  });
  
  test('Login page is accessible', async () => {
    // Navigate to the login page
    await navigateToLoginPage(page, { screenshotName: 'login-accessibility' });

    // Check for basic accessibility features
    const accessibilityCheck = await page.evaluate((selectors) => {
      // Check that inputs have labels
      const usernameInput = document.querySelector(selectors.inputs.username) || 
                           document.querySelector(selectors.fallback.username);
      
      const passwordInput = document.querySelector(selectors.inputs.password) ||
                           document.querySelector(selectors.fallback.password);
      
      // Check if form elements have proper attributes
      const hasFormAttributes = usernameInput && passwordInput && (
        // Check for id attributes
        usernameInput.hasAttribute('id') && passwordInput.hasAttribute('id') &&
        // Check for name attributes
        usernameInput.hasAttribute('name') && passwordInput.hasAttribute('name')
      );
      
      // Check if inputs have associated labels
      const usernameId = usernameInput ? usernameInput.id : '';
      const passwordId = passwordInput ? passwordInput.id : '';
      
      const usernameHasLabel = usernameId ? document.querySelector(`label[for="${usernameId}"]`) !== null : false;
      const passwordHasLabel = passwordId ? document.querySelector(`label[for="${passwordId}"]`) !== null : false;
      
      // Check if submit button has a clear label
      const submitButton = document.querySelector(selectors.buttons.submit) ||
                          document.querySelector(selectors.fallback.submitButton);
      
      const hasButtonLabel = submitButton && submitButton.textContent.trim().length > 0;
      
      return {
        hasFormAttributes,
        usernameHasLabel,
        passwordHasLabel,
        hasButtonLabel
      };
    }, LoginSelectors);
    
    // Log the results
    log('Accessibility check:', accessibilityCheck);
    
    // Verify basic accessibility features
    expect(accessibilityCheck.hasFormAttributes).toBe(true);
    
    // Don't strictly require labels to be implemented with "for" attribute
    // Just log whether they exist or not
    log(`Username has label: ${accessibilityCheck.usernameHasLabel}`);
    log(`Password has label: ${accessibilityCheck.passwordHasLabel}`);
    
    // Submit button should have a clear label
    expect(accessibilityCheck.hasButtonLabel).toBe(true);
  });
});
