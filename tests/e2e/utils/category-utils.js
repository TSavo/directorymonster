/**
 * @file Category management utilities for E2E testing
 */

const { 
  BASE_URL, 
  log, 
  wait, 
  takeScreenshot,
  clickButtonByText,
  elementExists
} = require('./test-utils');

// Generate a unique category name
const getUniqueCategoryName = (prefix = 'Test Category') => 
  `${prefix} ${Date.now()}`;

/**
 * Navigates to the categories page for a specific site
 * @param {Object} page - Puppeteer page object
 * @param {string} siteSlug - Site slug
 * @returns {Promise<boolean>} - Whether navigation was successful
 */
async function navigateToCategories(page, siteSlug) {
  log(`Navigating to categories for site: ${siteSlug}`);
  
  try {
    // Direct navigation to category management page
    const categoriesUrl = `${BASE_URL}/admin/sites/${siteSlug}/categories`;
    await page.goto(categoriesUrl, { waitUntil: 'networkidle2' });
    await wait(2000);
    await takeScreenshot(page, 'categories-page');
    
    // Check if we're on the categories page
    const isCategoriesPage = await page.evaluate(() => {
      const hasHeading = document.querySelector('h1, h2')?.textContent.toLowerCase().includes('categor');
      const hasTable = document.querySelector('table') !== null;
      return hasHeading || hasTable;
    });
    
    if (isCategoriesPage) {
      log('Successfully navigated to categories page');
      return true;
    } else {
      log('Failed to navigate to categories page - wrong content', 'error');
      return false;
    }
  } catch (error) {
    log(`Error navigating to categories: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Clicks the Add Category button and navigates to the form
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<boolean>} - Whether navigation to form was successful
 */
async function navigateToAddCategoryForm(page) {
  log('Navigating to Add Category form');
  
  try {
    // Try standard link first
    const linkSelector = 'a[href*="/categories/new"]';
    const hasLink = await elementExists(page, linkSelector);
    
    if (hasLink) {
      await page.click(linkSelector);
      log('Clicked Add Category link');
    } else {
      // Try button with text
      const buttonClicked = await clickButtonByText(page, 'Add Category');
      
      if (!buttonClicked) {
        log('Could not find Add Category button', 'error');
        return false;
      }
    }
    
    // Wait for form to load
    await wait(2000);
    await takeScreenshot(page, 'add-category-form');
    
    // Verify we're on the form page
    const isOnForm = await page.evaluate(() => {
      return document.querySelector('form') !== null &&
        document.querySelector('input[name="name"]') !== null;
    });
    
    if (isOnForm) {
      log('Successfully navigated to Add Category form');
      return true;
    } else {
      log('Failed to navigate to Add Category form', 'error');
      return false;
    }
  } catch (error) {
    log(`Error navigating to Add Category form: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Fills out a category form
 * @param {Object} page - Puppeteer page object
 * @param {Object} categoryData - Category data to fill in
 * @returns {Promise<boolean>} - Whether form was successfully filled
 */
async function fillCategoryForm(page, categoryData) {
  const { name, metaDescription = '', parentId = '' } = categoryData;
  log(`Filling category form with name: ${name}`);
  
  try {
    // Fill name field
    await page.type('input[name="name"]', name);
    
    // Fill description if provided
    if (metaDescription) {
      const descriptionField = await page.$('textarea[name="metaDescription"]');
      if (descriptionField) {
        await descriptionField.type(metaDescription);
      }
    }
    
    // Select parent category if provided
    if (parentId) {
      const parentDropdown = await page.$('select[name="parentId"]');
      if (parentDropdown) {
        await page.select('select[name="parentId"]', parentId);
      }
    }
    
    await takeScreenshot(page, 'category-form-filled');
    log('Successfully filled category form');
    return true;
  } catch (error) {
    log(`Error filling category form: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Submits a form and waits for the result
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<boolean>} - Whether form was successfully submitted
 */
async function submitForm(page) {
  log('Submitting form');
  
  try {
    // Click submit button
    await page.click('button[type="submit"]');
    
    // Wait for navigation or form submission
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForFunction(() => {
          // Either success message or we're back at the list
          return document.body.textContent.includes('success') || 
                 document.querySelector('table') !== null;
        }, { timeout: 10000 })
      ]);
    } catch (error) {
      log(`Wait timeout after form submission: ${error.message}`, 'warning');
    }
    
    await wait(2000);
    await takeScreenshot(page, 'after-form-submit');
    log('Form submitted successfully');
    return true;
  } catch (error) {
    log(`Error submitting form: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Checks if a category exists in the list
 * @param {Object} page - Puppeteer page object
 * @param {string} categoryName - Name of the category to check for
 * @returns {Promise<boolean>} - Whether the category exists
 */
async function categoryExists(page, categoryName) {
  log(`Checking if category exists: ${categoryName}`);
  
  try {
    return page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      return rows.some(row => row.textContent.includes(name));
    }, categoryName);
  } catch (error) {
    log(`Error checking if category exists: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Navigates to edit a specific category
 * @param {Object} page - Puppeteer page object
 * @param {string} categoryName - Name of the category to edit
 * @returns {Promise<boolean>} - Whether navigation was successful
 */
async function navigateToEditCategory(page, categoryName) {
  log(`Navigating to edit category: ${categoryName}`);
  
  try {
    // Try to find and click the edit button/link
    const editClicked = await page.evaluate((name) => {
      // Find the row with the category
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      const categoryRow = rows.find(row => row.textContent.includes(name));
      
      if (!categoryRow) return false;
      
      // Find edit link or button
      const editEl = categoryRow.querySelector('a[href*="/edit"], button.edit, [data-testid="edit-button"]');
      if (editEl) {
        editEl.click();
        return true;
      }
      
      // Try any link or button that might be for editing
      const possibleEditEls = Array.from(categoryRow.querySelectorAll('a, button'));
      const editElement = possibleEditEls.find(el => 
        el.textContent.includes('Edit') || 
        el.title?.includes('Edit') ||
        el.classList.contains('edit') ||
        el.dataset.action === 'edit'
      );
      
      if (editElement) {
        editElement.click();
        return true;
      }
      
      return false;
    }, categoryName);
    
    if (!editClicked) {
      log(`Could not find edit button for category: ${categoryName}`, 'error');
      return false;
    }
    
    // Wait for edit form to load
    await wait(2000);
    await takeScreenshot(page, 'edit-category-form');
    
    // Verify we're on edit form
    const isOnEditForm = await page.evaluate((name) => {
      const nameInput = document.querySelector('input[name="name"]');
      return nameInput !== null && 
             (nameInput.value.includes(name) || document.body.textContent.includes(`Edit ${name}`));
    }, categoryName);
    
    if (isOnEditForm) {
      log('Successfully navigated to edit category form');
      return true;
    } else {
      log('Failed to navigate to edit category form', 'error');
      return false;
    }
  } catch (error) {
    log(`Error navigating to edit category: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Deletes a category
 * @param {Object} page - Puppeteer page object
 * @param {string} categoryName - Name of the category to delete
 * @returns {Promise<boolean>} - Whether deletion was successful
 */
async function deleteCategory(page, categoryName) {
  log(`Deleting category: ${categoryName}`);
  
  try {
    // Try to find and click delete button
    const deleteClicked = await page.evaluate((name) => {
      // Find the row with the category
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      const categoryRow = rows.find(row => row.textContent.includes(name));
      
      if (!categoryRow) return false;
      
      // Find delete button
      const deleteEl = categoryRow.querySelector('button.delete, [data-testid="delete-button"]');
      if (deleteEl) {
        deleteEl.click();
        return true;
      }
      
      // Try any button that might be for deleting
      const possibleButtons = Array.from(categoryRow.querySelectorAll('button'));
      const deleteButton = possibleButtons.find(btn => 
        btn.textContent.includes('Delete') || 
        btn.title?.includes('Delete') ||
        btn.classList.contains('delete') ||
        btn.dataset.action === 'delete'
      );
      
      if (deleteButton) {
        deleteButton.click();
        return true;
      }
      
      return false;
    }, categoryName);
    
    if (!deleteClicked) {
      log(`Could not find delete button for category: ${categoryName}`, 'error');
      return false;
    }
    
    // Wait for confirmation dialog
    await wait(1000);
    await takeScreenshot(page, 'delete-confirmation');
    
    // Find and click confirm button
    const confirmClicked = await page.evaluate(() => {
      const confirmButton = 
        document.querySelector('button:not([type="cancel"])[form="delete-form"]') || 
        Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Yes') || 
          btn.textContent.includes('Confirm') || 
          btn.textContent.includes('Delete')
        );
        
      if (confirmButton) {
        confirmButton.click();
        return true;
      }
      return false;
    });
    
    if (!confirmClicked) {
      log('Could not find confirmation button', 'error');
      return false;
    }
    
    // Wait for deletion to complete
    await wait(2000);
    await takeScreenshot(page, 'after-delete');
    
    // Verify category no longer exists
    const stillExists = await categoryExists(page, categoryName);
    
    if (!stillExists) {
      log(`Successfully deleted category: ${categoryName}`);
      return true;
    } else {
      log(`Failed to delete category: ${categoryName}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Error deleting category: ${error.message}`, 'error');
    return false;
  }
}

module.exports = {
  getUniqueCategoryName,
  navigateToCategories,
  navigateToAddCategoryForm,
  fillCategoryForm,
  submitForm,
  categoryExists,
  navigateToEditCategory,
  deleteCategory
};
