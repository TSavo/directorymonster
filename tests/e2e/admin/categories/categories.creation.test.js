/**
 * @file Admin Category Creation Flow Test
 * @description End-to-end test for the complete category creation process
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
const SCREENSHOT_DIR = './screenshots/category-creation';

// Test data for category creation
const TEST_CATEGORY = {
  name: `Test Category ${Date.now()}`,
  slug: `test-category-${Date.now()}`,
  description: 'An automated test category created by E2E tests',
  parentCategory: '', // No parent initially (top-level category)
  isActive: true,
  metaTitle: 'Test Category | DirectoryMonster',
  metaDescription: 'This is a test category created by automated E2E testing'
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
 * Admin Category Creation Flow Test
 */
describe('Admin Category Creation Flow', () => {
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

  // Reset to categories page before each test
  beforeEach(async () => {
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForSelector('[data-testid="category-management-page"]');
  });

  test('Complete category creation flow', async () => {
    // Step 1: Navigate to category creation page
    await page.click('[data-testid="create-category-button"]');
    await page.waitForSelector('[data-testid="category-form"]');
    await takeScreenshot(page, 'category-creation-start');
    
    // Step 2: Fill the basic information
    console.log('Filling basic category information...');
    await page.waitForSelector('[data-testid="category-name-input"]');
    await page.type('[data-testid="category-name-input"]', TEST_CATEGORY.name);
    await page.type('[data-testid="category-slug-input"]', TEST_CATEGORY.slug);
    await page.type('[data-testid="category-description-input"]', TEST_CATEGORY.description);
    
    // Select parent category (none for this test - top level category)
    await page.click('[data-testid="parent-category-select"]');
    await page.waitForSelector('[data-testid="parent-option-none"]');
    await page.click('[data-testid="parent-option-none"]');
    
    // Set category status
    if (TEST_CATEGORY.isActive) {
      await page.click('[data-testid="category-status-active"]');
    } else {
      await page.click('[data-testid="category-status-inactive"]');
    }
    
    await takeScreenshot(page, 'category-basic-info');
    
    // Step 3: Fill SEO information
    console.log('Filling SEO information...');
    await page.click('[data-testid="seo-tab"]');
    await page.waitForSelector('[data-testid="meta-title-input"]');
    
    await page.type('[data-testid="meta-title-input"]', TEST_CATEGORY.metaTitle);
    await page.type('[data-testid="meta-description-input"]', TEST_CATEGORY.metaDescription);
    
    await takeScreenshot(page, 'category-seo-info');
    
    // Step 4: Submit the form
    console.log('Submitting category form...');
    await Promise.all([
      page.click('[data-testid="submit-category-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Step 5: Verify category was created successfully
    console.log('Verifying category creation success...');
    await page.waitForSelector('[data-testid="category-management-page"]');
    
    // Check for success notification
    await page.waitForSelector('[data-testid="success-notification"]');
    const notificationText = await page.$eval('[data-testid="success-notification"]', el => el.textContent);
    expect(notificationText).toContain('Category created successfully');
    
    // Verify category appears in the category list/tree
    const tableContent = await page.$eval('[data-testid="category-list"]', el => el.textContent);
    expect(tableContent).toContain(TEST_CATEGORY.name);
    
    await takeScreenshot(page, 'category-creation-complete');
    console.log('Category creation flow completed successfully');
  });

  test('Create child category flow', async () => {
    // First ensure we have a parent category to work with
    // We'll use the category we just created in the previous test
    
    // Step 1: Navigate to category creation page
    await page.click('[data-testid="create-category-button"]');
    await page.waitForSelector('[data-testid="category-form"]');
    await takeScreenshot(page, 'child-category-creation-start');
    
    // Step 2: Fill the child category information
    console.log('Creating child category...');
    const CHILD_CATEGORY = {
      name: `Child Category ${Date.now()}`,
      slug: `child-category-${Date.now()}`,
      description: 'A child category for testing hierarchy',
      parentName: TEST_CATEGORY.name, // Reference the parent we created earlier
      metaTitle: 'Child Category | DirectoryMonster',
      metaDescription: 'This is a child test category created by automated E2E testing'
    };
    
    await page.waitForSelector('[data-testid="category-name-input"]');
    await page.type('[data-testid="category-name-input"]', CHILD_CATEGORY.name);
    await page.type('[data-testid="category-slug-input"]', CHILD_CATEGORY.slug);
    await page.type('[data-testid="category-description-input"]', CHILD_CATEGORY.description);
    
    // Select parent category
    await page.click('[data-testid="parent-category-select"]');
    
    // Wait for dropdown options to load
    await page.waitForTimeout(500);
    
    // Find and select the parent category by name
    // This is a bit complex as we need to find the option that contains our parent name
    const parentOptionExists = await page.evaluate((parentName) => {
      const options = Array.from(document.querySelectorAll('[data-testid^="parent-option-"]'));
      const option = options.find(opt => opt.textContent.includes(parentName));
      if (option) {
        option.click();
        return true;
      }
      return false;
    }, CHILD_CATEGORY.parentName);
    
    // If we couldn't find the exact parent, select the first available parent
    if (!parentOptionExists) {
      console.log('Specific parent not found, selecting first available parent');
      await page.click('[data-testid^="parent-option-"]:not([data-testid="parent-option-none"])');
    }
    
    await takeScreenshot(page, 'child-category-parent-selection');
    
    // Step 3: Fill SEO information
    console.log('Filling child category SEO information...');
    await page.click('[data-testid="seo-tab"]');
    await page.waitForSelector('[data-testid="meta-title-input"]');
    
    await page.type('[data-testid="meta-title-input"]', CHILD_CATEGORY.metaTitle);
    await page.type('[data-testid="meta-description-input"]', CHILD_CATEGORY.metaDescription);
    
    // Step 4: Submit the form
    console.log('Submitting child category form...');
    await Promise.all([
      page.click('[data-testid="submit-category-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Step 5: Verify child category was created successfully
    console.log('Verifying child category creation success...');
    await page.waitForSelector('[data-testid="category-management-page"]');
    
    // Check for success notification
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Verify child category appears in the category list/tree
    const expandParentButtons = await page.$$('[data-testid="expand-category-button"]');
    if (expandParentButtons.length > 0) {
      // Click to expand the parent categories to see children
      for (const button of expandParentButtons) {
        await button.click();
        await page.waitForTimeout(300); // Small wait for expansion animation
      }
      
      await takeScreenshot(page, 'category-tree-expanded');
      
      // Check for child category in the expanded tree
      const treeContent = await page.$eval('[data-testid="category-list"]', el => el.textContent);
      expect(treeContent).toContain(CHILD_CATEGORY.name);
    }
    
    await takeScreenshot(page, 'child-category-creation-complete');
    console.log('Child category creation flow completed successfully');
  });
});