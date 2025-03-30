/**
 * @file Admin Site Management Flow Test
 * @description End-to-end test for site management operations
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, beforeEach, afterAll, expect } = require('@jest/globals');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';

// Test timeouts and constants
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const SCREENSHOT_DIR = './screenshots/site-management';

// Test data for site editing
const EDIT_DETAILS = {
  name: `Updated Site ${Date.now()}`,
  description: 'This site was updated through E2E testing',
  metaTitle: 'Updated Site | DirectoryMonster',
  metaDescription: 'This site description was updated by E2E tests',
};

/**
 * Helper functions
 */
const takeScreenshot = async (page, name) => {
  await page.screenshot({ 
    path: `${SCREENSHOT_DIR}/${name}-${Date.now()}.png`,
    fullPage: true
  });
};

/**
 * Admin Site Management Flow Test
 */
describe('Admin Site Management Flow', () => {
  /** @type {puppeteer.Browser} */
  let browser;
  
  /** @type {puppeteer.Page} */
  let page;

  // Set up the browser and page before running tests
  beforeAll(async () => {
    // Create browser instance
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
      ],
    });
    
    // Create page and configure settings
    page = await browser.newPage();
    page.setDefaultTimeout(DEFAULT_TIMEOUT);
    
    // Set viewport to a standard desktop size
    await page.setViewport({
      width: 1280,
      height: 800,
    });

    // Enable console logging for debugging
    page.on('console', (message) => {
      console.log(`Browser console: ${message.text()}`);
    });

    // Log in to admin dashboard before tests
    await page.goto(`${BASE_URL}/admin/login`);
    
    // Fill in login form
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', ADMIN_EMAIL);
    await page.type('input[name="password"]', ADMIN_PASSWORD);
    
    // Submit login form
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Verify successful login by checking for admin dashboard elements
    await page.waitForSelector('[data-testid="admin-dashboard"]');
    console.log('Successfully logged in to admin dashboard');
  });

  // Clean up after all tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  // Reset to sites page before each test
  beforeEach(async () => {
    await page.goto(`${BASE_URL}/admin/sites`);
    await page.waitForSelector('[data-testid="site-management-page"]');
  });

  test('Edit existing site flow', async () => {
    // Step 1: Find and select the first site to edit
    console.log('Selecting site to edit...');
    
    // Wait for site table to load
    await page.waitForSelector('[data-testid="site-table"]');
    await takeScreenshot(page, 'site-management-table');
    
    // Click edit button on first site row
    await page.click('[data-testid="edit-site-button"]:first-of-type');
    
    // Wait for site edit form to load
    await page.waitForSelector('[data-testid="site-form"]');
    await takeScreenshot(page, 'site-edit-form');
    
    // Step 2: Edit Basic Information
    console.log('Updating site information...');
    
    // Clear and update name field
    await page.click('[data-testid="site-name-input"]', {clickCount: 3}); // Triple click to select all
    await page.type('[data-testid="site-name-input"]', EDIT_DETAILS.name);
    
    // Clear and update description field
    await page.click('[data-testid="site-description-input"]', {clickCount: 3});
    await page.type('[data-testid="site-description-input"]', EDIT_DETAILS.description);
    
    await takeScreenshot(page, 'site-edit-basic-info');
    
    // Navigate through steps to reach SEO page
    await page.click('[data-testid="next-step-button"]'); // To domain step
    await page.waitForSelector('[data-testid="domain-step"]');
    
    await page.click('[data-testid="next-step-button"]'); // To theme step
    await page.waitForSelector('[data-testid="theme-step"]');
    
    await page.click('[data-testid="next-step-button"]'); // To SEO step
    await page.waitForSelector('[data-testid="seo-step"]');
    
    // Step 3: Update SEO settings
    console.log('Updating SEO information...');
    
    // Clear and update meta title
    await page.click('[data-testid="meta-title-input"]', {clickCount: 3});
    await page.type('[data-testid="meta-title-input"]', EDIT_DETAILS.metaTitle);
    
    // Clear and update meta description
    await page.click('[data-testid="meta-description-input"]', {clickCount: 3});
    await page.type('[data-testid="meta-description-input"]', EDIT_DETAILS.metaDescription);
    
    await takeScreenshot(page, 'site-edit-seo');
    
    // Navigate to preview
    await page.click('[data-testid="next-step-button"]');
    
    // Step 4: Preview and submit changes
    console.log('Reviewing and submitting changes...');
    await page.waitForSelector('[data-testid="site-preview"]');
    
    // Verify preview contains updated information
    const previewText = await page.$eval('[data-testid="site-preview"]', el => el.textContent);
    expect(previewText).toContain(EDIT_DETAILS.name);
    expect(previewText).toContain(EDIT_DETAILS.description);
    
    await takeScreenshot(page, 'site-edit-preview');
    
    // Submit form with updates
    await Promise.all([
      page.click('[data-testid="submit-site-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Step 5: Verify site was updated successfully
    console.log('Verifying site update success...');
    await page.waitForSelector('[data-testid="site-management-page"]');
    
    // Check for success notification
    await page.waitForSelector('[data-testid="success-notification"]');
    const notificationText = await page.$eval('[data-testid="success-notification"]', el => el.textContent);
    expect(notificationText).toContain('Site updated successfully');
    
    // Verify updated site appears in the site table
    const tableContent = await page.$eval('[data-testid="site-table"]', el => el.textContent);
    expect(tableContent).toContain(EDIT_DETAILS.name);
    
    await takeScreenshot(page, 'site-edit-complete');
    console.log('Site update flow completed successfully');
  });

  test('Filter and search sites flow', async () => {
    // Step 1: Test search functionality
    console.log('Testing site search functionality...');
    await page.waitForSelector('[data-testid="site-search-input"]');
    
    // Search for a specific term
    const searchTerm = 'Test';
    await page.type('[data-testid="site-search-input"]', searchTerm);
    
    // Wait for search results to update
    await page.waitForTimeout(500); // Small delay for search to process
    await takeScreenshot(page, 'site-search-results');
    
    // Verify search results
    const tableAfterSearch = await page.$eval('[data-testid="site-table"]', el => el.textContent);
    
    // If there are results, they should contain the search term
    // If no results, table should show "No sites found"
    if (!tableAfterSearch.includes('No sites found')) {
      // Check if any site name contains the search term (case insensitive)
      const siteNames = await page.$$eval('[data-testid="site-name-cell"]', 
        cells => cells.map(cell => cell.textContent));
      
      const hasMatchingSite = siteNames.some(
        name => name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      expect(hasMatchingSite).toBe(true);
    }
    
    // Clear search to reset view
    await page.click('[data-testid="clear-search-button"]');
    await page.waitForTimeout(500);
    
    // Step 2: Test pagination if available
    console.log('Testing site pagination...');
    const hasPagination = await page.$('[data-testid="site-table-pagination"]') !== null;
    
    if (hasPagination) {
      // Check if there's a next page button and it's enabled
      const hasNextPage = await page.$('[data-testid="next-page-button"]:not([disabled])') !== null;
      
      if (hasNextPage) {
        // Capture current first site name for comparison
        const firstSiteNameBefore = await page.$eval(
          '[data-testid="site-name-cell"]:first-of-type', 
          el => el.textContent
        );
        
        // Navigate to next page
        await page.click('[data-testid="next-page-button"]');
        await page.waitForTimeout(500);
        await takeScreenshot(page, 'site-pagination-next-page');
        
        // Get first site name on second page
        const firstSiteNameAfter = await page.$eval(
          '[data-testid="site-name-cell"]:first-of-type', 
          el => el.textContent
        );
        
        // Sites should be different between pages
        expect(firstSiteNameBefore).not.toBe(firstSiteNameAfter);
        
        // Navigate back to first page
        await page.click('[data-testid="previous-page-button"]');
        await page.waitForTimeout(500);
      }
    }
    
    // Step 3: Test sorting functionality
    console.log('Testing site sorting functionality...');
    
    // Click on name header to sort by name
    await page.click('[data-testid="sort-by-name"]');
    await page.waitForTimeout(500);
    await takeScreenshot(page, 'site-sort-by-name');
    
    // Get sorted site names
    const sitesAfterSort = await page.$$eval(
      '[data-testid="site-name-cell"]', 
      cells => cells.map(cell => cell.textContent)
    );
    
    // Verify sites are sorted alphabetically
    if (sitesAfterSort.length > 1) {
      const sortedNames = [...sitesAfterSort].sort();
      expect(sitesAfterSort).toEqual(sortedNames);
      
      // Click again to reverse sort order
      await page.click('[data-testid="sort-by-name"]');
      await page.waitForTimeout(500);
      await takeScreenshot(page, 'site-sort-by-name-reverse');
      
      // Get reverse sorted site names
      const sitesAfterReverseSort = await page.$$eval(
        '[data-testid="site-name-cell"]', 
        cells => cells.map(cell => cell.textContent)
      );
      
      // Verify sites are sorted in reverse alphabetical order
      const reverseSortedNames = [...sitesAfterSort].sort().reverse();
      expect(sitesAfterReverseSort).toEqual(reverseSortedNames);
    }
  });

  test('Site deletion flow', async () => {
    // This test demonstrates the site deletion flow but doesn't actually delete
    // to prevent removing important data. It validates the modal appears correctly.
    
    console.log('Testing site deletion flow...');
    await page.waitForSelector('[data-testid="site-table"]');
    
    // Click delete button on a site (preferably one created by tests)
    // Look for a test site to delete
    const testSiteIndex = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[data-testid="site-row"]'));
      return rows.findIndex(row => row.textContent.includes('Test Site'));
    });
    
    // If found a test site, proceed with deletion test
    if (testSiteIndex >= 0) {
      // Get the site name for verification
      const siteToDeleteName = await page.$eval(
        `[data-testid="site-row"]:nth-of-type(${testSiteIndex + 1}) [data-testid="site-name-cell"]`,
        el => el.textContent
      );
      
      // Click delete button
      await page.click(`[data-testid="site-row"]:nth-of-type(${testSiteIndex + 1}) [data-testid="delete-site-button"]`);
      
      // Wait for confirmation modal
      await page.waitForSelector('[data-testid="delete-confirmation-modal"]');
      await takeScreenshot(page, 'site-delete-confirmation');
      
      // Verify modal contains site name
      const modalText = await page.$eval('[data-testid="delete-confirmation-modal"]', el => el.textContent);
      expect(modalText).toContain(siteToDeleteName);
      
      // Verify modal has confirm and cancel buttons
      const hasConfirmButton = await page.$('[data-testid="confirm-delete-button"]') !== null;
      const hasCancelButton = await page.$('[data-testid="cancel-delete-button"]') !== null;
      
      expect(hasConfirmButton).toBe(true);
      expect(hasCancelButton).toBe(true);
      
      // Test cancellation (don't actually delete)
      await page.click('[data-testid="cancel-delete-button"]');
      
      // Verify modal closed
      const modalClosed = await page.$('[data-testid="delete-confirmation-modal"]') === null;
      expect(modalClosed).toBe(true);
      
      // Verify site still exists in table
      const tableContent = await page.$eval('[data-testid="site-table"]', el => el.textContent);
      expect(tableContent).toContain(siteToDeleteName);
      
      console.log('Site deletion cancellation flow verified successfully');
    } else {
      console.log('No test site found for deletion test - skipping deletion flow');
    }
  });
});