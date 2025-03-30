/**
 * @file Compatibility utilities for categories navigation with our new routes
 */

const { logDebug, BASE_URL } = require('./categories-debug-setup');

// Updated helper function to navigate to categories
async function navigateToCategoriesCompat(page, siteSlug) {
  logDebug(`[Compat] Navigating to categories for site: ${siteSlug}...`);
  
  try {
    // Direct navigation to our newly created route
    await page.goto(`${BASE_URL}/admin/sites/${siteSlug}/categories`);
    await page.waitForTimeout(2000); // Give it time to load
    
    // Wait for the page to load completely
    await Promise.race([
      page.waitForNavigation({ timeout: 10000 }).catch(() => {}),
      page.waitForSelector('h1, table, .category-table, [data-testid="category-table"]', { timeout: 10000 }).catch(() => {})
    ]);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: './debug-logs/categories-page.png' });
    
    // Verify we're on the correct page
    const isOnCategoriesPage = await page.evaluate(() => {
      // Look for heading or category table
      const hasHeading = !!document.querySelector('h1, h2');
      const hasTable = !!document.querySelector('table');
      const hasCategoryText = document.body.textContent.includes('Category') || 
                             document.body.textContent.includes('Categories');
      
      // Log what we found for debugging
      console.log(`Has heading: ${hasHeading}, Has table: ${hasTable}, Has category text: ${hasCategoryText}`);
      
      return hasTable && hasCategoryText;
    });
    
    if (isOnCategoriesPage) {
      logDebug(`[Compat] Successfully navigated to categories page for ${siteSlug}`);
      return true;
    } else {
      logDebug(`[Compat] Failed to load categories page for ${siteSlug}`);
      return false;
    }
  } catch (error) {
    logDebug(`[Compat] Error navigating to categories: ${error.message}`);
    return false;
  }
}

// Compatibility function to find and click Add Category button
async function clickAddCategoryCompat(page) {
  logDebug('[Compat] Attempting to click Add Category button...');
  
  try {
    // First try standard link to our new route
    const linkSelector = `a[href*="/categories/new"]`;
    const link = await page.$(linkSelector);
    
    if (link) {
      logDebug('[Compat] Found Add Category link');
      await link.click();
      await page.waitForTimeout(2000);
      return true;
    }
    
    // Try buttons with "Add" text
    const buttonSelectors = [
      'button:contains("Add")',
      'a:contains("Add")',
      'button:contains("New")',
      'a:contains("New")'
    ];
    
    // Use Puppeteer's page.evaluate to search for these text-containing buttons
    const buttonFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a'));
      const addButton = buttons.find(btn => 
        btn.textContent.includes('Add Category') ||
        btn.textContent.includes('New Category') ||
        btn.textContent.includes('Create Category')
      );
      
      if (addButton) {
        addButton.click();
        return true;
      }
      return false;
    });
    
    if (buttonFound) {
      logDebug('[Compat] Found and clicked Add Category button by text');
      await page.waitForTimeout(2000);
      return true;
    }
    
    logDebug('[Compat] Could not find Add Category button');
    return false;
  } catch (error) {
    logDebug(`[Compat] Error clicking Add Category button: ${error.message}`);
    return false;
  }
}

// Compatibility function to fill category form
async function fillCategoryFormCompat(page, categoryName, description = 'Test category description') {
  logDebug(`[Compat] Filling category form with name: ${categoryName}`);
  
  try {
    // Find and fill name field
    await page.type('input[name="name"]', categoryName);
    
    // Find and fill description if it exists
    const descriptionField = await page.$('textarea[name="metaDescription"]');
    if (descriptionField) {
      await descriptionField.type(description);
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: './debug-logs/category-form-filled.png' });
    
    logDebug('[Compat] Successfully filled category form');
    return true;
  } catch (error) {
    logDebug(`[Compat] Error filling category form: ${error.message}`);
    return false;
  }
}

// Compatibility function to submit a form
async function submitFormCompat(page) {
  logDebug('[Compat] Attempting to submit form...');
  
  try {
    // Find and click submit button
    const submitButton = await page.$('button[type="submit"]');
    
    if (submitButton) {
      await submitButton.click();
      await page.waitForTimeout(2000);
      
      // Wait for network to be idle (AJAX form submission)
      try {
        await page.waitForNavigation({ timeout: 5000 }).catch(() => {});
      } catch (navError) {
        // Ignore navigation errors, as the form might use AJAX
      }
      
      logDebug('[Compat] Successfully submitted form');
      return true;
    }
    
    // If standard submit button not found, try other buttons
    const buttonFound = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitButton = buttons.find(btn => 
        btn.textContent.includes('Save') ||
        btn.textContent.includes('Submit') ||
        btn.textContent.includes('Create') ||
        btn.textContent.includes('Update')
      );
      
      if (submitButton) {
        submitButton.click();
        return true;
      }
      return false;
    });
    
    if (buttonFound) {
      logDebug('[Compat] Found and clicked submit button by text');
      await page.waitForTimeout(2000);
      return true;
    }
    
    logDebug('[Compat] Could not find submit button');
    return false;
  } catch (error) {
    logDebug(`[Compat] Error submitting form: ${error.message}`);
    return false;
  }
}

// Check if a category exists in the table
async function checkCategoryExistsCompat(page, categoryName) {
  logDebug(`[Compat] Checking if category exists: ${categoryName}`);
  
  try {
    // Look for the category in the table rows
    const exists = await page.evaluate((name) => {
      const rows = Array.from(document.querySelectorAll('tr, div.category-row, div.category-item'));
      return rows.some(row => row.textContent.includes(name));
    }, categoryName);
    
    logDebug(`[Compat] Category "${categoryName}" exists: ${exists}`);
    return exists;
  } catch (error) {
    logDebug(`[Compat] Error checking if category exists: ${error.message}`);
    return false;
  }
}

// Helper to find and click the edit button for a category
async function clickEditCategoryButtonCompat(page, categoryName) {
  logDebug(`[Compat] Attempting to click edit button for category: ${categoryName}`);
  
  try {
    // Look for the edit button in the row containing the category
    const editButtonClicked = await page.evaluate((name) => {
      // Find the row containing the category
      const rows = Array.from(document.querySelectorAll('tr, div.category-row, div.category-item'));
      const categoryRow = rows.find(row => row.textContent.includes(name));
      
      if (!categoryRow) return false;
      
      // Look for any button/link that might be an edit button
      const buttons = Array.from(categoryRow.querySelectorAll('button, a'));
      const editButton = buttons.find(btn => 
        btn.textContent.includes('Edit') ||
        btn.href?.includes('/edit') ||
        btn.className.includes('edit')
      );
      
      if (editButton) {
        editButton.click();
        return true;
      }
      
      return false;
    }, categoryName);
    
    if (editButtonClicked) {
      logDebug(`[Compat] Successfully clicked edit button for ${categoryName}`);
      await page.waitForTimeout(2000);
      return true;
    }
    
    logDebug(`[Compat] Could not find edit button for ${categoryName}`);
    return false;
  } catch (error) {
    logDebug(`[Compat] Error clicking edit button: ${error.message}`);
    return false;
  }
}

// Helper to find and click the delete button for a category
async function clickDeleteCategoryButtonCompat(page, categoryName) {
  logDebug(`[Compat] Attempting to click delete button for category: ${categoryName}`);
  
  try {
    // Look for the delete button in the row containing the category
    const deleteButtonClicked = await page.evaluate((name) => {
      // Find the row containing the category
      const rows = Array.from(document.querySelectorAll('tr, div.category-row, div.category-item'));
      const categoryRow = rows.find(row => row.textContent.includes(name));
      
      if (!categoryRow) return false;
      
      // Look for any button that might be a delete button
      const buttons = Array.from(categoryRow.querySelectorAll('button, a'));
      const deleteButton = buttons.find(btn => 
        btn.textContent.includes('Delete') ||
        btn.className.includes('delete') ||
        btn.title?.includes('Delete')
      );
      
      if (deleteButton) {
        deleteButton.click();
        return true;
      }
      
      return false;
    }, categoryName);
    
    if (deleteButtonClicked) {
      logDebug(`[Compat] Successfully clicked delete button for ${categoryName}`);
      await page.waitForTimeout(1000);
      
      // Look for confirmation dialog and confirm
      const confirmed = await page.evaluate(() => {
        // Look for any button that might be a confirm button
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const confirmButton = buttons.find(btn => 
          btn.textContent.includes('Yes') ||
          btn.textContent.includes('Confirm') ||
          btn.textContent.includes('OK') ||
          btn.className.includes('confirm')
        );
        
        if (confirmButton) {
          confirmButton.click();
          return true;
        }
        
        return false;
      });
      
      if (confirmed) {
        logDebug('[Compat] Successfully confirmed deletion');
        await page.waitForTimeout(2000);
        return true;
      }
      
      logDebug('[Compat] Could not find confirmation button');
      return false;
    }
    
    logDebug(`[Compat] Could not find delete button for ${categoryName}`);
    return false;
  } catch (error) {
    logDebug(`[Compat] Error deleting category: ${error.message}`);
    return false;
  }
}

module.exports = {
  navigateToCategoriesCompat,
  clickAddCategoryCompat,
  fillCategoryFormCompat,
  submitFormCompat,
  checkCategoryExistsCompat,
  clickEditCategoryButtonCompat,
  clickDeleteCategoryButtonCompat
};
