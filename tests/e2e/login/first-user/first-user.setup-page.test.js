/**
 * @file First user setup page test
 * @description Tests that the first user setup page renders correctly
 * @jest-environment node
 */

const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../../utils/test-utils');
const { waitForClientHydration } = require('../../utils/hydration-utils');
const FirstUserSelectors = require('./first-user.selectors');
const { 
  setupFirstUserTest, 
  teardownFirstUserTest,
  navigateToFirstUserSetup,
  isOnFirstUserSetupPage
} = require('./first-user.setup');

describe('First User Setup Page', () => {
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

  test('Redirects to first user setup when no users exist', async () => {
    // Navigate to the login page
    await navigateToFirstUserSetup(page, { screenshotName: 'setup-page-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'setup-page-hydrated');

    // Verify we're on the first user setup page
    const onSetupPage = await isOnFirstUserSetupPage(page, FirstUserSelectors);
    
    expect(onSetupPage).toBe(true);
    
    // Check for essential form elements
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
      
      return {
        hasForm,
        hasUsernameInput,
        hasPasswordInput,
        hasSubmitButton
      };
    }, FirstUserSelectors);
    
    // Log the results for debugging
    log('Essential elements check:', hasEssentialElements);
    
    // Verify essential elements are present
    expect(hasEssentialElements.hasForm).toBe(true);
    expect(hasEssentialElements.hasUsernameInput).toBe(true);
    expect(hasEssentialElements.hasPasswordInput).toBe(true);
    expect(hasEssentialElements.hasSubmitButton).toBe(true);
    
    // Check for first-user specific elements that distinguish it from regular login
    const hasFirstUserSpecificElements = await page.evaluate((selectors) => {
      // Look for confirm password field - a key indicator of a registration form
      const hasConfirmPassword = document.querySelector(selectors.inputs.confirmPassword) !== null || 
                               document.querySelector(selectors.fallback.confirmPassword) !== null;
      
      // Optional: Check for other first-user specific fields
      const hasNameField = document.querySelector(selectors.inputs.name) !== null || 
                          document.querySelector(selectors.fallback.name) !== null;
      
      const hasEmailField = document.querySelector(selectors.inputs.email) !== null || 
                           document.querySelector(selectors.fallback.email) !== null;
      
      const hasSiteNameField = document.querySelector(selectors.inputs.siteName) !== null || 
                              document.querySelector(selectors.fallback.siteName) !== null;
      
      // Check for setup-specific content in headings
      const hasSetupTextInHeadings = Array.from(document.querySelectorAll('h1, h2, h3')).some(h => 
        selectors.fallback.setupContent.some(keyword => 
          h.textContent.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      return {
        hasConfirmPassword,
        hasNameField,
        hasEmailField,
        hasSiteNameField,
        hasSetupTextInHeadings
      };
    }, FirstUserSelectors);
    
    // Log the results for debugging
    log('First-user specific elements check:', hasFirstUserSpecificElements);
    
    // Verify at least one first-user specific element is present
    // Either confirm password field or setup text in headings should be present
    const hasSpecificElement = 
      hasFirstUserSpecificElements.hasConfirmPassword || 
      hasFirstUserSpecificElements.hasSetupTextInHeadings;
    
    expect(hasSpecificElement).toBe(true);
  });
});
