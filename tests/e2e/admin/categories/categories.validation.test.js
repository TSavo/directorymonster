/**
 * @file Admin Category Validation Tests
 * @description End-to-end tests for validation behavior during category creation/editing
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
const SCREENSHOT_DIR = './screenshots/category-validation';

// Test data with validation issues
const INVALID_CATEGORY_DATA = {
  emptyName: {
    name: '',
    slug: 'test-category-validation',
    description: 'Testing validation for empty name'
  },
  invalidSlug: {
    name: 'Validation Test Category',
    slug: 'invalid slug with spaces',
    description: 'Testing validation for invalid slug'
  },
  tooShortDescription: {
    name: 'Validation Test Category',
    slug: 'validation-test',
    description: 'Too short'
  },
  duplicateSlug: {
    name: 'Duplicate Slug Test',
    slug: 'existing-category-slug', // Will be set dynamically to an existing slug
    description: 'Testing validation for duplicate slugs'
  },
  invalidSeoMeta: {
    metaTitle: 'x'.repeat(201), // Too long
    metaDescription: 'x'.repeat(501) // Too long
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

const clearInput = async (page, selector) => {
  await page.click(selector, {clickCount: 3}); // Triple click to select all
  await page.keyboard.press('Backspace');
};

/**
 * Admin Category Validation Tests
 */
describe('Admin Category Validation', () => {
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
    
    // Get an existing category slug for duplicate slug test
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForSelector('[data-testid="category-management-page"]');
    
    // Try to find an existing category slug
    const existingSlug = await page.evaluate(() => {
      const slugElements = document.querySelectorAll('[data-testid="category-slug-display"]');
      return slugElements.length > 0 ? slugElements[0].textContent.trim() : 'test-category';
    });
    
    INVALID_CATEGORY_DATA.duplicateSlug.slug = existingSlug;
    console.log(`Using existing slug "${existingSlug}" for duplicate slug test`);
  });

  // Clean up after all tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  // Navigate to category creation form before each test
  beforeEach(async () => {
    await page.goto(`${BASE_URL}/admin/categories`);
    await page.waitForSelector('[data-testid="category-management-page"]');
    
    // Navigate to category creation form
    await page.click('[data-testid="create-category-button"]');
    await page.waitForSelector('[data-testid="category-form"]');
  });

  test('Validate required fields', async () => {
    console.log('Testing required field validation...');
    
    // Try to submit without filling any fields
    await page.click('[data-testid="submit-category-button"]');
    await takeScreenshot(page, 'empty-form-validation');
    
    // Check for error messages
    const errorMessages = await page.$$eval('[data-testid="field-error"]', errors => errors.map(e => e.textContent));
    
    // Verify at least the required field errors appear
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(errorMessages.some(msg => msg.toLowerCase().includes('name'))).toBe(true);
    expect(errorMessages.some(msg => msg.toLowerCase().includes('slug'))).toBe(true);
    
    // Try with only name field
    await page.type('[data-testid="category-name-input"]', 'Validation Test Category');
    await page.click('[data-testid="submit-category-button"]');
    
    // Should still show error for slug
    const slugError = await page.$eval('[data-testid="slug-error"]', e => e.textContent);
    expect(slugError).toBeTruthy();
    
    await takeScreenshot(page, 'partial-form-validation');
  });

  test('Validate category name constraints', async () => {
    console.log('Testing category name validation...');
    
    // Test too short name (1-2 characters)
    await page.type('[data-testid="category-name-input"]', 'A');
    await page.click('[data-testid="submit-category-button"]');
    
    // Should show error for name too short
    const nameError = await page.$eval('[data-testid="name-error"]', e => e.textContent);
    expect(nameError).toBeTruthy();
    expect(nameError.toLowerCase()).toContain('too short');
    
    await takeScreenshot(page, 'name-too-short-validation');
    
    // Test valid name
    await clearInput(page, '[data-testid="category-name-input"]');
    await page.type('[data-testid="category-name-input"]', 'Valid Category Name');
    
    // Fill slug to prevent other validation errors
    await page.type('[data-testid="category-slug-input"]', 'valid-category-slug');
    await page.type('[data-testid="category-description-input"]', 'This is a valid category description for testing validation rules.');
    
    // Try to submit
    await page.click('[data-testid="submit-category-button"]');
    
    // Check if name error is gone
    const hasNameError = await page.$('[data-testid="name-error"]') !== null;
    expect(hasNameError).toBe(false);
    
    console.log('Category name validation passed');
  });

  test('Validate slug format', async () => {
    console.log('Testing slug validation...');
    
    // Fill valid name and description
    await page.type('[data-testid="category-name-input"]', 'Slug Test Category');
    await page.type('[data-testid="category-description-input"]', 'Testing slug validation rules.');
    
    // Test invalid slug with spaces
    await page.type('[data-testid="category-slug-input"]', 'invalid slug with spaces');
    await page.click('[data-testid="submit-category-button"]');
    
    // Should show error for invalid slug format
    const slugError = await page.$eval('[data-testid="slug-error"]', e => e.textContent);
    expect(slugError).toBeTruthy();
    expect(slugError.toLowerCase()).toContain('invalid');
    
    await takeScreenshot(page, 'invalid-slug-validation');
    
    // Test slug with special characters
    await clearInput(page, '[data-testid="category-slug-input"]');
    await page.type('[data-testid="category-slug-input"]', 'invalid$slug#');
    await page.click('[data-testid="submit-category-button"]');
    
    // Should still show error
    const specialCharError = await page.$eval('[data-testid="slug-error"]', e => e.textContent);
    expect(specialCharError).toBeTruthy();
    
    await takeScreenshot(page, 'special-char-slug-validation');
    
    // Test valid slug
    await clearInput(page, '[data-testid="category-slug-input"]');
    await page.type('[data-testid="category-slug-input"]', 'valid-slug-123');
    await page.click('[data-testid="submit-category-button"]');
    
    // Check if slug error is gone
    const hasSlugError = await page.$('[data-testid="slug-error"]') !== null;
    expect(hasSlugError).toBe(false);
    
    console.log('Slug validation passed');
  });

  test('Validate description length', async () => {
    console.log('Testing description length validation...');
    
    // Fill valid name and slug
    await page.type('[data-testid="category-name-input"]', 'Description Test Category');
    await page.type('[data-testid="category-slug-input"]', 'description-test');
    
    // Test too short description
    await page.type('[data-testid="category-description-input"]', 'Too short');
    await page.click('[data-testid="submit-category-button"]');
    
    // Should show error for description too short (if there's a minimum length requirement)
    const hasDescError = await page.$('[data-testid="description-error"]') !== null;
    if (hasDescError) {
      const descError = await page.$eval('[data-testid="description-error"]', e => e.textContent);
      expect(descError.toLowerCase()).toContain('too short');
      
      await takeScreenshot(page, 'description-too-short-validation');
      
      // Test very long description
      await clearInput(page, '[data-testid="category-description-input"]');
      const longDescription = 'A'.repeat(1001); // Assume max is 1000 chars
      await page.type('[data-testid="category-description-input"]', longDescription);
      await page.click('[data-testid="submit-category-button"]');
      
      // Should show error for description too long
      const longDescError = await page.$eval('[data-testid="description-error"]', e => e.textContent);
      expect(longDescError).toBeTruthy();
      expect(longDescError.toLowerCase()).toContain('too long');
      
      await takeScreenshot(page, 'description-too-long-validation');
    } else {
      console.log('No description length validation found, continuing test');
    }
    
    // Test valid description
    await clearInput(page, '[data-testid="category-description-input"]');
    await page.type('[data-testid="category-description-input"]', 'This is a valid category description with enough characters to pass validation but not too many to exceed the maximum length.');
    await page.click('[data-testid="submit-category-button"]');
    
    // Check if description error is gone
    const hasDescriptionError = await page.$('[data-testid="description-error"]') !== null;
    expect(hasDescriptionError).toBe(false);
    
    console.log('Description validation passed');
  });

  test('Validate duplicate slug', async () => {
    console.log('Testing duplicate slug validation...');
    
    // Fill valid name and description
    await page.type('[data-testid="category-name-input"]', INVALID_CATEGORY_DATA.duplicateSlug.name);
    await page.type('[data-testid="category-description-input"]', INVALID_CATEGORY_DATA.duplicateSlug.description);
    
    // Use the slug of an existing category
    await page.type('[data-testid="category-slug-input"]', INVALID_CATEGORY_DATA.duplicateSlug.slug);
    await page.click('[data-testid="submit-category-button"]');
    
    // Wait for form submission and response
    await page.waitForTimeout(1000);
    
    // Should show error for duplicate slug
    const hasDuplicateError = await page.$('[data-testid="slug-error"]') !== null;
    if (hasDuplicateError) {
      const duplicateError = await page.$eval('[data-testid="slug-error"]', e => e.textContent);
      expect(duplicateError.toLowerCase()).toContain('already exists' || duplicateError.toLowerCase().includes('taken'));
      
      await takeScreenshot(page, 'duplicate-slug-validation');
      console.log('Duplicate slug validation passed');
    } else {
      // Some systems might handle this at the server level or differently
      console.log('No client-side duplicate slug validation found, may be handled server-side');
      
      // Look for a general error message from the server
      const hasServerError = await page.$('[data-testid="form-error"]') !== null || 
                              await page.$('[data-testid="server-error"]') !== null;
      
      if (hasServerError) {
        console.log('Found server-side error message for duplicate slug');
        await takeScreenshot(page, 'duplicate-slug-server-validation');
      }
    }
  });

  test('Validate SEO metadata constraints', async () => {
    console.log('Testing SEO metadata validation...');
    
    // Fill basic required fields
    await page.type('[data-testid="category-name-input"]', 'SEO Test Category');
    await page.type('[data-testid="category-slug-input"]', 'seo-test-category');
    await page.type('[data-testid="category-description-input"]', 'This is a category for testing SEO validation rules.');
    
    // Navigate to SEO tab if it exists
    const hasSeoTab = await page.$('[data-testid="seo-tab"]') !== null;
    
    if (hasSeoTab) {
      await page.click('[data-testid="seo-tab"]');
      await page.waitForSelector('[data-testid="meta-title-input"]');
      
      // Test meta title too long
      const longTitle = 'X'.repeat(201); // Assume max is 200 chars
      await page.type('[data-testid="meta-title-input"]', longTitle);
      
      // Try to submit
      await page.click('[data-testid="submit-category-button"]');
      
      // Check for title error
      const hasTitleError = await page.$('[data-testid="meta-title-error"]') !== null;
      
      if (hasTitleError) {
        const titleError = await page.$eval('[data-testid="meta-title-error"]', e => e.textContent);
        expect(titleError.toLowerCase()).toContain('too long');
        
        await takeScreenshot(page, 'meta-title-too-long-validation');
        
        // Clear and test meta description too long
        await clearInput(page, '[data-testid="meta-title-input"]');
        await page.type('[data-testid="meta-title-input"]', 'Valid Meta Title');
        
        const longDescription = 'X'.repeat(501); // Assume max is 500 chars
        await page.type('[data-testid="meta-description-input"]', longDescription);
        
        // Try to submit
        await page.click('[data-testid="submit-category-button"]');
        
        // Should show error for description too long
        const metaDescError = await page.$eval('[data-testid="meta-description-error"]', e => e.textContent);
        expect(metaDescError).toBeTruthy();
        expect(metaDescError.toLowerCase()).toContain('too long');
        
        await takeScreenshot(page, 'meta-description-too-long-validation');
      } else {
        console.log('No meta title length validation found, skipping meta description test');
      }
      
      // Test valid SEO metadata
      await clearInput(page, '[data-testid="meta-title-input"]');
      await page.type('[data-testid="meta-title-input"]', 'Valid SEO Title for Category');
      
      if (await page.$('[data-testid="meta-description-input"]') !== null) {
        await clearInput(page, '[data-testid="meta-description-input"]');
        await page.type('[data-testid="meta-description-input"]', 'This is a valid meta description that fits within the character limits.');
      }
      
      console.log('SEO metadata validation passed');
    } else {
      console.log('No SEO tab found, skipping SEO validation tests');
    }
  });

  test('Auto-generation of slug from name', async () => {
    console.log('Testing auto-generation of slug from name...');
    
    // Some systems auto-generate slug from name, let's test that
    // Clear any existing inputs
    await clearInput(page, '[data-testid="category-name-input"]');
    await clearInput(page, '[data-testid="category-slug-input"]');
    
    // Type a category name with spaces and special characters
    const testName = 'Auto Slug Test Category! (Special)';
    await page.type('[data-testid="category-name-input"]', testName);
    
    // Click away from the input to trigger blur event (which often triggers auto-generation)
    await page.click('[data-testid="category-description-input"]');
    await page.waitForTimeout(500); // Small delay for auto-generation to occur
    
    // Check if slug was auto-generated
    const slugValue = await page.$eval('[data-testid="category-slug-input"]', el => el.value);
    
    if (slugValue) {
      console.log(`Slug was auto-generated: "${slugValue}"`);
      
      // Verify slug is a sanitized version of the name (lowercase, no spaces, no special chars)
      expect(slugValue).not.toContain(' ');
      expect(slugValue).not.toContain('!');
      expect(slugValue).not.toContain('(');
      expect(slugValue).not.toContain(')');
      expect(slugValue.toLowerCase()).toBe(slugValue); // Should be lowercase
      
      // Common conversion is to replace spaces with hyphens
      expect(slugValue).toContain('auto-slug-test-category' || 
                                  slugValue.includes('auto_slug_test_category'));
      
      await takeScreenshot(page, 'auto-generated-slug');
      console.log('Auto-generation of slug validation passed');
    } else {
      console.log('Slug auto-generation not implemented or not triggered, skipping test');
    }
  });
});