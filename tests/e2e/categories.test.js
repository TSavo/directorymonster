/**
 * @file E2E tests for category management functionality
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123456';
const CATEGORY_PREFIX = 'Test Category';
const SITE_SLUG = 'fishing-gear'; // Use the site slug from our seeded data

// Test timeouts
const DEFAULT_TIMEOUT = 30000;
const NAVIGATION_TIMEOUT = 15000;
const FORM_TIMEOUT = 5000;

// Helper function to generate unique category name
const getUniqueCategoryName = () => `${CATEGORY_PREFIX} ${Date.now()}`;

// Helper function for waiting/delaying execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

describe('Category Management', () => {
  let browser;
  let page;

  // Helper functions
  async function loginAsAdmin() {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2' });
    
    // Check if we're on the first user setup page
    const isFirstUserSetup = await page.evaluate(() => {
      const pageContent = document.body.textContent;
      return (
        pageContent.includes('First User Setup') ||
        pageContent.includes('Create Admin Account') ||
        pageContent.includes('Initialize System') ||
        pageContent.includes('Create First User') ||
        pageContent.includes('Setup My Account')
      );
    });
    
    if (isFirstUserSetup) {
      console.log('Detected first user setup page, setting up initial admin user');
      
      // Find all form fields for first user setup
      const usernameField = await page.$('input[type="text"], input[id="username"], input[name="username"], input[id="email"], input[name="email"]');
      const passwordField = await page.$('input[type="password"], input[id="password"], input[name="password"]');
      const confirmPasswordField = await page.$('input[id="confirmPassword"], input[name="confirmPassword"], input[placeholder*="confirm"]');
      const submitButton = await page.$('button[type="submit"], input[type="submit"]');
      
      // Optional fields that might be present in setup forms
      const nameField = await page.$('input[id="name"], input[name="name"]');
      const emailField = nameField ? await page.$('input[id="email"], input[name="email"]') : null;
      const siteNameField = await page.$('input[id="siteName"], input[name="siteName"]');
      
      // Fill in required fields
      await usernameField.type(ADMIN_USERNAME);
      await passwordField.type(ADMIN_PASSWORD);
      
      // Fill optional fields if they exist
      if (confirmPasswordField) {
        await confirmPasswordField.type(ADMIN_PASSWORD);
      }
      
      if (nameField) {
        await nameField.type('Admin User');
      }
      
      if (emailField) {
        await emailField.type('admin@example.com');
      }
      
      if (siteNameField) {
        await siteNameField.type('Test Directory');
      }
      
      // Click the submit button
      await submitButton.click();
      
      // Wait for navigation to complete with increased timeout
      try {
        await page.waitForNavigation({
          waitUntil: 'networkidle2',
          timeout: 30000, // Increased timeout to 30 seconds
        });
      } catch (error) {
        console.log('Navigation timeout occurred, waiting for admin page elements instead');
        
        await page.waitForFunction(
          () => {
            return document.body.textContent.includes('Dashboard') || 
                  document.querySelector('h1')?.textContent.includes('Dashboard') ||
                  window.location.href.includes('/admin');
          },
          { timeout: 30000 }
        );
      }
      
      console.log('First user setup completed');
    } else {
      console.log('On regular login page, logging in with admin credentials');
      await page.type('#username', ADMIN_USERNAME);
      await page.type('#password', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
    }
    
    try {
      await Promise.race([
        page.waitForFunction(
          () => window.location.href.includes('/admin'),
          { timeout: NAVIGATION_TIMEOUT }
        ),
        page.waitForSelector('.admin-header, .dashboard, [data-testid="admin-dashboard"]', { timeout: NAVIGATION_TIMEOUT })
      ]);
    } catch (error) {
      console.log('Login navigation issue, trying manual navigation');
      await page.goto(`${BASE_URL}/admin`);
    }
    
    const currentUrl = await page.url();
    console.log(`After login, current URL: ${currentUrl}`);
    expect(currentUrl).toContain('/admin');
  }

  /**
   * Navigates to the categories page for the specified site
   * @returns {Promise<void>}
   */
  async function navigateToCategories() {
    // Navigate to admin dashboard first to ensure we're logged in properly
    await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle2' });
    console.log('On admin dashboard, navigating to categories page');
    
    // Then navigate to the categories page for the fishing-gear site
    await page.goto(`${BASE_URL}/admin/sites/${SITE_SLUG}/categories`, { waitUntil: 'networkidle2' });
    console.log(`Navigated to ${BASE_URL}/admin/sites/${SITE_SLUG}/categories`);
    
    // Wait for the page to load
    await delay(1000);
    
    const currentUrl = await page.url();
    console.log(`Current URL: ${currentUrl}`);
    
    // Check for category management elements
    const categoryManagementExists = await page.evaluate(() => {
      // Look for category table or related elements
      const tableExists = document.querySelector('.category-table, [data-testid="category-table"]') !== null;
      const categoriesExist = document.querySelectorAll('tr, .category-item').length > 1;
      const addButtonExists = Array.from(document.querySelectorAll('button')).some(btn => 
        btn.textContent && btn.textContent.match(/add|create|new/i)
      );
      
      return tableExists || categoriesExist || addButtonExists;
    });
    
    console.log(`Page has category management elements: ${categoryManagementExists}`);
    expect(categoryManagementExists).toBe(true);
  }

  async function createCategory(name, parentName = null) {
    // Click Add Category button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButton = buttons.find(btn => 
        btn.textContent && (
          btn.textContent.includes('Add Category') || 
          btn.textContent.includes('Create') || 
          btn.textContent.includes('New')
        )
      );
      if (addButton) addButton.click();
    });
    
    // Wait for form
    await page.waitForSelector('form input[name="name"], form input[id="name"]', { timeout: FORM_TIMEOUT });
    
    // Enter category name
    await page.type('input[name="name"], input[id="name"]', name);
    
    // Select parent if provided
    if (parentName) {
      const parentSelector = 'select[name="parentId"], select[id="parentId"]';
      const hasParentDropdown = await page.$(parentSelector) !== null;
      
      if (hasParentDropdown) {
        await page.evaluate((selector, parent) => {
          const dropdown = document.querySelector(selector);
          const options = Array.from(dropdown.options);
          const option = options.find(opt => opt.text.includes(parent));
          if (option) dropdown.value = option.value;
        }, parentSelector, parentName);
      }
    }
    
    // Submit form
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('form button'));
      const saveButton = buttons.find(btn => 
        btn.textContent && (
          btn.textContent.includes('Save') || 
          btn.textContent.includes('Create') || 
          btn.type === 'submit'
        )
      );
      if (saveButton) saveButton.click();
    });
    
    // Wait for API response
    await page.waitForResponse(
      response => response.url().includes('/api/sites/') && response.url().includes('/categories'),
      { timeout: NAVIGATION_TIMEOUT }
    );
    
    // Wait for UI update
    await delay(500);
  }

  // Set up the browser and page before running tests
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      devtools: process.env.NODE_ENV !== 'production',
      args: ['--disable-gpu', '--disable-dev-shm-usage', '--disable-setuid-sandbox', '--no-sandbox'],
    });
    
    page = await browser.newPage();
    page.setDefaultTimeout(DEFAULT_TIMEOUT);
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);
    await page.setViewport({ width: 1280, height: 800 });

    // Add hostname for multitenancy
    await page.setCookie({
      name: 'hostname',
      value: SITE_DOMAIN,
      domain: 'localhost',
      path: '/',
    });

    // Login as admin first
    await loginAsAdmin();
    
    // Debug logging - only log messages when DEBUG env var is set
    page.on('console', (message) => {
      if (process.env.DEBUG) {
        console.log(`Browser console: ${message.text()}`);
      }
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    if (browser) await browser.close();
  });

  // Tests
  test('Category listing page loads correctly', async () => {
    await navigateToCategories();
    
    // Check that at least one of these selectors finds something
    const categoryManagementExists = await page.evaluate(() => {
      // Try multiple selector strategies to find the category table or related elements
      const tableExists = document.querySelector('.category-table, [data-testid="category-table"]') !== null;
      const categoriesExist = document.querySelectorAll('tr, .category-item').length > 1;
      const addButtonExists = Array.from(document.querySelectorAll('button')).some(btn => 
        btn.textContent && btn.textContent.match(/add|create|new/i)
      );
      
      return tableExists || categoriesExist || addButtonExists;
    });
    
    expect(categoryManagementExists).toBe(true);
  });

  test('Creates a new category', async () => {
    const categoryName = getUniqueCategoryName();
    await navigateToCategories();
    await createCategory(categoryName);
    
    // Verify category appears in table
    const categoryExists = await page.evaluate((name) => {
      const cells = Array.from(document.querySelectorAll('td, .category-name'));
      return cells.some(cell => cell.textContent && cell.textContent.includes(name));
    }, categoryName);
    
    expect(categoryExists).toBe(true);
  });

  test('Creates a child category', async () => {
    const parentName = getUniqueCategoryName() + ' Parent';
    const childName = getUniqueCategoryName() + ' Child';
    
    await navigateToCategories();
    await createCategory(parentName);
    await createCategory(childName, parentName);
    
    // Verify both categories exist
    const categoriesExist = await page.evaluate((parent, child) => {
      const cells = Array.from(document.querySelectorAll('td, .category-name'));
      const parentExists = cells.some(cell => cell.textContent && cell.textContent.includes(parent));
      const childExists = cells.some(cell => cell.textContent && cell.textContent.includes(child));
      return { parentExists, childExists };
    }, parentName, childName);
    
    expect(categoriesExist.parentExists).toBe(true);
    expect(categoriesExist.childExists).toBe(true);
  });

  test('Edits an existing category', async () => {
    const categoryName = getUniqueCategoryName();
    const updatedName = categoryName + ' Updated';
    
    await navigateToCategories();
    await createCategory(categoryName);
    
    // Find and click edit button
    await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, .category-item'));
      for (const row of rows) {
        if (row.textContent && row.textContent.includes(name)) {
          const editButton = Array.from(row.querySelectorAll('button')).find(btn => 
            btn.textContent && btn.textContent.includes('Edit')
          );
          if (editButton) editButton.click();
        }
      }
    }, categoryName);
    
    // Wait for form
    await page.waitForSelector('form input[name="name"], form input[id="name"]', { timeout: FORM_TIMEOUT });
    
    // Update name
    await page.evaluate(() => {
      const nameField = document.querySelector('input[name="name"], input[id="name"]');
      if (nameField) {
        nameField.value = '';
      }
    });
    await page.type('input[name="name"], input[id="name"]', updatedName);
    
    // Submit form
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('form button'));
      const saveButton = buttons.find(btn => 
        btn.textContent && (btn.textContent.includes('Save') || btn.textContent.includes('Update'))
      );
      if (saveButton) saveButton.click();
    });
    
    // Wait for response
    await page.waitForResponse(
      response => response.url().includes('/api/sites/') && response.url().includes('/categories'),
      { timeout: NAVIGATION_TIMEOUT }
    );
    
    // Verify updated name appears
    await delay(500);
    const nameUpdated = await page.evaluate((name) => {
      const cells = Array.from(document.querySelectorAll('td, .category-name'));
      return cells.some(cell => cell.textContent && cell.textContent.includes(name));
    }, updatedName);
    
    expect(nameUpdated).toBe(true);
  });

  test('Deletes a category', async () => {
    const categoryName = getUniqueCategoryName();
    
    await navigateToCategories();
    await createCategory(categoryName);
    
    // Find and click delete button
    await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, .category-item'));
      for (const row of rows) {
        if (row.textContent && row.textContent.includes(name)) {
          const deleteButton = Array.from(row.querySelectorAll('button')).find(btn => 
            btn.textContent && btn.textContent.includes('Delete')
          );
          if (deleteButton) deleteButton.click();
        }
      }
    }, categoryName);
    
    // Wait for confirmation dialog
    await page.waitForSelector('.modal, .confirmation-dialog, [data-testid="delete-confirmation"]', {
      timeout: FORM_TIMEOUT,
    });
    
    // Confirm deletion
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('.modal button, .confirmation-dialog button'));
      const confirmButton = buttons.find(btn => 
        btn.textContent && (
          btn.textContent.includes('Confirm') || 
          btn.textContent.includes('Yes') || 
          btn.textContent.includes('Delete')
        )
      );
      if (confirmButton) confirmButton.click();
    });
    
    // Wait for deletion to complete
    await page.waitForResponse(
      response => response.url().includes('/api/sites/') && 
                 response.url().includes('/categories') && 
                 response.request().method() === 'DELETE',
      { timeout: NAVIGATION_TIMEOUT }
    );
    
    // Verify category is gone
    await delay(500);
    const categoryExists = await page.evaluate((name) => {
      const cells = Array.from(document.querySelectorAll('td, .category-name'));
      return cells.some(cell => cell.textContent && cell.textContent.includes(name));
    }, categoryName);
    
    expect(categoryExists).toBe(false);
  });
});