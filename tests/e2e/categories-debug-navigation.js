/**
 * @file Navigation utilities for debugging categories functionality
 */

const { logDebug, BASE_URL } = require('./categories-debug-setup');
const { analyzePageComprehensively } = require('./categories-debug-utils');

// Helper function to navigate to sites page
async function navigateToSitesPage(page) {
  logDebug('Navigating to sites page...');
  
  try {
    await page.goto(`${BASE_URL}/admin/sites`);
    await page.waitForSelector('h1', { timeout: 30000 });
    await analyzePageComprehensively(page, 'sites-page');
    
    // Verify we're on the sites page
    const isOnSitesPage = await page.evaluate(() => {
      const heading = document.querySelector('h1');
      return heading && (heading.textContent.includes('Sites') || heading.textContent.includes('Directories'));
    });
    
    if (isOnSitesPage) {
      logDebug('Successfully navigated to sites page');
      return true;
    } else {
      logDebug('Failed to navigate to sites page - wrong page content');
      return false;
    }
  } catch (error) {
    logDebug(`Error navigating to sites page: ${error.message}`);
    await analyzePageComprehensively(page, 'sites-page-error');
    return false;
  }
}

// Helper function to navigate to categories page for a specific site
async function navigateToSiteCategories(page, siteSlug) {
  logDebug(`Navigating to categories for site: ${siteSlug}...`);
  
  try {
    // Navigate directly to the site's categories page
    await page.goto(`${BASE_URL}/admin/sites/${siteSlug}/categories`);
    await page.waitForSelector('h1, .category-table, [data-testid="category-table"]', { timeout: 30000 });
    await analyzePageComprehensively(page, `${siteSlug}-categories-page`);
    
    // Verify we're on the categories page
    const isOnCategoriesPage = await page.evaluate(() => {
      const heading = document.querySelector('h1, h2');
      const hasCategoryTable = document.querySelector('.category-table, [data-testid="category-table"]') !== null;
      const hasCategoryText = document.body.textContent.includes('Categories') || document.body.textContent.includes('Category');
      
      return hasCategoryTable || (heading && hasCategoryText);
    });
    
    if (isOnCategoriesPage) {
      logDebug(`Successfully navigated to categories page for ${siteSlug}`);
      return true;
    } else {
      logDebug(`Failed to navigate to categories page for ${siteSlug} - wrong page content`);
      return false;
    }
  } catch (error) {
    logDebug(`Error navigating to categories page for ${siteSlug}: ${error.message}`);
    await analyzePageComprehensively(page, `${siteSlug}-categories-error`);
    return false;
  }
}

// Helper function to locate the add category button and click it
async function navigateToAddCategoryForm(page) {
  logDebug('Attempting to navigate to add category form...');
  
  try {
    // Try multiple possible selectors for the add button
    const buttonSelectors = [
      'a[href*="/categories/new"]',
      'button:has-text("Add Category")',
      'a:has-text("Add Category")',
      '[data-testid="add-category-button"]',
      '.add-category-button'
    ];
    
    // Try each selector until we find a match
    let buttonFound = false;
    for (const selector of buttonSelectors) {
      const button = await page.$(selector);
      if (button) {
        logDebug(`Found add category button with selector: ${selector}`);
        await button.click();
        buttonFound = true;
        break;
      }
    }
    
    if (!buttonFound) {
      // Try to find any button that might be the add button based on text content
      logDebug('No button found with standard selectors, trying fallback approach');
      
      const buttonFound = await page.evaluate(() => {
        // Look for any element containing "Add Category" text
        const elements = Array.from(document.querySelectorAll('button, a'));
        const addButton = elements.find(el => 
          el.textContent.includes('Add Category') || 
          el.textContent.includes('New Category') ||
          el.innerText.includes('Add Category') ||
          el.innerText.includes('New Category')
        );
        
        if (addButton) {
          addButton.click();
          return true;
        }
        return false;
      });
      
      if (buttonFound) {
        logDebug('Found and clicked add button using text content search');
      } else {
        logDebug('Could not find any add category button');
        await analyzePageComprehensively(page, 'add-category-button-missing');
        return false;
      }
    }
    
    // Wait for navigation or form to appear
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForSelector('form, #category-form, [data-testid="category-form"]', { timeout: 10000 })
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for category form: ${error.message}`);
    }
    
    // Verify we're on the add category form
    const isOnAddForm = await page.evaluate(() => {
      return (
        document.querySelector('form') !== null &&
        (document.body.textContent.includes('Add Category') ||
         document.body.textContent.includes('New Category') ||
         document.body.textContent.includes('Create Category'))
      );
    });
    
    if (isOnAddForm) {
      logDebug('Successfully navigated to add category form');
      await analyzePageComprehensively(page, 'add-category-form');
      return true;
    } else {
      logDebug('Failed to navigate to add category form - wrong page content');
      await analyzePageComprehensively(page, 'add-category-form-error');
      return false;
    }
  } catch (error) {
    logDebug(`Error navigating to add category form: ${error.message}`);
    await analyzePageComprehensively(page, 'add-category-form-exception');
    return false;
  }
}

// Helper function to navigate to edit form for a specific category
async function navigateToEditCategoryForm(page, categoryName) {
  logDebug(`Attempting to navigate to edit form for category: ${categoryName}...`);
  
  try {
    // Try to find the edit button for the specified category
    const editButtonFound = await page.evaluate((name) => {
      // Look for the row containing the category name
      const rows = Array.from(document.querySelectorAll('tr, .category-row, .category-item'));
      const categoryRow = rows.find(row => row.textContent.includes(name));
      
      if (!categoryRow) return false;
      
      // Look for edit button/link in this row
      const editButton = categoryRow.querySelector(
        'a[href*="/edit"], button[data-action="edit"], [data-testid="edit-button"], .edit-button'
      );
      
      if (editButton) {
        editButton.click();
        return true;
      }
      
      // If no specific edit button found, try any button that might be an edit button
      const buttons = Array.from(categoryRow.querySelectorAll('button, a'));
      const possibleEditButton = buttons.find(btn => 
        btn.textContent.includes('Edit') || 
        btn.innerHTML.includes('edit') ||
        btn.innerHTML.includes('pencil') ||
        btn.classList.contains('edit')
      );
      
      if (possibleEditButton) {
        possibleEditButton.click();
        return true;
      }
      
      return false;
    }, categoryName);
    
    if (!editButtonFound) {
      logDebug(`Could not find edit button for category: ${categoryName}`);
      await analyzePageComprehensively(page, `edit-button-missing-${categoryName}`);
      return false;
    }
    
    // Wait for navigation or form to appear
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForSelector('form, #category-form, [data-testid="category-form"]', { timeout: 10000 })
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for edit category form: ${error.message}`);
    }
    
    // Verify we're on the edit category form
    const isOnEditForm = await page.evaluate((name) => {
      const form = document.querySelector('form');
      if (!form) return false;
      
      // Check if the form is pre-filled with the category name
      const nameInput = form.querySelector('input[name="name"], [data-testid="category-name"]');
      if (nameInput && nameInput.value.includes(name)) {
        return true;
      }
      
      // Check if the page title or form title contains the category name
      return (
        document.body.textContent.includes(`Edit ${name}`) ||
        document.body.textContent.includes(`Update ${name}`) ||
        document.body.textContent.includes(`Editing ${name}`)
      );
    }, categoryName);
    
    if (isOnEditForm) {
      logDebug(`Successfully navigated to edit form for category: ${categoryName}`);
      await analyzePageComprehensively(page, `edit-category-form-${categoryName}`);
      return true;
    } else {
      logDebug(`Failed to navigate to edit form for ${categoryName} - wrong page content`);
      await analyzePageComprehensively(page, `edit-category-wrong-page-${categoryName}`);
      return false;
    }
  } catch (error) {
    logDebug(`Error navigating to edit category form for ${categoryName}: ${error.message}`);
    await analyzePageComprehensively(page, `edit-category-exception-${categoryName}`);
    return false;
  }
}

// Helper function to navigate back to the categories list from a form
async function navigateBackToCategories(page) {
  logDebug('Attempting to navigate back to categories list...');
  
  try {
    // Try to find a back/cancel button or link
    const backButtonSelectors = [
      'a:has-text("Back")',
      'button:has-text("Cancel")',
      'a:has-text("Cancel")',
      'a:has-text("Categories")',
      '[data-testid="back-button"]',
      '.back-button',
      '.cancel-button'
    ];
    
    let buttonFound = false;
    for (const selector of backButtonSelectors) {
      const button = await page.$(selector);
      if (button) {
        logDebug(`Found back button with selector: ${selector}`);
        await button.click();
        buttonFound = true;
        break;
      }
    }
    
    if (!buttonFound) {
      // Try to find any element that might be a back button
      const buttonFound = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, a'));
        const backButton = elements.find(el => 
          el.textContent.includes('Back') || 
          el.textContent.includes('Cancel') ||
          el.textContent.includes('Categories List') ||
          el.innerHTML.includes('arrow-left')
        );
        
        if (backButton) {
          backButton.click();
          return true;
        }
        return false;
      });
      
      if (buttonFound) {
        logDebug('Found and clicked back button using text content search');
      } else {
        // If no back button found, try to use browser history
        logDebug('No back button found, trying browser history');
        await page.evaluate(() => window.history.back());
      }
    }
    
    // Wait for navigation or categories table to appear
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForSelector('.category-table, [data-testid="category-table"], table', { timeout: 10000 })
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for categories table: ${error.message}`);
    }
    
    // Verify we're back on the categories list
    const isOnCategoriesList = await page.evaluate(() => {
      return (
        document.querySelector('.category-table, [data-testid="category-table"], table') !== null &&
        (document.body.textContent.includes('Categories') ||
         document.body.textContent.includes('Category Management'))
      );
    });
    
    if (isOnCategoriesList) {
      logDebug('Successfully navigated back to categories list');
      await analyzePageComprehensively(page, 'back-to-categories-list');
      return true;
    } else {
      logDebug('Failed to navigate back to categories list - wrong page content');
      await analyzePageComprehensively(page, 'back-to-categories-error');
      return false;
    }
  } catch (error) {
    logDebug(`Error navigating back to categories list: ${error.message}`);
    await analyzePageComprehensively(page, 'back-navigation-exception');
    return false;
  }
}

// Helper function to navigate through pagination
async function navigateToCategoryPage(page, pageNumber) {
  logDebug(`Attempting to navigate to category page ${pageNumber}...`);
  
  try {
    // Check if pagination exists
    const hasPagination = await page.evaluate(() => {
      return document.querySelector('.pagination, nav [aria-label="pagination"], [data-testid="pagination"]') !== null;
    });
    
    if (!hasPagination) {
      logDebug('No pagination found on page');
      return false;
    }
    
    // Try to click the specific page number
    const pageButtonClicked = await page.evaluate((pageNum) => {
      // Try to find the page number button
      const paginationButtons = Array.from(document.querySelectorAll('.pagination button, nav [aria-label="pagination"] button, [data-testid="pagination"] button'));
      const pageButton = paginationButtons.find(btn => btn.textContent.trim() === pageNum.toString());
      
      if (pageButton) {
        pageButton.click();
        return true;
      }
      return false;
    }, pageNumber);
    
    if (!pageButtonClicked) {
      logDebug(`Could not find button for page ${pageNumber}`);
      return false;
    }
    
    // Wait for navigation or table update
    try {
      await Promise.race([
        page.waitForNavigation({ timeout: 10000 }),
        page.waitForFunction(
          pageNum => {
            const activePage = document.querySelector('.pagination .active, [aria-current="page"], [aria-selected="true"]');
            return activePage && activePage.textContent.trim() === pageNum.toString();
          },
          { timeout: 10000 },
          pageNumber
        )
      ]);
    } catch (error) {
      logDebug(`Timeout waiting for page ${pageNumber} to become active: ${error.message}`);
    }
    
    // Verify the current page
    const currentPage = await page.evaluate(() => {
      const activePage = document.querySelector('.pagination .active, [aria-current="page"], [aria-selected="true"]');
      return activePage ? activePage.textContent.trim() : null;
    });
    
    if (currentPage === pageNumber.toString()) {
      logDebug(`Successfully navigated to category page ${pageNumber}`);
      await analyzePageComprehensively(page, `category-page-${pageNumber}`);
      return true;
    } else {
      logDebug(`Failed to navigate to category page ${pageNumber} - current page is ${currentPage || 'unknown'}`);
      await analyzePageComprehensively(page, `category-page-${pageNumber}-error`);
      return false;
    }
  } catch (error) {
    logDebug(`Error navigating to category page ${pageNumber}: ${error.message}`);
    await analyzePageComprehensively(page, `category-page-${pageNumber}-exception`);
    return false;
  }
}

// Helper function to change the number of categories per page
async function changeRowsPerPage(page, rowCount) {
  logDebug(`Attempting to change rows per page to ${rowCount}...`);
  
  try {
    // Try to find the rows per page selector
    const dropdownFound = await page.evaluate((count) => {
      // Common selectors for rows per page dropdowns
      const selectors = [
        'select[name="pageSize"]',
        'select[aria-label="Rows per page"]',
        'select[data-testid="rows-per-page"]',
        '.pagination select'
      ];
      
      for (const selector of selectors) {
        const dropdown = document.querySelector(selector);
        if (dropdown) {
          dropdown.value = count.toString();
          // Dispatch change event for React to pick up the change
          dropdown.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      
      return false;
    }, rowCount);
    
    if (!dropdownFound) {
      logDebug('Could not find rows per page dropdown');
      return false;
    }
    
    // Wait for table update
    await page.waitForTimeout(2000);
    
    // Verify the number of rows displayed
    const rowCountChanged = await page.evaluate((expectedCount) => {
      const rows = document.querySelectorAll('tr.category-row, tr[data-category-id], .category-item');
      
      // If there are fewer total items than the requested count, that's expected
      const totalItems = parseInt(document.querySelector('.pagination-info')?.textContent.match(/\d+/g)?.[2] || '0');
      if (totalItems < expectedCount) {
        return rows.length === totalItems;
      }
      
      return rows.length <= expectedCount; // 'Less than or equal' to account for any edge cases
    }, rowCount);
    
    if (rowCountChanged) {
      logDebug(`Successfully changed rows per page to ${rowCount}`);
      await analyzePageComprehensively(page, `rows-per-page-${rowCount}`);
      return true;
    } else {
      logDebug(`Failed to change rows per page to ${rowCount}`);
      await analyzePageComprehensively(page, `rows-per-page-${rowCount}-error`);
      return false;
    }
  } catch (error) {
    logDebug(`Error changing rows per page to ${rowCount}: ${error.message}`);
    await analyzePageComprehensively(page, `rows-per-page-${rowCount}-exception`);
    return false;
  }
}

module.exports = {
  navigateToSitesPage,
  navigateToSiteCategories,
  navigateToAddCategoryForm,
  navigateToEditCategoryForm,
  navigateBackToCategories,
  navigateToCategoryPage,
  changeRowsPerPage
};