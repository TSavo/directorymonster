/**
 * @file E2E tests for category management functionality
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');

// Import test utilities
const { BASE_URL, log, wait } = require('./utils/test-utils');
const { setupBrowser, closeBrowser, checkApiAndSeed } = require('./utils/browser-utils');
const { loginAsAdmin } = require('./utils/auth-utils');
const { 
  getUniqueCategoryName, 
  navigateToCategories, 
  navigateToAddCategoryForm, 
  fillCategoryForm, 
  submitForm, 
  categoryExists,
  navigateToEditCategory,
  deleteCategory
} = require('./utils/category-utils');

// Test configuration
const SITE_SLUG = process.env.TEST_SITE_SLUG || 'hiking-gear';
const DEFAULT_TIMEOUT = 60000; // 1 minute timeout for tests

// Test suite
describe('Category Management', () => {
  let browser, page;
  
  // Set up browser and login before running tests
  beforeAll(async () => {
    // Check API and seed data
    const apiAvailable = await checkApiAndSeed(BASE_URL, SITE_SLUG);
    if (!apiAvailable) {
      log('API not available, tests will likely fail', 'warning');
    }
    
    // Set up browser and page
    const setup = await setupBrowser(puppeteer, {
      headless: process.env.HEADLESS !== 'false',
      timeout: DEFAULT_TIMEOUT
    });
    
    browser = setup.browser;
    page = setup.page;
    
    // Log in
    const loginSuccess = await loginAsAdmin(page);
    if (!loginSuccess) {
      log('Login failed, tests may not work correctly', 'error');
    }
  });
  
  // Clean up after all tests
  afterAll(async () => {
    await closeBrowser(browser);
  });
  
  test('Should navigate to categories page', async () => {
    const success = await navigateToCategories(page, SITE_SLUG);
    expect(success).toBe(true);
  }, DEFAULT_TIMEOUT);
  
  test('Should create a new category', async () => {
    // Navigate to categories
    const navigationSuccess = await navigateToCategories(page, SITE_SLUG);
    expect(navigationSuccess).toBe(true);
    
    // Navigate to add category form
    const formNavigationSuccess = await navigateToAddCategoryForm(page);
    expect(formNavigationSuccess).toBe(true);
    
    // Fill category form
    const categoryName = getUniqueCategoryName();
    const formFilled = await fillCategoryForm(page, {
      name: categoryName,
      metaDescription: 'Test category created by E2E test'
    });
    expect(formFilled).toBe(true);
    
    // Submit form
    const formSubmitted = await submitForm(page);
    expect(formSubmitted).toBe(true);
    
    // Navigate back to categories (in case of redirect)
    await navigateToCategories(page, SITE_SLUG);
    
    // Verify category was created
    const exists = await categoryExists(page, categoryName);
    expect(exists).toBe(true);
  }, DEFAULT_TIMEOUT);
  
  test('Should edit an existing category', async () => {
    // Navigate to categories
    const navigationSuccess = await navigateToCategories(page, SITE_SLUG);
    expect(navigationSuccess).toBe(true);
    
    // Create a category to edit
    const originalName = getUniqueCategoryName('Edit Category');
    const newName = `${originalName} (Edited)`;
    
    // Navigate to add category form
    const formNavigationSuccess = await navigateToAddCategoryForm(page);
    expect(formNavigationSuccess).toBe(true);
    
    // Fill and submit form
    await fillCategoryForm(page, { name: originalName });
    await submitForm(page);
    
    // Navigate back to categories and verify category exists
    await navigateToCategories(page, SITE_SLUG);
    const categoryCreated = await categoryExists(page, originalName);
    expect(categoryCreated).toBe(true);
    
    // Navigate to edit the category
    const editNavigationSuccess = await navigateToEditCategory(page, originalName);
    expect(editNavigationSuccess).toBe(true);
    
    // Update the category name
    await page.evaluate(() => {
      const nameField = document.querySelector('input[name="name"]');
      if (nameField) nameField.value = '';
    });
    await page.type('input[name="name"]', newName);
    
    // Submit the form
    await submitForm(page);
    
    // Navigate back to categories
    await navigateToCategories(page, SITE_SLUG);
    
    // Verify the category was updated
    const categoryUpdated = await categoryExists(page, newName);
    expect(categoryUpdated).toBe(true);
  }, DEFAULT_TIMEOUT);
  
  test('Should create a parent-child category relationship', async () => {
    // Navigate to categories
    const navigationSuccess = await navigateToCategories(page, SITE_SLUG);
    expect(navigationSuccess).toBe(true);
    
    // Create a parent category
    const parentName = getUniqueCategoryName('Parent');
    
    // Navigate to add category form
    await navigateToAddCategoryForm(page);
    
    // Fill and submit form
    await fillCategoryForm(page, { name: parentName });
    await submitForm(page);
    
    // Navigate back to categories
    await navigateToCategories(page, SITE_SLUG);
    
    // Verify parent was created
    const parentCreated = await categoryExists(page, parentName);
    expect(parentCreated).toBe(true);
    
    // Create a child category
    const childName = getUniqueCategoryName('Child');
    
    // Navigate to add category form
    await navigateToAddCategoryForm(page);
    
    // Get parent category ID
    const parentId = await page.evaluate((parentNameToFind) => {
      const select = document.querySelector('select[name="parentId"]');
      if (!select) return null;
      
      for (const option of select.options) {
        if (option.textContent.includes(parentNameToFind)) {
          return option.value;
        }
      }
      return null;
    }, parentName);
    
    if (!parentId) {
      log('Could not find parent in dropdown', 'warning');
    }
    
    // Fill and submit form with parent selection
    await fillCategoryForm(page, { 
      name: childName,
      parentId: parentId || ''
    });
    await submitForm(page);
    
    // Navigate back to categories
    await navigateToCategories(page, SITE_SLUG);
    
    // Verify both categories exist
    const parentExists = await categoryExists(page, parentName);
    const childExists = await categoryExists(page, childName);
    
    expect(parentExists).toBe(true);
    expect(childExists).toBe(true);
  }, DEFAULT_TIMEOUT);
  
  test('Should delete a category', async () => {
    // Navigate to categories
    const navigationSuccess = await navigateToCategories(page, SITE_SLUG);
    expect(navigationSuccess).toBe(true);
    
    // Create a category to delete
    const categoryName = getUniqueCategoryName('Delete Category');
    
    // Navigate to add category form
    await navigateToAddCategoryForm(page);
    
    // Fill and submit form
    await fillCategoryForm(page, { name: categoryName });
    await submitForm(page);
    
    // Navigate back to categories
    await navigateToCategories(page, SITE_SLUG);
    
    // Verify category was created
    const categoryCreated = await categoryExists(page, categoryName);
    expect(categoryCreated).toBe(true);
    
    // Delete the category
    const deleteSuccess = await deleteCategory(page, categoryName);
    expect(deleteSuccess).toBe(true);
    
    // Verify category was deleted
    const stillExists = await categoryExists(page, categoryName);
    expect(stillExists).toBe(false);
  }, DEFAULT_TIMEOUT);
});
