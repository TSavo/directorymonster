/**
 * @file Admin Site Validation Tests
 * @description End-to-end tests for validation behavior during site creation/editing
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
const SCREENSHOT_DIR = './screenshots/site-validation';

// Test data with validation issues
const INVALID_SITE_DATA = {
  emptyName: {
    name: '',
    subdomain: 'test-site-validation',
    description: 'Testing validation for empty name'
  },
  invalidSubdomain: {
    name: 'Validation Test Site',
    subdomain: 'invalid subdomain with spaces',
    description: 'Testing validation for invalid subdomain'
  },
  tooShortDescription: {
    name: 'Validation Test Site',
    subdomain: 'validation-test',
    description: 'Too short'
  },
  invalidDomain: {
    customDomain: 'not-a-valid-domain'
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
 * Admin Site Validation Tests
 */
describe('Admin Site Validation', () => {
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

  // Navigate to site creation form before each test
  beforeEach(async () => {
    await page.goto(`${BASE_URL}/admin/sites`);
    await page.waitForSelector('[data-testid="site-management-page"]');
    
    // Navigate to site creation form
    await page.click('[data-testid="create-site-button"]');
    await page.waitForSelector('[data-testid="site-form"]');
  });

  test('Validate required fields', async () => {
    console.log('Testing required field validation...');
    
    // Try to proceed without filling any fields
    await page.click('[data-testid="next-step-button"]');
    await takeScreenshot(page, 'empty-form-validation');
    
    // Check for error messages
    const errorMessages = await page.$$eval('[data-testid="field-error"]', errors => errors.map(e => e.textContent));
    
    // Verify at least the required field errors appear
    expect(errorMessages.length).toBeGreaterThan(0);
    expect(errorMessages.some(msg => msg.includes('name'))).toBe(true);
    expect(errorMessages.some(msg => msg.includes('subdomain'))).toBe(true);
    
    // Try with only name field
    await page.type('[data-testid="site-name-input"]', 'Validation Test Site');
    await page.click('[data-testid="next-step-button"]');
    
    // Should still show error for subdomain
    const subdomainError = await page.$eval('[data-testid="subdomain-error"]', e => e.textContent);
    expect(subdomainError).toBeTruthy();
    
    await takeScreenshot(page, 'partial-form-validation');
  });

  test('Validate site name constraints', async () => {
    console.log('Testing site name validation...');
    
    // Test too short name (1-2 characters)
    await page.type('[data-testid="site-name-input"]', 'A');
    await page.click('[data-testid="next-step-button"]');
    
    // Should show error for name too short
    const nameError = await page.$eval('[data-testid="name-error"]', e => e.textContent);
    expect(nameError).toBeTruthy();
    expect(nameError.toLowerCase()).toContain('too short');
    
    await takeScreenshot(page, 'name-too-short-validation');
    
    // Test valid name
    await clearInput(page, '[data-testid="site-name-input"]');
    await page.type('[data-testid="site-name-input"]', 'Valid Site Name');
    
    // Fill subdomain to prevent other validation errors
    await page.type('[data-testid="site-subdomain-input"]', 'valid-subdomain');
    await page.type('[data-testid="site-description-input"]', 'This is a valid site description for testing validation rules.');
    
    // Try to proceed
    await page.click('[data-testid="next-step-button"]');
    
    // Should proceed to next step if name is valid
    await page.waitForSelector('[data-testid="domain-step"]');
    
    console.log('Site name validation passed');
  });

  test('Validate subdomain format', async () => {
    console.log('Testing subdomain validation...');
    
    // Fill valid name and description
    await page.type('[data-testid="site-name-input"]', 'Subdomain Test Site');
    await page.type('[data-testid="site-description-input"]', 'Testing subdomain validation rules.');
    
    // Test invalid subdomain with spaces
    await page.type('[data-testid="site-subdomain-input"]', 'invalid subdomain with spaces');
    await page.click('[data-testid="next-step-button"]');
    
    // Should show error for invalid subdomain format
    const subdomainError = await page.$eval('[data-testid="subdomain-error"]', e => e.textContent);
    expect(subdomainError).toBeTruthy();
    expect(subdomainError.toLowerCase()).toContain('invalid');
    
    await takeScreenshot(page, 'invalid-subdomain-validation');
    
    // Test subdomain with special characters
    await clearInput(page, '[data-testid="site-subdomain-input"]');
    await page.type('[data-testid="site-subdomain-input"]', 'invalid$subdomain#');
    await page.click('[data-testid="next-step-button"]');
    
    // Should still show error
    const specialCharError = await page.$eval('[data-testid="subdomain-error"]', e => e.textContent);
    expect(specialCharError).toBeTruthy();
    
    await takeScreenshot(page, 'special-char-subdomain-validation');
    
    // Test valid subdomain
    await clearInput(page, '[data-testid="site-subdomain-input"]');
    await page.type('[data-testid="site-subdomain-input"]', 'valid-subdomain-123');
    await page.click('[data-testid="next-step-button"]');
    
    // Should proceed to next step if subdomain is valid
    await page.waitForSelector('[data-testid="domain-step"]');
    
    console.log('Subdomain validation passed');
  });

  test('Validate description length', async () => {
    console.log('Testing description length validation...');
    
    // Fill valid name and subdomain
    await page.type('[data-testid="site-name-input"]', 'Description Test Site');
    await page.type('[data-testid="site-subdomain-input"]', 'description-test');
    
    // Test too short description
    await page.type('[data-testid="site-description-input"]', 'Too short');
    await page.click('[data-testid="next-step-button"]');
    
    // Should show error for description too short
    const descError = await page.$eval('[data-testid="description-error"]', e => e.textContent);
    expect(descError).toBeTruthy();
    expect(descError.toLowerCase()).toContain('too short');
    
    await takeScreenshot(page, 'description-too-short-validation');
    
    // Test very long description
    await clearInput(page, '[data-testid="site-description-input"]');
    const longDescription = 'A'.repeat(1001); // Assume max is 1000 chars
    await page.type('[data-testid="site-description-input"]', longDescription);
    await page.click('[data-testid="next-step-button"]');
    
    // Should show error for description too long
    const longDescError = await page.$eval('[data-testid="description-error"]', e => e.textContent);
    expect(longDescError).toBeTruthy();
    expect(longDescError.toLowerCase()).toContain('too long');
    
    await takeScreenshot(page, 'description-too-long-validation');
    
    // Test valid description
    await clearInput(page, '[data-testid="site-description-input"]');
    await page.type('[data-testid="site-description-input"]', 'This is a valid site description with enough characters to pass validation but not too many to exceed the maximum length. It describes the purpose and content of the test site adequately.');
    await page.click('[data-testid="next-step-button"]');
    
    // Should proceed to next step if description is valid
    await page.waitForSelector('[data-testid="domain-step"]');
    
    console.log('Description validation passed');
  });

  test('Validate custom domain format', async () => {
    console.log('Testing custom domain validation...');
    
    // First fill basic info and proceed to domain step
    await page.type('[data-testid="site-name-input"]', 'Domain Test Site');
    await page.type('[data-testid="site-subdomain-input"]', 'domain-test');
    await page.type('[data-testid="site-description-input"]', 'This is a site for testing custom domain validation rules.');
    await page.click('[data-testid="next-step-button"]');
    
    // Wait for domain step to load
    await page.waitForSelector('[data-testid="domain-step"]');
    
    // Test invalid domain format
    await page.type('[data-testid="custom-domain-input"]', 'not_a_valid_domain');
    
    // Try to proceed to next step
    await page.click('[data-testid="next-step-button"]');
    
    // Should show error for invalid domain format
    const domainError = await page.$eval('[data-testid="domain-error"]', e => e.textContent);
    expect(domainError).toBeTruthy();
    expect(domainError.toLowerCase()).toContain('invalid');
    
    await takeScreenshot(page, 'invalid-domain-validation');
    
    // Test valid domain
    await clearInput(page, '[data-testid="custom-domain-input"]');
    await page.type('[data-testid="custom-domain-input"]', 'valid-domain.com');
    await page.click('[data-testid="next-step-button"]');
    
    // Should proceed to next step if domain is valid
    await page.waitForSelector('[data-testid="theme-step"]');
    
    console.log('Custom domain validation passed');
  });

  test('Validate SEO metadata constraints', async () => {
    console.log('Testing SEO metadata validation...');
    
    // Fill all previous steps to reach SEO step
    // Basic info
    await page.type('[data-testid="site-name-input"]', 'SEO Test Site');
    await page.type('[data-testid="site-subdomain-input"]', 'seo-test');
    await page.type('[data-testid="site-description-input"]', 'This is a site for testing SEO metadata validation rules.');
    await page.click('[data-testid="next-step-button"]');
    
    // Domain step
    await page.waitForSelector('[data-testid="domain-step"]');
    await page.click('[data-testid="next-step-button"]');
    
    // Theme step
    await page.waitForSelector('[data-testid="theme-step"]');
    await page.click('[data-testid="next-step-button"]');
    
    // SEO step
    await page.waitForSelector('[data-testid="seo-step"]');
    
    // Test meta title too long
    const longTitle = 'X'.repeat(201); // Assume max is 200 chars
    await page.type('[data-testid="meta-title-input"]', longTitle);
    
    // Try to proceed to preview
    await page.click('[data-testid="next-step-button"]');
    
    // Should show error for title too long
    const titleError = await page.$eval('[data-testid="meta-title-error"]', e => e.textContent);
    expect(titleError).toBeTruthy();
    expect(titleError.toLowerCase()).toContain('too long');
    
    await takeScreenshot(page, 'meta-title-too-long-validation');
    
    // Clear and test meta description too long
    await clearInput(page, '[data-testid="meta-title-input"]');
    await page.type('[data-testid="meta-title-input"]', 'Valid Meta Title');
    
    const longDescription = 'X'.repeat(501); // Assume max is 500 chars
    await page.type('[data-testid="meta-description-input"]', longDescription);
    
    // Try to proceed to preview
    await page.click('[data-testid="next-step-button"]');
    
    // Should show error for description too long
    const metaDescError = await page.$eval('[data-testid="meta-description-error"]', e => e.textContent);
    expect(metaDescError).toBeTruthy();
    expect(metaDescError.toLowerCase()).toContain('too long');
    
    await takeScreenshot(page, 'meta-description-too-long-validation');
    
    // Test valid SEO metadata
    await clearInput(page, '[data-testid="meta-description-input"]');
    await page.type('[data-testid="meta-description-input"]', 'This is a valid meta description that fits within the character limits and provides good SEO value for search engines.');
    
    // Try to proceed to preview
    await page.click('[data-testid="next-step-button"]');
    
    // Should proceed to preview step if SEO metadata is valid
    await page.waitForSelector('[data-testid="site-preview"]');
    
    console.log('SEO metadata validation passed');
  });

  test('Form persists data between steps', async () => {
    console.log('Testing data persistence between form steps...');
    
    const testData = {
      name: 'Data Persistence Test',
      subdomain: 'data-persistence',
      description: 'Testing if data persists between form steps'
    };
    
    // Fill basic info
    await page.type('[data-testid="site-name-input"]', testData.name);
    await page.type('[data-testid="site-subdomain-input"]', testData.subdomain);
    await page.type('[data-testid="site-description-input"]', testData.description);
    
    // Proceed to domain step
    await page.click('[data-testid="next-step-button"]');
    await page.waitForSelector('[data-testid="domain-step"]');
    
    // Proceed to theme step
    await page.click('[data-testid="next-step-button"]');
    await page.waitForSelector('[data-testid="theme-step"]');
    
    // Proceed to SEO step
    await page.click('[data-testid="next-step-button"]');
    await page.waitForSelector('[data-testid="seo-step"]');
    
    // Go back to basic info step
    await page.click('[data-testid="go-to-step-1"]');
    await page.waitForSelector('[data-testid="site-name-input"]');
    
    // Verify data persisted
    const nameValue = await page.$eval('[data-testid="site-name-input"]', el => el.value);
    const subdomainValue = await page.$eval('[data-testid="site-subdomain-input"]', el => el.value);
    const descriptionValue = await page.$eval('[data-testid="site-description-input"]', el => el.value);
    
    expect(nameValue).toBe(testData.name);
    expect(subdomainValue).toBe(testData.subdomain);
    expect(descriptionValue).toBe(testData.description);
    
    await takeScreenshot(page, 'data-persistence-verification');
    console.log('Data persistence between steps verified');
  });
});