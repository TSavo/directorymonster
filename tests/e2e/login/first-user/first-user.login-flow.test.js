/**
 * @file First user login flow test
 * @description Tests login flow after first user creation
 * @jest-environment node
 */

const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../../utils/test-utils');
const { waitForClientHydration } = require('../../utils/hydration-utils');
const FirstUserSelectors = require('./first-user.selectors');
const LoginSelectors = require('../login.selectors');
const { 
  setupFirstUserTest, 
  teardownFirstUserTest,
  BASE_URL,
  SITE_DOMAIN
} = require('./first-user.setup');

describe('Login Flow After First User Creation', () => {
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

  test('Shows normal login form after first user is created', async () => {
    // Navigate to the login page
    await page.goto(`${BASE_URL}/login?hostname=${SITE_DOMAIN}`, {
      waitUntil: 'networkidle2',
    });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'login-flow-after-creation');

    // Check if we're on login page instead of setup page
    const pageState = await page.evaluate((selectors) => {
      // Look for login page indicators
      const hasLoginPageElement = document.querySelector(selectors.login.page) !== null;
      const hasLoginFormElement = document.querySelector(selectors.login.form) !== null;
      
      // Check page content for login keywords
      const pageContent = document.body.textContent;
      const hasLoginContent = 
        pageContent.includes('DirectoryMonster Admin') ||
        pageContent.includes('Login') ||
        pageContent.includes('Sign in') ||
        pageContent.includes('Admin Login') ||
        pageContent.includes('Zero-Knowledge Proof Authentication');
      
      // Check for setup page indicators
      const hasSetupPageElement = document.querySelector(selectors.firstUser.page) !== null;
      
      // Check page content for setup keywords
      const hasSetupContent = selectors.firstUser.fallback.setupContent.some(keyword => 
        pageContent.includes(keyword)
      );
      
      return {
        // Login indicators
        hasLoginPageElement,
        hasLoginFormElement,
        hasLoginContent,
        
        // Setup indicators
        hasSetupPageElement,
        hasSetupContent
      };
    }, { 
      login: LoginSelectors, 
      firstUser: FirstUserSelectors 
    });
    
    // Log the results for debugging
    log('Page state check:', pageState);
    
    // Verify we're on login page not setup page
    // At least one login indicator should be true
    const onLoginPage = 
      pageState.hasLoginPageElement || 
      pageState.hasLoginFormElement || 
      pageState.hasLoginContent;
    
    // No setup indicator should be true
    const notOnSetupPage = 
      !pageState.hasSetupPageElement && 
      !pageState.hasSetupContent;
    
    expect(onLoginPage).toBe(true);
    expect(notOnSetupPage).toBe(true);
    
    // Verify login form fields
    const hasLoginFields = await page.evaluate((selectors) => {
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
        hasUsernameInput,
        hasPasswordInput,
        hasSubmitButton
      };
    }, LoginSelectors);
    
    // Log the results for debugging
    log('Login fields check:', hasLoginFields);
    
    // Verify login form fields are present
    expect(hasLoginFields.hasUsernameInput).toBe(true);
    expect(hasLoginFields.hasPasswordInput).toBe(true);
    expect(hasLoginFields.hasSubmitButton).toBe(true);
  });
});
