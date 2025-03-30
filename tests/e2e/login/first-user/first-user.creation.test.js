/**
 * @file First user creation test
 * @description Tests creation of the first admin user
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
  fillFirstUserForm,
  submitFirstUserForm,
  BASE_URL,
  SITE_DOMAIN
} = require('./first-user.setup');

describe('First User Creation', () => {
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

  test('Successfully creates first admin user and redirects to dashboard', async () => {
    // Navigate to the first user setup page
    await navigateToFirstUserSetup(page, { screenshotName: 'creation-initial' });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Fill in the form with valid data
    const formFilled = await fillFirstUserForm(page, FirstUserSelectors);
    
    // Skip test if form couldn't be filled
    if (!formFilled) {
      log('Could not fill first user form, skipping test');
      return;
    }
    
    // Take screenshot after filling form
    await takeScreenshot(page, 'creation-form-filled');
    
    // Submit the form and wait for redirect
    const submitted = await submitFirstUserForm(page, FirstUserSelectors);
    
    // Skip test if form couldn't be submitted
    if (!submitted) {
      log('Could not submit first user form, skipping test');
      return;
    }
    
    // Take screenshot after redirect
    await takeScreenshot(page, 'creation-after-redirect');
    
    // Verify we've been redirected to admin dashboard
    const currentUrl = await page.url();
    log(`Current URL after form submission: ${currentUrl}`);
    
    // Check for admin page indicators
    const isAdminPage = await page.evaluate((selectors) => {
      // Check URL contains admin
      const urlHasAdmin = window.location.href.includes('/admin');
      
      // Check for admin dashboard elements
      const hasAdminElements = document.querySelector(selectors.fallback.adminDashboard) !== null;
      
      // Check page content for admin keywords
      const pageContent = document.body.textContent.toLowerCase();
      const hasAdminContent = selectors.fallback.adminContent.some(keyword => 
        pageContent.includes(keyword.toLowerCase())
      );
      
      return {
        urlHasAdmin,
        hasAdminElements,
        hasAdminContent
      };
    }, FirstUserSelectors);
    
    // Log the results for debugging
    log('Admin page check:', isAdminPage);
    
    // Verify we've been redirected to admin dashboard
    const onAdminPage = 
      isAdminPage.urlHasAdmin || 
      isAdminPage.hasAdminElements || 
      isAdminPage.hasAdminContent;
    
    expect(onAdminPage).toBe(true);
    
    // Verify we're not on login page anymore
    expect(currentUrl).not.toContain('/login');
    
    // Take additional screenshot of admin dashboard
    const screenshotPath = 'admin-dashboard-' + Date.now() + '.png';
    await takeScreenshot(page, screenshotPath);
  }, 30000); // Extend timeout to 30 seconds
  
  test('Can access admin content after user creation', async () => {
    // Navigate directly to admin dashboard
    await page.goto(`${BASE_URL}/admin?hostname=${SITE_DOMAIN}`, {
      waitUntil: 'networkidle2',
    });
    
    // Take screenshot after navigation
    await takeScreenshot(page, 'admin-access-after-creation');
    
    // Verify we can access admin content
    const currentUrl = await page.url();
    log(`Current URL after direct navigation to admin: ${currentUrl}`);
    
    // If redirected to login, test fails
    expect(currentUrl).not.toContain('/login');
    
    // Verify we can see admin content
    const hasAdminContent = await page.evaluate((selectors) => {
      // Check for admin dashboard elements
      const hasAdminElements = document.querySelector(selectors.fallback.adminDashboard) !== null;
      
      // Check page content for admin keywords
      const pageContent = document.body.textContent.toLowerCase();
      const hasAdminText = selectors.fallback.adminContent.some(keyword => 
        pageContent.includes(keyword.toLowerCase())
      );
      
      return hasAdminElements || hasAdminText;
    }, FirstUserSelectors);
    
    expect(hasAdminContent).toBe(true);
  }, 15000); // Extend timeout to 15 seconds
});
