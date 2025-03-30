/**
 * @file Admin Category Management Flow Test
 * @description End-to-end test for category management operations
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
const SCREENSHOT_DIR = './screenshots/category-management';

// Test data for category creation and editing
const NEW_CATEGORY = {
  name: `Test Category ${Date.now()}`,
  slug: `test-category-${Date.now()}`,
  description: 'This is a test category created through E2E testing'
};

const EDIT_CATEGORY = {
  name: `Updated Category ${Date.now()}`,
  description: 'This category was updated through E2E testing'
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
 * Admin Category Management Flow Test
 */
describe('Admin Category Management Flow', () => {
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

  // Reset to categories page before each test
  beforeEach(async () => {
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForSelector('[data-testid="category-management-page"]');
  });

  test('Create new category flow', async () => {
    // Click create new category button
    await page.click('[data-testid="add-category-button"]');
    
    // Wait for category form to load
    await page.waitForSelector('[data-testid="category-form"]');
    
    // Fill category information
    await page.type('[data-testid="category-name-input"]', NEW_CATEGORY.name);
    
    // If there's a separate slug field, fill it
    if (await page.$('[data-testid="category-slug-input"]') !== null) {
      await page.type('[data-testid="category-slug-input"]', NEW_CATEGORY.slug);
    }
    
    await page.type('[data-testid="category-description-input"]', NEW_CATEGORY.description);
    
    // Take screenshot before submitting
    await takeScreenshot(page, 'new-category-form');
    
    // Submit the form
    await Promise.all([
      page.click('[data-testid="submit-category-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Verify category was created successfully
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Check if the category appears in the table
    const tableContent = await page.$eval('[data-testid="category-table"]', el => el.textContent);
    expect(tableContent).toContain(NEW_CATEGORY.name);
  });

  test('Edit existing category flow', async () => {
    // Find and select a category to edit
    await page.waitForSelector('[data-testid="category-table"]');
    await takeScreenshot(page, 'category-management-table');
    
    // Click edit button on first category
    await page.click('[data-testid="edit-category-button"]:first-of-type');
    
    // Wait for category edit form to load
    await page.waitForSelector('[data-testid="category-form"]');
    
    // Edit Category Information
    await clearInput(page, '[data-testid="category-name-input"]');
    await page.type('[data-testid="category-name-input"]', EDIT_CATEGORY.name);
    
    await clearInput(page, '[data-testid="category-description-input"]');
    await page.type('[data-testid="category-description-input"]', EDIT_CATEGORY.description);
    
    // Take screenshot before submitting
    await takeScreenshot(page, 'edit-category-form');
    
    // Submit changes
    await Promise.all([
      page.click('[data-testid="submit-category-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Verify category was updated successfully
    await page.waitForSelector('[data-testid="success-notification"]');
    const tableContent = await page.$eval('[data-testid="category-table"]', el => el.textContent);
    expect(tableContent).toContain(EDIT_CATEGORY.name);
  });

  test('Category deletion flow', async () => {
    // Find a category to delete
    await page.waitForSelector('[data-testid="category-table"]');
    
    // Store the number of categories before deletion
    const initialCategoryCount = await page.$$eval('[data-testid="category-row"]', rows => rows.length);
    
    // Click delete button on a category
    await page.click('[data-testid="delete-category-button"]:first-of-type');
    
    // Wait for confirmation modal
    await page.waitForSelector('[data-testid="delete-confirmation-modal"]');
    
    // Take a screenshot of the confirmation modal
    await takeScreenshot(page, 'delete-category-confirmation');
    
    // Test cancellation (don't actually delete)
    await page.click('[data-testid="cancel-delete-button"]');
    
    // Verify modal closed
    const modalClosed = await page.$('[data-testid="delete-confirmation-modal"]') === null;
    expect(modalClosed).toBe(true);
    
    // Verify the category count remains the same (nothing was deleted)
    const finalCategoryCount = await page.$$eval('[data-testid="category-row"]', rows => rows.length);
    expect(finalCategoryCount).toBe(initialCategoryCount);
  });

  test('Category ordering flow', async () => {
    // Check if there are reordering buttons
    const hasReorderingFeature = await page.$('[data-testid="move-category-up-button"]') !== null ||
                                 await page.$('[data-testid="category-drag-handle"]') !== null;
    
    if (hasReorderingFeature) {
      // Get initial order of categories
      const initialOrder = await page.$$eval('[data-testid="category-name"]', elements => 
        elements.map(el => el.textContent));
      
      // Try to move a category up or down
      if (await page.$('[data-testid="move-category-up-button"]:not(:first-of-type)') !== null) {
        // Move a category up (skip the first one)
        await page.click('[data-testid="move-category-up-button"]:not(:first-of-type)');
      } else if (await page.$('[data-testid="move-category-down-button"]:not(:last-of-type)') !== null) {
        // Move a category down (skip the last one)
        await page.click('[data-testid="move-category-down-button"]:not(:last-of-type)');
      }
      
      // Wait for reordering to take effect
      await page.waitForTimeout(1000);
      
      // Get the new order
      const newOrder = await page.$$eval('[data-testid="category-name"]', elements => 
        elements.map(el => el.textContent));
      
      // Check if the order changed
      let orderChanged = false;
      for (let i = 0; i < initialOrder.length; i++) {
        if (initialOrder[i] !== newOrder[i]) {
          orderChanged = true;
          break;
        }
      }
      
      expect(orderChanged).toBe(true);
    } else {
      console.log('Category reordering feature not detected - skipping test');
    }
  });
});