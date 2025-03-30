/**
 * @file Admin Listing Creation Flow Test
 * @description End-to-end test for the complete listing creation process
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
const SCREENSHOT_DIR = './screenshots/listing-creation';

// Test data for listing creation
const TEST_LISTING = {
  title: `Test Listing ${Date.now()}`,
  description: 'This is an automated test listing created by E2E tests.',
  category: 'Outdoor Equipment', // Use an existing category
  price: '99.99',
  address: '123 Test Street, Test City, 12345',
  website: 'https://example.com',
  phone: '555-123-4567',
  email: 'test@example.com',
  features: ['Feature 1', 'Feature 2', 'Feature 3'],
  status: 'Active'
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
 * Admin Listing Creation Flow Test
 */
describe('Admin Listing Creation Flow', () => {
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

  // Reset to listings page before each test
  beforeEach(async () => {
    await page.goto(`${BASE_URL}/admin/listings`);
    await page.waitForSelector('[data-testid="listing-management-page"]');
  });

  test('Complete listing creation flow', async () => {
    // Step 1: Navigate to listing creation page
    await page.click('[data-testid="create-listing-button"]');
    await page.waitForSelector('[data-testid="listing-form"]');
    await takeScreenshot(page, 'listing-creation-start');
    
    // Step 2: Fill Basic Info (Step 1)
    console.log('Filling basic listing information...');
    await page.waitForSelector('[data-testid="listing-title-input"]');
    await page.type('[data-testid="listing-title-input"]', TEST_LISTING.title);
    await page.type('[data-testid="listing-description-input"]', TEST_LISTING.description);
    
    // Select category from dropdown
    await page.click('[data-testid="listing-category-select"]');
    await page.waitForTimeout(500); // Wait for dropdown to populate
    
    // Find and select category by name
    const categoryFound = await page.evaluate((categoryName) => {
      const options = Array.from(document.querySelectorAll('[data-testid^="category-option-"]'));
      const option = options.find(opt => opt.textContent.includes(categoryName));
      if (option) {
        option.click();
        return true;
      }
      return false;
    }, TEST_LISTING.category);
    
    // If exact category not found, select the first available category
    if (!categoryFound) {
      console.log('Specified category not found, selecting first available category');
      await page.click('[data-testid^="category-option-"]:first-of-type');
    }
    
    // Price (if applicable)
    if (await page.$('[data-testid="listing-price-input"]') !== null) {
      await page.type('[data-testid="listing-price-input"]', TEST_LISTING.price);
    }
    
    await takeScreenshot(page, 'listing-basic-info');
    
    // Navigate to next step
    await page.click('[data-testid="next-step-button"]');
    
    // Step 3: Contact Details (Step 2)
    console.log('Filling contact details...');
    await page.waitForSelector('[data-testid="listing-contact-step"]');
    
    // Fill contact details if the fields exist
    if (await page.$('[data-testid="listing-address-input"]') !== null) {
      await page.type('[data-testid="listing-address-input"]', TEST_LISTING.address);
    }
    
    if (await page.$('[data-testid="listing-website-input"]') !== null) {
      await page.type('[data-testid="listing-website-input"]', TEST_LISTING.website);
    }
    
    if (await page.$('[data-testid="listing-phone-input"]') !== null) {
      await page.type('[data-testid="listing-phone-input"]', TEST_LISTING.phone);
    }
    
    if (await page.$('[data-testid="listing-email-input"]') !== null) {
      await page.type('[data-testid="listing-email-input"]', TEST_LISTING.email);
    }
    
    await takeScreenshot(page, 'listing-contact-details');
    
    // Navigate to next step
    await page.click('[data-testid="next-step-button"]');
    
    // Step 4: Features and Attributes (Step 3)
    console.log('Adding features and attributes...');
    await page.waitForSelector('[data-testid="listing-features-step"]');
    
    // Add features if the feature input exists
    if (await page.$('[data-testid="listing-feature-input"]') !== null) {
      for (const feature of TEST_LISTING.features) {
        await page.type('[data-testid="listing-feature-input"]', feature);
        await page.click('[data-testid="add-feature-button"]');
        await page.waitForTimeout(300); // Wait for feature to be added
      }
    }
    
    // Set custom attributes if they exist
    const hasAttributes = await page.$('[data-testid="listing-attributes-section"]') !== null;
    if (hasAttributes) {
      // Fill the first few attributes as examples
      const attributeInputs = await page.$$('[data-testid^="attribute-input-"]');
      if (attributeInputs.length > 0) {
        await attributeInputs[0].type('Sample attribute value');
      }
    }
    
    await takeScreenshot(page, 'listing-features-attributes');
    
    // Navigate to next step
    await page.click('[data-testid="next-step-button"]');
    
    // Step 5: Media and Images (Step 4)
    console.log('Handling media and images step...');
    
    // Check if media step exists
    const hasMediaStep = await page.$('[data-testid="listing-media-step"]') !== null;
    if (hasMediaStep) {
      await page.waitForSelector('[data-testid="listing-media-step"]');
      
      // Since we can't upload files in this test, we'll just check the UI
      const hasImageUpload = await page.$('[data-testid="image-upload-section"]') !== null;
      expect(hasImageUpload).toBe(true);
      
      await takeScreenshot(page, 'listing-media-section');
      
      // Navigate to next step
      await page.click('[data-testid="next-step-button"]');
    }
    
    // Step 6: Review and Submit
    console.log('Reviewing and submitting listing...');
    await page.waitForSelector('[data-testid="listing-review-step"]');
    
    // Verify that preview contains our listing title
    const previewText = await page.$eval('[data-testid="listing-preview"]', el => el.textContent);
    expect(previewText).toContain(TEST_LISTING.title);
    
    await takeScreenshot(page, 'listing-review');
    
    // Submit the listing
    await Promise.all([
      page.click('[data-testid="submit-listing-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Step 7: Verify listing was created successfully
    console.log('Verifying listing creation success...');
    await page.waitForSelector('[data-testid="listing-management-page"]');
    
    // Check for success notification
    await page.waitForSelector('[data-testid="success-notification"]');
    const notificationText = await page.$eval('[data-testid="success-notification"]', el => el.textContent);
    expect(notificationText).toContain('created successfully');
    
    // Verify listing appears in the listing table
    const tableContent = await page.$eval('[data-testid="listing-table"]', el => el.textContent);
    expect(tableContent).toContain(TEST_LISTING.title);
    
    await takeScreenshot(page, 'listing-creation-complete');
    console.log('Listing creation flow completed successfully');
  });

  test('Create draft listing flow', async () => {
    // Test creating a listing as a draft
    
    // Step 1: Navigate to listing creation page
    await page.click('[data-testid="create-listing-button"]');
    await page.waitForSelector('[data-testid="listing-form"]');
    
    // Step 2: Fill minimum required fields
    console.log('Creating draft listing with minimal information...');
    
    const DRAFT_LISTING = {
      title: `Draft Listing ${Date.now()}`,
      description: 'This is a draft listing for testing',
    };
    
    await page.type('[data-testid="listing-title-input"]', DRAFT_LISTING.title);
    await page.type('[data-testid="listing-description-input"]', DRAFT_LISTING.description);
    
    // Select first available category
    await page.click('[data-testid="listing-category-select"]');
    await page.waitForTimeout(500);
    await page.click('[data-testid^="category-option-"]:first-of-type');
    
    await takeScreenshot(page, 'draft-listing-minimal-info');
    
    // Look for a "Save as Draft" button
    const hasDraftButton = await page.$('[data-testid="save-as-draft-button"]') !== null;
    
    if (hasDraftButton) {
      // Save as draft
      await Promise.all([
        page.click('[data-testid="save-as-draft-button"]'),
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
      ]);
      
      // Verify draft was saved
      await page.waitForSelector('[data-testid="success-notification"]');
      
      // Check if we can find the draft in the listing table
      if (await page.$('[data-testid="status-filter-dropdown"]') !== null) {
        // Filter to show drafts
        await page.click('[data-testid="status-filter-dropdown"]');
        await page.click('[data-testid="status-option-draft"]');
        await page.waitForTimeout(500);
      }
      
      const tableContent = await page.$eval('[data-testid="listing-table"]', el => el.textContent);
      expect(tableContent).toContain(DRAFT_LISTING.title);
      
      // Look for draft status indicator
      const draftStatus = await page.evaluate((title) => {
        const rows = Array.from(document.querySelectorAll('[data-testid="listing-row"]'));
        const row = rows.find(r => r.textContent.includes(title));
        if (row) {
          const status = row.querySelector('[data-testid="listing-status"]');
          return status ? status.textContent : '';
        }
        return '';
      }, DRAFT_LISTING.title);
      
      expect(draftStatus.toLowerCase()).toContain('draft');
      
      await takeScreenshot(page, 'draft-listing-saved');
      console.log('Draft listing creation flow completed successfully');
    } else {
      console.log('No draft button found, skipping draft test');
      // Just cancel the form
      await page.click('[data-testid="cancel-button"]');
    }
  });
});