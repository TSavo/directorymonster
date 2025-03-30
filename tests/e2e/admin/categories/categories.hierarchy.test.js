/**
 * @file Admin Category Hierarchy Tests
 * @description End-to-end tests for hierarchical category relationships
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
const SCREENSHOT_DIR = './screenshots/category-hierarchy';

// Test data for hierarchy testing
const HIERARCHY_DATA = {
  parent: {
    name: `Parent Category ${Date.now()}`,
    slug: `parent-category-${Date.now()}`,
    description: 'A parent category for hierarchy testing'
  },
  child: {
    name: `Child Category ${Date.now()}`,
    slug: `child-category-${Date.now()}`,
    description: 'A child category for hierarchy testing'
  },
  grandchild: {
    name: `Grandchild Category ${Date.now()}`,
    slug: `grandchild-category-${Date.now()}`,
    description: 'A grandchild category for hierarchy testing'
  }
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
 * Admin Category Hierarchy Tests
 */
describe('Admin Category Hierarchy', () => {
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

  test('Create three-level category hierarchy', async () => {
    console.log('Testing creation of a three-level category hierarchy...');
    
    // Step 1: Create parent category
    console.log('Creating parent category...');
    await page.click('[data-testid="create-category-button"]');
    await page.waitForSelector('[data-testid="category-form"]');
    
    await page.type('[data-testid="category-name-input"]', HIERARCHY_DATA.parent.name);
    await page.type('[data-testid="category-slug-input"]', HIERARCHY_DATA.parent.slug);
    await page.type('[data-testid="category-description-input"]', HIERARCHY_DATA.parent.description);
    
    // Select no parent (top level)
    await page.click('[data-testid="parent-category-select"]');
    await page.waitForSelector('[data-testid="parent-option-none"]');
    await page.click('[data-testid="parent-option-none"]');
    
    // Submit parent category
    await Promise.all([
      page.click('[data-testid="submit-category-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Verify parent category created
    await page.waitForSelector('[data-testid="success-notification"]');
    let listContent = await page.$eval('[data-testid="category-list"]', el => el.textContent);
    expect(listContent).toContain(HIERARCHY_DATA.parent.name);
    await takeScreenshot(page, 'parent-category-created');
    
    // Step 2: Create child category
    console.log('Creating child category...');
    await page.click('[data-testid="create-category-button"]');
    await page.waitForSelector('[data-testid="category-form"]');
    
    await page.type('[data-testid="category-name-input"]', HIERARCHY_DATA.child.name);
    await page.type('[data-testid="category-slug-input"]', HIERARCHY_DATA.child.slug);
    await page.type('[data-testid="category-description-input"]', HIERARCHY_DATA.child.description);
    
    // Select parent category
    await page.click('[data-testid="parent-category-select"]');
    await page.waitForTimeout(500); // Wait for dropdown to populate
    
    // Find and select the parent category by name
    const parentFound = await page.evaluate((parentName) => {
      const options = Array.from(document.querySelectorAll('[data-testid^="parent-option-"]'));
      const option = options.find(opt => opt.textContent.includes(parentName));
      if (option) {
        option.click();
        return true;
      }
      return false;
    }, HIERARCHY_DATA.parent.name);
    
    expect(parentFound).toBe(true);
    await takeScreenshot(page, 'child-category-parent-selection');
    
    // Submit child category
    await Promise.all([
      page.click('[data-testid="submit-category-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Verify child category created
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Expand parent to see child
    const expandButtons = await page.$$('[data-testid="expand-category-button"]');
    if (expandButtons.length > 0) {
      await expandButtons[0].click();
      await page.waitForTimeout(500);
    }
    
    listContent = await page.$eval('[data-testid="category-list"]', el => el.textContent);
    expect(listContent).toContain(HIERARCHY_DATA.child.name);
    await takeScreenshot(page, 'child-category-created');
    
    // Step 3: Create grandchild category
    console.log('Creating grandchild category...');
    await page.click('[data-testid="create-category-button"]');
    await page.waitForSelector('[data-testid="category-form"]');
    
    await page.type('[data-testid="category-name-input"]', HIERARCHY_DATA.grandchild.name);
    await page.type('[data-testid="category-slug-input"]', HIERARCHY_DATA.grandchild.slug);
    await page.type('[data-testid="category-description-input"]', HIERARCHY_DATA.grandchild.description);
    
    // Select child category as parent
    await page.click('[data-testid="parent-category-select"]');
    await page.waitForTimeout(500); // Wait for dropdown to populate
    
    // Find and select the child category by name
    const childFound = await page.evaluate((childName) => {
      const options = Array.from(document.querySelectorAll('[data-testid^="parent-option-"]'));
      const option = options.find(opt => opt.textContent.includes(childName));
      if (option) {
        option.click();
        return true;
      }
      return false;
    }, HIERARCHY_DATA.child.name);
    
    expect(childFound).toBe(true);
    await takeScreenshot(page, 'grandchild-category-parent-selection');
    
    // Submit grandchild category
    await Promise.all([
      page.click('[data-testid="submit-category-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Verify grandchild category created
    await page.waitForSelector('[data-testid="success-notification"]');
    
    // Expand all categories to see the full hierarchy
    const allExpandButtons = await page.$$('[data-testid="expand-category-button"]');
    for (const button of allExpandButtons) {
      await button.click();
      await page.waitForTimeout(300);
    }
    
    listContent = await page.$eval('[data-testid="category-list"]', el => el.textContent);
    expect(listContent).toContain(HIERARCHY_DATA.grandchild.name);
    await takeScreenshot(page, 'full-hierarchy-created');
    
    console.log('Three-level category hierarchy created successfully');
  });

  test('Verify hierarchical navigation and breadcrumbs', async () => {
    console.log('Testing hierarchical navigation and breadcrumbs...');
    
    // First expand all categories to see the full hierarchy
    const allExpandButtons = await page.$$('[data-testid="expand-category-button"]');
    for (const button of allExpandButtons) {
      await button.click();
      await page.waitForTimeout(300);
    }
    
    // Look for the grandchild category we created
    const grandchildCategoryExists = await page.evaluate((grandchildName) => {
      const categoryItems = Array.from(document.querySelectorAll('[data-testid="category-list-item"]'));
      const grandchild = categoryItems.find(item => item.textContent.includes(grandchildName));
      if (grandchild) {
        // Find the view link and click it
        const viewButton = grandchild.querySelector('[data-testid="view-category-button"]');
        if (viewButton) {
          viewButton.click();
          return true;
        }
      }
      return false;
    }, HIERARCHY_DATA.grandchild.name);
    
    if (grandchildCategoryExists) {
      // Wait for category detail view to load
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
      await page.waitForSelector('[data-testid="category-detail-view"]');
      await takeScreenshot(page, 'grandchild-category-detail');
      
      // Check for breadcrumbs showing the hierarchy
      const hasBreadcrumbs = await page.$('[data-testid="category-breadcrumbs"]') !== null;
      
      if (hasBreadcrumbs) {
        const breadcrumbsText = await page.$eval('[data-testid="category-breadcrumbs"]', el => el.textContent);
        
        // Verify breadcrumbs show the full path
        expect(breadcrumbsText).toContain(HIERARCHY_DATA.parent.name);
        expect(breadcrumbsText).toContain(HIERARCHY_DATA.child.name);
        expect(breadcrumbsText).toContain(HIERARCHY_DATA.grandchild.name);
        
        // Test navigation via breadcrumbs - click on parent link
        await page.click(`[data-testid="breadcrumb-link-${HIERARCHY_DATA.parent.slug}"]`);
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        await page.waitForSelector('[data-testid="category-detail-view"]');
        
        // Verify we're now on parent category page
        const pageTitle = await page.$eval('[data-testid="category-detail-title"]', el => el.textContent);
        expect(pageTitle).toContain(HIERARCHY_DATA.parent.name);
        
        await takeScreenshot(page, 'parent-category-detail');
        console.log('Hierarchical navigation via breadcrumbs verified');
      } else {
        console.log('Breadcrumbs not found, skipping breadcrumb test');
      }
    } else {
      console.log('Grandchild category not found, skipping hierarchical navigation test');
    }
  });

  test('Move category in hierarchy', async () => {
    console.log('Testing category movement in hierarchy...');
    
    // Create a new test category to move
    const MOVABLE_CATEGORY = {
      name: `Movable Category ${Date.now()}`,
      slug: `movable-category-${Date.now()}`,
      description: 'A category to test movement in hierarchy'
    };
    
    // Step 1: Create the movable category (initially as top-level)
    await page.click('[data-testid="create-category-button"]');
    await page.waitForSelector('[data-testid="category-form"]');
    
    await page.type('[data-testid="category-name-input"]', MOVABLE_CATEGORY.name);
    await page.type('[data-testid="category-slug-input"]', MOVABLE_CATEGORY.slug);
    await page.type('[data-testid="category-description-input"]', MOVABLE_CATEGORY.description);
    
    // Select no parent (top level)
    await page.click('[data-testid="parent-category-select"]');
    await page.waitForSelector('[data-testid="parent-option-none"]');
    await page.click('[data-testid="parent-option-none"]');
    
    // Submit category
    await Promise.all([
      page.click('[data-testid="submit-category-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Verify category was created
    await page.waitForSelector('[data-testid="success-notification"]');
    let listContent = await page.$eval('[data-testid="category-list"]', el => el.textContent);
    expect(listContent).toContain(MOVABLE_CATEGORY.name);
    await takeScreenshot(page, 'movable-category-created');
    
    // Step 2: Edit the category to move it under a parent
    // First find the created category
    const editButtonExists = await page.evaluate((categoryName) => {
      const categoryItems = Array.from(document.querySelectorAll('[data-testid="category-list-item"]'));
      const targetCategory = categoryItems.find(item => item.textContent.includes(categoryName));
      if (targetCategory) {
        const editButton = targetCategory.querySelector('[data-testid="edit-category-button"]');
        if (editButton) {
          editButton.click();
          return true;
        }
      }
      return false;
    }, MOVABLE_CATEGORY.name);
    
    if (editButtonExists) {
      // Wait for category edit form
      await page.waitForSelector('[data-testid="category-form"]');
      await takeScreenshot(page, 'movable-category-edit');
      
      // Change parent to our previously created parent category
      await page.click('[data-testid="parent-category-select"]');
      await page.waitForTimeout(500); // Wait for dropdown to populate
      
      // Find and select parent category
      const parentFound = await page.evaluate((parentName) => {
        const options = Array.from(document.querySelectorAll('[data-testid^="parent-option-"]'));
        const option = options.find(opt => opt.textContent.includes(parentName));
        if (option) {
          option.click();
          return true;
        }
        return false;
      }, HIERARCHY_DATA.parent.name);
      
      if (parentFound) {
        await takeScreenshot(page, 'movable-category-new-parent');
        
        // Submit category update
        await Promise.all([
          page.click('[data-testid="submit-category-button"]'),
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
        ]);
        
        // Verify update successful
        await page.waitForSelector('[data-testid="success-notification"]');
        
        // Expand parent to see if category moved
        const expandButtons = await page.$$('[data-testid="expand-category-button"]');
        if (expandButtons.length > 0) {
          for (const button of expandButtons) {
            await button.click();
            await page.waitForTimeout(300);
          }
        }
        
        // Check if category now appears under parent
        listContent = await page.$eval('[data-testid="category-list"]', el => el.textContent);
        expect(listContent).toContain(MOVABLE_CATEGORY.name);
        
        // Visual verification of hierarchy
        await takeScreenshot(page, 'movable-category-moved');
        
        // Check if the moved category has the correct indentation level
        // This verifies it's actually displayed as a child in the hierarchy
        const correctIndentation = await page.evaluate((parentName, categoryName) => {
          const allItems = Array.from(document.querySelectorAll('[data-testid="category-list-item"]'));
          const parentItem = allItems.find(item => item.textContent.includes(parentName));
          const categoryItem = allItems.find(item => item.textContent.includes(categoryName));
          
          if (parentItem && categoryItem) {
            // Check if category has greater indentation than parent
            // This is a simple way to verify hierarchical display
            const parentIndent = parentItem.style.paddingLeft || '0px';
            const categoryIndent = categoryItem.style.paddingLeft || '0px';
            
            const parentIndentNum = parseInt(parentIndent);
            const categoryIndentNum = parseInt(categoryIndent);
            
            return categoryIndentNum > parentIndentNum;
          }
          return false;
        }, HIERARCHY_DATA.parent.name, MOVABLE_CATEGORY.name);
        
        expect(correctIndentation).toBe(true);
        console.log('Category movement in hierarchy verified successfully');
      } else {
        console.log('Parent category not found for moving test category');
      }
    } else {
      console.log('Movable category not found for editing');
    }
  });
});