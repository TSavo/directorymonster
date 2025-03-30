/**
 * @file Admin Site Creation Flow Test
 * @description End-to-end test for the complete site creation process
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
const SCREENSHOT_DIR = './screenshots/site-creation';

// Test data for site creation
const TEST_SITE = {
  name: `Test Site ${Date.now()}`,
  subdomain: `test-site-${Date.now()}`,
  description: 'An automated test site created by E2E tests',
  category: 'Outdoor Equipment',
  theme: 'Modern',
  customDomain: '',
  metaTitle: 'Test Site | DirectoryMonster',
  metaDescription: 'This is a test site created by automated E2E testing',
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
 * Admin Site Creation Flow Test
 */
describe('Admin Site Creation Flow', () => {
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

  test('Complete site creation flow', async () => {
    // Step 1: Navigate to site creation page
    await page.click('[data-testid="create-site-button"]');
    await page.waitForSelector('[data-testid="site-form"]');
    await takeScreenshot(page, 'site-creation-start');
    
    // Step 2: Fill Basic Info (Step 1)
    console.log('Filling basic site information...');
    await page.waitForSelector('[data-testid="site-name-input"]');
    await page.type('[data-testid="site-name-input"]', TEST_SITE.name);
    await page.type('[data-testid="site-subdomain-input"]', TEST_SITE.subdomain);
    await page.type('[data-testid="site-description-input"]', TEST_SITE.description);
    
    // Select category from dropdown
    await page.click('[data-testid="site-category-select"]');
    await page.waitForSelector(`[data-testid="category-option-${TEST_SITE.category}"]`);
    await page.click(`[data-testid="category-option-${TEST_SITE.category}"]`);
    
    await takeScreenshot(page, 'site-creation-basic-info');
    
    // Navigate to next step
    await page.click('[data-testid="next-step-button"]');
    
    // Step 3: Domain Settings (Step 2)
    console.log('Configuring domain settings...');
    await page.waitForSelector('[data-testid="domain-step"]');
    
    // Verify subdomain is displayed correctly
    const subdomainText = await page.$eval('[data-testid="subdomain-preview"]', el => el.textContent);
    expect(subdomainText).toContain(TEST_SITE.subdomain);
    
    // Skip custom domain for test
    await takeScreenshot(page, 'site-creation-domains');
    
    // Navigate to next step
    await page.click('[data-testid="next-step-button"]');
    
    // Step 4: Theme Selection (Step 3)
    console.log('Selecting site theme...');
    await page.waitForSelector('[data-testid="theme-step"]');
    
    // Select theme
    await page.click(`[data-testid="theme-option-${TEST_SITE.theme}"]`);
    await takeScreenshot(page, 'site-creation-theme');
    
    // Navigate to next step
    await page.click('[data-testid="next-step-button"]');
    
    // Step 5: SEO Settings (Step 4)
    console.log('Configuring SEO settings...');
    await page.waitForSelector('[data-testid="seo-step"]');
    
    // Fill SEO fields
    await page.type('[data-testid="meta-title-input"]', TEST_SITE.metaTitle);
    await page.type('[data-testid="meta-description-input"]', TEST_SITE.metaDescription);
    await takeScreenshot(page, 'site-creation-seo');
    
    // Navigate to preview
    await page.click('[data-testid="next-step-button"]');
    
    // Step 6: Preview and Submit
    console.log('Reviewing site preview...');
    await page.waitForSelector('[data-testid="site-preview"]');
    
    // Verify preview contains correct information
    const previewText = await page.$eval('[data-testid="site-preview"]', el => el.textContent);
    expect(previewText).toContain(TEST_SITE.name);
    expect(previewText).toContain(TEST_SITE.subdomain);
    
    await takeScreenshot(page, 'site-creation-preview');
    
    // Submit form
    await Promise.all([
      page.click('[data-testid="submit-site-button"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
    ]);
    
    // Step 7: Verify site was created successfully
    console.log('Verifying site creation success...');
    await page.waitForSelector('[data-testid="site-management-page"]');
    
    // Check for success notification
    await page.waitForSelector('[data-testid="success-notification"]');
    const notificationText = await page.$eval('[data-testid="success-notification"]', el => el.textContent);
    expect(notificationText).toContain('Site created successfully');
    
    // Verify site appears in the site table
    const tableContent = await page.$eval('[data-testid="site-table"]', el => el.textContent);
    expect(tableContent).toContain(TEST_SITE.name);
    
    await takeScreenshot(page, 'site-creation-complete');
    console.log('Site creation flow completed successfully');
  });
});