/**
 * @file Admin Listing Management Flow Test
 * @description End-to-end test for listing management operations
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
const SCREENSHOT_DIR = './screenshots/listing-management';

// Test data for listing editing
const EDIT_DETAILS = {
  title: `Updated Listing ${Date.now()}`,
  description: 'This listing was updated through E2E testing',
  price: '149.99',
  website: 'https://updated-example.com'
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

const clearInput = async (page, selector) => {
  await page.click(selector, {clickCount: 3}); // Triple click to select all
  await page.keyboard.press('Backspace');
};

/**
 * Admin Listing Management Flow Test
 */
describe('Admin Listing Management Flow', () => {
  let browser;
  let page;

  // Set up the browser and page before running tests
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      args: ['--disable-gpu', '--disable-dev-shm-usage', '--no-sandbox'],
    });
    
    page = await browser.newPage();
    page.setDefaultTimeout(DEFAULT_TIMEOUT);
    
    await page.setViewport({
      width: 1280,
      height: 800,
    });

    // Log in to admin dashboard
    await page.goto(`${BASE_URL}/admin/login`);
    await page.waitForSelector('input[name="email"]');
    await page.type('input[name="email"]', ADMIN_EMAIL);
    await page.type('input[name="password"]', ADMIN_PASSWORD);
    
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    await page.waitForSelector('[data-testid="admin-dashboard"]');
  });

  // Clean up after all tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  // Reset to listings page before each test
  beforeEach(async () => {
    await page.goto(`${BASE_URL}/admin/listings`);
    await page.waitForSelector('[data-testid="listing-management-page"]');
  });

  test('Edit existing listing flow', async () => {
    // Find and select a listing to edit
    await page.waitForSelector('[data-testid="listing-table"]');
    await takeScreenshot(page, 'listing-management-table');
    
    // Click edit button on first listing
    await page.click('[data-testid="edit-listing-button"]:first-of-type');
    
    // Wait for listing edit form to load
    await page.waitForSelector('[data-testid="listing-form"]');
    
    // Edit Basic Information
    await clearInput(page, '[data-testid="listing-title-input"]');
    await page.type('[data-testid="listing-title-input"]', EDIT_DETAILS.title);
    
    await clearInput(page, '[data-testid="listing-description-input"]');
    await page.type('[data-testid="listing-description-input"]', EDIT_DETAILS.description);
    
    // Update price if the field exists
    if (await page.$('[data-testid="listing-price-input"]') !== null) {
      await clearInput(page, '[data-testid="listing-price-input"]');
      await page.type('[data-testid="listing-price-input"]', EDIT_DETAILS.price);
    }
    
    // Navigate through form steps to reach the end
    // We'll continue clicking next until we reach the review step
    while (await page.$('[data-testid="next-step-button"]') !== null && 
           await page.$('[data-testid="listing-review-step"]') === null) {
      await page.click('[data-testid="next-step-button"]');
      await page.waitForTimeout(500);
    }
    
    // Submit changes
    await Promise.all([
      page.click('[data-testid="submit-listing-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Verify listing was updated successfully
    await page.waitForSelector('[data-testid="success-notification"]');
    const tableContent = await page.$eval('[data-testid="listing-table"]', el => el.textContent);
    expect(tableContent).toContain(EDIT_DETAILS.title);
  });

  test('Change listing status flow', async () => {
    // Check if there's a status change dropdown
    const hasStatusDropdown = await page.$('[data-testid="listing-status-dropdown"]:first-of-type') !== null;
    
    if (hasStatusDropdown) {
      // Get current status for comparison
      const currentStatus = await page.$eval('[data-testid="listing-status"]:first-of-type', el => el.textContent);
      
      // Click the status dropdown to see available options
      await page.click('[data-testid="listing-status-dropdown"]:first-of-type');
      
      // Select a different status
      if (currentStatus.toLowerCase().includes('active')) {
        // Try to select inactive or draft
        if (await page.$('[data-testid="status-option-inactive"]') !== null) {
          await page.click('[data-testid="status-option-inactive"]');
        } else if (await page.$('[data-testid="status-option-draft"]') !== null) {
          await page.click('[data-testid="status-option-draft"]');
        }
      } else {
        // Try to select active
        if (await page.$('[data-testid="status-option-active"]') !== null) {
          await page.click('[data-testid="status-option-active"]');
        }
      }
      
      // Wait for status update to process
      await page.waitForTimeout(1000);
      
      // Verify status changed
      const newStatus = await page.$eval('[data-testid="listing-status"]:first-of-type', el => el.textContent);
      expect(newStatus.toLowerCase()).not.toBe(currentStatus.toLowerCase());
    } else {
      // Alternative: Check for a status toggle button
      const hasStatusToggle = await page.$('[data-testid="toggle-listing-status"]:first-of-type') !== null;
      
      if (hasStatusToggle) {
        await page.click('[data-testid="toggle-listing-status"]:first-of-type');
      }
    }
  });

  test('Listing deletion flow', async () => {
    // Find a listing to delete
    await page.waitForSelector('[data-testid="listing-table"]');
    
    // Click delete button on a listing
    await page.click('[data-testid="delete-listing-button"]:first-of-type');
    
    // Wait for confirmation modal
    await page.waitForSelector('[data-testid="delete-confirmation-modal"]');
    
    // Test cancellation (don't actually delete)
    await page.click('[data-testid="cancel-delete-button"]');
    
    // Verify modal closed
    const modalClosed = await page.$('[data-testid="delete-confirmation-modal"]') === null;
    expect(modalClosed).toBe(true);
  });
});