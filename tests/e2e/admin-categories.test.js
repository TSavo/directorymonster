/**
 * @file E2E tests for admin/categories functionality with advanced debug helpers
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');

// Import debug utilities
const { ensureDirectories, logDebug, setupBrowser } = require('./categories-debug-setup');
const { analyzePageComprehensively } = require('./categories-debug-utils');
const { login } = require('./categories-debug-auth');
const { 
  navigateToSitesPage,
  navigateToSiteCategories,
  navigateToAddCategoryForm,
  navigateToEditCategoryForm,
  navigateBackToCategories,
  navigateToCategoryPage,
  changeRowsPerPage
} = require('./categories-debug-navigation');

// Configuration
const SITE_SLUG = process.env.TEST_SITE_SLUG || 'hiking-gear';
const DEFAULT_TIMEOUT = 60000; // 1 minute timeout for each test
const CATEGORY_PREFIX = 'Test Category';

// Helper function to generate a unique category name
const getUniqueCategoryName = () => `${CATEGORY_PREFIX} ${Date.now()}`;

// Test suite
describe('Admin Categories Management', () => {
  let browser, page;

  // Setup before running tests
  beforeAll(async () => {
    // Ensure debug directories exist
    ensureDirectories();
    logDebug('Starting admin categories E2E tests');
    
    // Set up the browser and page
    const browserSetup = await setupBrowser(puppeteer);
    browser = browserSetup.browser;
    page = browserSetup.page;
    
    // Attempt to login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      logDebug('❌ Login failed, tests may not work correctly');
    } else {
      logDebug('✅ Successfully logged in');
    }
  });

  // Cleanup after tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
    logDebug('Completed admin categories E2E tests');
  });

  // Test cases
  
  // Test: Navigate to categories page
  test('Should navigate to site categories page', async () => {
    logDebug('TEST: Should navigate to site categories page');
    
    // First navigate to the sites page
    const sitesPageSuccess = await navigateToSitesPage(page);
    expect(sitesPageSuccess).toBe(true);
    
    // Then navigate to categories for the specific site
    const categoriesPageSuccess = await navigateToSiteCategories(page, SITE_SLUG);
    expect(categoriesPageSuccess).toBe(true);
    
    // Take a comprehensive snapshot of the page
    await analyzePageComprehensively(page, 'site-categories-page');
  }, DEFAULT_TIMEOUT);

  // Test: Create a new category
  test('Should create a new category', async () => {
    logDebug('TEST: Should create a new category');
    
    // Navigate to the categories page for the site
    const categoriesPageSuccess = await navigateToSiteCategories(page, SITE_SLUG);
    expect(categoriesPageSuccess).toBe(true);
    
    // Navigate to the add category form
    const addFormSuccess = await navigateToAddCategoryForm(page);
    expect(addFormSuccess).toBe(true);
    
    // Fill out the category form
    const categoryName = getUniqueCategoryName();
    const categoryDescription = 'This is a test category created by E2E tests';
    
    logDebug(`Creating category with name: ${categoryName}`);
    
    // Enter the category name
    await page.type('input[name="name"], #name, input[type="text"]', categoryName);
    
    // Enter the description if the field exists
    const descriptionField = await page.$('textarea[name="description"], #description, textarea');
    if (descriptionField) {
      await descriptionField.type(categoryDescription);
    }
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or form submission to complete
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForSelector('.category-table, [data-testid="category-table"], table', { timeout: 10000 })
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for form submission: ${error.message}`);
    }
    
    // Take a comprehensive snapshot of the page
    await analyzePageComprehensively(page, 'after-category-creation');
    
    // Verify the category was created by checking for it in the list
    const categoryExists = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      return rows.some(row => row.textContent.includes(name));
    }, categoryName);
    
    expect(categoryExists).toBe(true);
    logDebug(`✅ Successfully created new category: ${categoryName}`);
  }, DEFAULT_TIMEOUT);

  // Test: Edit an existing category
  test('Should edit an existing category', async () => {
    logDebug('TEST: Should edit an existing category');
    
    // Navigate to the categories page for the site
    const categoriesPageSuccess = await navigateToSiteCategories(page, SITE_SLUG);
    expect(categoriesPageSuccess).toBe(true);
    
    // Create a category to edit
    const originalName = getUniqueCategoryName();
    
    // Navigate to the add category form
    const addFormSuccess = await navigateToAddCategoryForm(page);
    expect(addFormSuccess).toBe(true);
    
    // Fill out the category form
    await page.type('input[name="name"], #name, input[type="text"]', originalName);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or form submission to complete
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForSelector('.category-table, [data-testid="category-table"], table', { timeout: 10000 })
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for form submission: ${error.message}`);
    }
    
    // Verify the category was created
    const categoryExists = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      return rows.some(row => row.textContent.includes(name));
    }, originalName);
    
    expect(categoryExists).toBe(true);
    
    // Navigate to edit the category
    const editSuccess = await navigateToEditCategoryForm(page, originalName);
    expect(editSuccess).toBe(true);
    
    // Update the category name
    const updatedName = `${originalName}-EDITED`;
    
    // Clear the input field and enter the new name
    await page.evaluate(() => {
      const nameField = document.querySelector('input[name="name"], #name, input[type="text"]');
      if (nameField) nameField.value = '';
    });
    
    await page.type('input[name="name"], #name, input[type="text"]', updatedName);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or form submission to complete
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForSelector('.category-table, [data-testid="category-table"], table', { timeout: 10000 })
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for form submission: ${error.message}`);
    }
    
    // Take a comprehensive snapshot of the page
    await analyzePageComprehensively(page, 'after-category-edit');
    
    // Verify the category was updated
    const updatedCategoryExists = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      return rows.some(row => row.textContent.includes(name));
    }, updatedName);
    
    expect(updatedCategoryExists).toBe(true);
    logDebug(`✅ Successfully edited category from "${originalName}" to "${updatedName}"`);
  }, DEFAULT_TIMEOUT);

  // Test: Delete a category
  test('Should delete a category', async () => {
    logDebug('TEST: Should delete a category');
    
    // Navigate to the categories page for the site
    const categoriesPageSuccess = await navigateToSiteCategories(page, SITE_SLUG);
    expect(categoriesPageSuccess).toBe(true);
    
    // Create a category to delete
    const categoryName = getUniqueCategoryName();
    
    // Navigate to the add category form
    const addFormSuccess = await navigateToAddCategoryForm(page);
    expect(addFormSuccess).toBe(true);
    
    // Fill out the category form
    await page.type('input[name="name"], #name, input[type="text"]', categoryName);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or form submission to complete
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForSelector('.category-table, [data-testid="category-table"], table', { timeout: 10000 })
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for form submission: ${error.message}`);
    }
    
    // Verify the category was created
    const categoryExists = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      return rows.some(row => row.textContent.includes(name));
    }, categoryName);
    
    expect(categoryExists).toBe(true);
    
    // Now delete the category - find the delete button
    await analyzePageComprehensively(page, 'before-delete-category');
    
    const deleteButtonClicked = await page.evaluate(async (name) => {
      // Find the row containing the category
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      const categoryRow = rows.find(row => row.textContent.includes(name));
      
      if (!categoryRow) return false;
      
      // Look for any delete button or icon
      const deleteButton = categoryRow.querySelector(
        'button[title*="Delete"], a[title*="Delete"], button.delete-btn, a.delete-btn, ' +
        'button:has-text("Delete"), a:has-text("Delete"), .delete-icon, [data-testid="delete-button"]'
      );
      
      if (deleteButton) {
        deleteButton.click();
        return true;
      }
      
      // Try to find any button that might be the delete button
      const buttons = Array.from(categoryRow.querySelectorAll('button, a'));
      const possibleDeleteButton = buttons.find(btn => 
        btn.textContent.includes('Delete') || 
        btn.innerHTML.includes('delete') ||
        btn.innerHTML.includes('trash') ||
        btn.classList.contains('delete')
      );
      
      if (possibleDeleteButton) {
        possibleDeleteButton.click();
        return true;
      }
      
      return false;
    }, categoryName);
    
    if (deleteButtonClicked) {
      logDebug('Delete button clicked, looking for confirmation dialog');
      
      // Wait for the confirmation dialog to appear
      await page.waitForTimeout(1000);
      await analyzePageComprehensively(page, 'delete-confirmation-dialog');
      
      // Find and click the confirm button in the dialog
      const confirmButtonClicked = await page.evaluate(() => {
        // Look for any confirm button in a dialog
        const confirmButtons = Array.from(document.querySelectorAll(
          'button:has-text("Yes"), button:has-text("Confirm"), button:has-text("Delete"), ' +
          'button.btn-danger, button.confirm-delete, [data-testid="confirm-delete"]'
        ));
        
        const confirmButton = confirmButtons.find(btn => 
          btn.textContent.includes('Yes') || 
          btn.textContent.includes('Confirm') || 
          btn.textContent.includes('Delete') ||
          btn.classList.contains('danger') ||
          btn.classList.contains('confirm')
        );
        
        if (confirmButton) {
          confirmButton.click();
          return true;
        }
        
        return false;
      });
      
      if (confirmButtonClicked) {
        logDebug('Confirm delete button clicked');
      } else {
        logDebug('Could not find confirm delete button');
      }
      
      // Wait for the deletion to complete
      await page.waitForTimeout(3000);
      await analyzePageComprehensively(page, 'after-delete-category');
      
      // Verify the category was deleted
      const categoryStillExists = await page.evaluate((name) => {
        const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
        return rows.some(row => row.textContent.includes(name));
      }, categoryName);
      
      expect(categoryStillExists).toBe(false);
      logDebug(`✅ Successfully deleted category: ${categoryName}`);
    } else {
      logDebug('❌ Could not find delete button for the category');
      expect(deleteButtonClicked).toBe(true); // This will fail the test
    }
  }, DEFAULT_TIMEOUT);

  // Test: Pagination functionality
  test('Should navigate through paginated categories', async () => {
    logDebug('TEST: Should navigate through paginated categories');
    
    // Navigate to the categories page for the site
    const categoriesPageSuccess = await navigateToSiteCategories(page, SITE_SLUG);
    expect(categoriesPageSuccess).toBe(true);
    
    // Check if pagination exists
    const hasPagination = await page.evaluate(() => {
      return document.querySelector('.pagination, [aria-label="pagination"], [data-testid="pagination"]') !== null;
    });
    
    if (!hasPagination) {
      logDebug('Pagination not found, test will be skipped');
      return; // Skip this test if there's no pagination
    }
    
    // Try to navigate to page 2
    const pageNavigationSuccess = await navigateToCategoryPage(page, 2);
    
    // If we were able to navigate to page 2, verify we're on page 2
    if (pageNavigationSuccess) {
      const isOnPage2 = await page.evaluate(() => {
        const activePageElement = document.querySelector('.pagination .active, [aria-current="page"], [aria-selected="true"]');
        return activePageElement && activePageElement.textContent.trim() === '2';
      });
      
      expect(isOnPage2).toBe(true);
      logDebug('✅ Successfully navigated to page 2');
    } else {
      logDebug('Could not navigate to page 2, may not have enough categories for pagination');
    }
    
    // Try changing the rows per page
    const rowsPerPageChanged = await changeRowsPerPage(page, 25);
    
    if (rowsPerPageChanged) {
      logDebug('✅ Successfully changed rows per page');
    } else {
      logDebug('Could not change rows per page, may not be supported');
    }
  }, DEFAULT_TIMEOUT);

  // Test: Creating hierarchical categories
  test('Should create parent and child categories', async () => {
    logDebug('TEST: Should create parent and child categories');
    
    // Navigate to the categories page for the site
    const categoriesPageSuccess = await navigateToSiteCategories(page, SITE_SLUG);
    expect(categoriesPageSuccess).toBe(true);
    
    // Create a parent category
    const parentName = `Parent-${getUniqueCategoryName()}`;
    
    // Navigate to the add category form
    const addFormSuccess = await navigateToAddCategoryForm(page);
    expect(addFormSuccess).toBe(true);
    
    // Fill out the parent category form
    await page.type('input[name="name"], #name, input[type="text"]', parentName);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or form submission to complete
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForSelector('.category-table, [data-testid="category-table"], table', { timeout: 10000 })
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for form submission: ${error.message}`);
    }
    
    // Verify the parent category was created
    const parentExists = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      return rows.some(row => row.textContent.includes(name));
    }, parentName);
    
    expect(parentExists).toBe(true);
    
    // Now create a child category
    const childName = `Child-${getUniqueCategoryName()}`;
    
    // Navigate to the add category form again
    const addChildFormSuccess = await navigateToAddCategoryForm(page);
    expect(addChildFormSuccess).toBe(true);
    
    // Fill out the child category form
    await page.type('input[name="name"], #name, input[type="text"]', childName);
    
    // Select the parent category from dropdown
    const parentSelected = await page.evaluate((parentName) => {
      // Find the parent dropdown
      const parentDropdown = document.querySelector('select[name="parentId"], #parentId, select.parent-select, select');
      if (!parentDropdown) return false;
      
      // Find the option for the parent category
      for (const option of parentDropdown.options) {
        if (option.textContent.includes(parentName)) {
          option.selected = true;
          
          // Dispatch change event
          const event = new Event('change', { bubbles: true });
          parentDropdown.dispatchEvent(event);
          
          return true;
        }
      }
      
      return false;
    }, parentName);
    
    if (parentSelected) {
      logDebug(`Selected parent category: ${parentName} from dropdown`);
    } else {
      logDebug(`Could not select parent category from dropdown`);
    }
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for navigation or form submission to complete
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForSelector('.category-table, [data-testid="category-table"], table', { timeout: 10000 })
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for form submission: ${error.message}`);
    }
    
    // Take a comprehensive snapshot of the page
    await analyzePageComprehensively(page, 'after-hierarchical-categories');
    
    // Verify both categories exist
    const categoriesExist = await page.evaluate((parent, child) => {
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      const parentExists = rows.some(row => row.textContent.includes(parent));
      const childExists = rows.some(row => row.textContent.includes(child));
      return { parentExists, childExists };
    }, parentName, childName);
    
    expect(categoriesExist.parentExists).toBe(true);
    expect(categoriesExist.childExists).toBe(true);
    logDebug(`✅ Successfully created parent and child categories`);
  }, DEFAULT_TIMEOUT);
});
