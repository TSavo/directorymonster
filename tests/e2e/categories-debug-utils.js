/**
 * @file Utilities for capturing and analyzing page content
 */

const fs = require('fs');
const path = require('path');
const { logDebug, LOGS_DIR, HTML_DUMPS_DIR } = require('./categories-debug-setup');

// Helper function to save HTML content with detailed information
async function saveHtmlDump(page, prefix) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const url = await page.url();
  
  // Save URL information
  const urlFilePath = path.join(HTML_DUMPS_DIR, `${prefix}-${timestamp}-url.txt`);
  fs.writeFileSync(urlFilePath, url, 'utf8');
  logDebug(`Saved URL to: ${urlFilePath}`);
  
  // Save HTML content
  const html = await page.content();
  const htmlFilePath = path.join(HTML_DUMPS_DIR, `${prefix}-${timestamp}.html`);
  fs.writeFileSync(htmlFilePath, html, 'utf8');
  logDebug(`Saved HTML to: ${htmlFilePath}`);
  
  // Extract and save console errors
  const consoleErrors = await page.evaluate(() => {
    return window.consoleErrors || [];
  });
  
  if (consoleErrors && consoleErrors.length > 0) {
    const errorsFilePath = path.join(LOGS_DIR, `${prefix}-${timestamp}-console-errors.json`);
    fs.writeFileSync(errorsFilePath, JSON.stringify(consoleErrors, null, 2), 'utf8');
    logDebug(`Saved ${consoleErrors.length} console errors to: ${errorsFilePath}`);
  }
  
  // Extract detailed page information
  try {
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        // Document structure
        bodyClasses: document.body.className,
        bodyId: document.body.id,
        headings: {
          h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
          h2: Array.from(document.querySelectorAll('h2')).map(h => h.textContent.trim()),
        },
        // Key UI elements
        navigation: {
          links: Array.from(document.querySelectorAll('nav a')).map(a => ({
            text: a.textContent.trim(),
            href: a.href,
            classes: a.className
          })),
        },
        forms: Array.from(document.querySelectorAll('form')).map(form => ({
          id: form.id,
          action: form.action,
          method: form.method,
          inputs: Array.from(form.querySelectorAll('input')).map(input => ({
            type: input.type,
            name: input.name,
            id: input.id,
            value: input.type !== 'password' ? input.value : '[MASKED]'
          })),
          buttons: Array.from(form.querySelectorAll('button')).map(btn => ({
            text: btn.textContent.trim(),
            type: btn.type
          }))
        })),
        tables: Array.from(document.querySelectorAll('table')).map(table => ({
          id: table.id,
          classes: table.className,
          headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim()),
          rowCount: table.rows.length,
        })),
        // Category specific elements
        categoryElements: {
          categoryTable: document.querySelector('.category-table, [data-testid="category-table"]') !== null,
          categoryRows: document.querySelectorAll('.category-row, tr[data-category-id], .category-item').length,
          addCategoryButton: document.querySelector('button:contains("Add Category"), a:contains("Add Category")') !== null,
          categoryTitle: document.querySelector('h1:contains("Category"), h2:contains("Category")') !== null,
        },
        // Error states
        errors: {
          alerts: Array.from(document.querySelectorAll('.alert, .alert-error, .error')).map(el => ({
            text: el.textContent.trim(),
            classes: el.className,
          })),
          redText: Array.from(document.querySelectorAll('.text-red-500, .text-red-600, .text-danger')).map(el => el.textContent.trim()),
          hasErrorMessage: document.body.textContent.includes('Error') || document.body.textContent.includes('error') || document.body.textContent.includes('failed'),
        },
        // Basic DOM structure
        domSummary: {
          elementCounts: {
            divs: document.querySelectorAll('div').length,
            spans: document.querySelectorAll('span').length,
            paragraphs: document.querySelectorAll('p').length,
            tables: document.querySelectorAll('table').length,
            forms: document.querySelectorAll('form').length,
            buttons: document.querySelectorAll('button').length,
            links: document.querySelectorAll('a').length,
          },
          // Get the first few elements of major containers for debugging
          mainContent: document.querySelector('main')?.innerHTML.substring(0, 1000) || 'No main element found',
          firstTable: document.querySelector('table')?.outerHTML.substring(0, 1000) || 'No table found',
        }
      };
    });
    
    const infoFilePath = path.join(LOGS_DIR, `${prefix}-${timestamp}-info.json`);
    fs.writeFileSync(infoFilePath, JSON.stringify(pageInfo, null, 2), 'utf8');
    logDebug(`Saved detailed page info to: ${infoFilePath}`);
    
    // Add key information to the main debug log
    logDebug(`Page title: ${pageInfo.title}`);
    logDebug(`URL: ${pageInfo.url}`);
    if (pageInfo.errors.hasErrorMessage) {
      logDebug(`⚠️ Error detected on page!`);
      if (pageInfo.errors.redText.length > 0) {
        logDebug(`Error messages: ${pageInfo.errors.redText.join(', ')}`);
      }
    }
    
    // Log category-specific elements
    if (pageInfo.categoryElements.categoryTable) {
      logDebug(`✅ Category table found with ${pageInfo.categoryElements.categoryRows} rows`);
    } else {
      logDebug(`❌ Category table NOT found`);
    }
    
    return pageInfo;
  } catch (error) {
    logDebug(`Error extracting page info: ${error.message}`);
    return null;
  }
}

// Helper function to capture React component stack if available
async function captureReactStack(page, prefix) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Try to find React errors in the DOM
    const reactErrors = await page.evaluate(() => {
      // Look for React error boundaries or error messages
      const errorElements = document.querySelectorAll('[data-reactroot] .error, [data-reactroot] .error-boundary, .react-error-boundary');
      
      if (errorElements.length === 0) {
        return null;
      }
      
      return Array.from(errorElements).map(el => ({
        text: el.textContent,
        stack: el.querySelector('.error-stack')?.textContent || 'No stack trace found',
        component: el.closest('[data-component-name]')?.getAttribute('data-component-name') || 'Unknown component'
      }));
    });
    
    if (reactErrors) {
      const filePath = path.join(LOGS_DIR, `${prefix}-${timestamp}-react-errors.json`);
      fs.writeFileSync(filePath, JSON.stringify(reactErrors, null, 2), 'utf8');
      logDebug(`Saved React error details to: ${filePath}`);
      
      // Log the errors to the main log file too
      reactErrors.forEach(err => {
        logDebug(`React Error in ${err.component}: ${err.text.substring(0, 100)}...`);
      });
    }
    
    // Try to extract component hierarchy
    const componentHierarchy = await page.evaluate(() => {
      // This is a simplified attempt - in practice, accessing React internals is complex
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        // Only works if React DevTools extension is installed
        return 'React DevTools detected but component hierarchy extraction requires additional setup';
      }
      
      // Alternative approach - look for data attributes that might indicate component structure
      const componentElements = document.querySelectorAll('[data-testid], [data-component]');
      return Array.from(componentElements).map(el => ({
        testId: el.getAttribute('data-testid'),
        component: el.getAttribute('data-component'),
        text: el.textContent.substring(0, 50),
        childElementCount: el.childElementCount
      }));
    });
    
    if (componentHierarchy) {
      const filePath = path.join(LOGS_DIR, `${prefix}-${timestamp}-components.json`);
      fs.writeFileSync(filePath, JSON.stringify(componentHierarchy, null, 2), 'utf8');
      logDebug(`Saved component information to: ${filePath}`);
    }
  } catch (error) {
    logDebug(`Error capturing React information: ${error.message}`);
  }
}

// Helper function to take screenshots with more detailed context
async function takeDetailedScreenshot(page, prefix) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const screenshotPath = path.join(LOGS_DIR, `${prefix}-${timestamp}.png`);
    
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    
    logDebug(`Saved screenshot to: ${screenshotPath}`);
    
    // Also capture the viewport dimensions and device info
    const viewportInfo = await page.evaluate(() => ({
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      screen: {
        width: window.screen.width,
        height: window.screen.height,
        orientation: window.screen.orientation?.type || 'unknown'
      },
      userAgent: navigator.userAgent
    }));
    
    const infoPath = path.join(LOGS_DIR, `${prefix}-${timestamp}-viewport.json`);
    fs.writeFileSync(infoPath, JSON.stringify(viewportInfo, null, 2), 'utf8');
  } catch (error) {
    logDebug(`Error taking screenshot: ${error.message}`);
  }
}

// Helper function for comprehensive page analysis
async function analyzePageComprehensively(page, name) {
  logDebug(`\n----- COMPREHENSIVE ANALYSIS: ${name} -----`);
  
  // Save HTML content
  await saveHtmlDump(page, name);
  
  // Capture screenshot
  await takeDetailedScreenshot(page, name);
  
  // Capture React component information
  await captureReactStack(page, name);
  
  // Analyze JavaScript errors
  const jsErrors = await page.evaluate(() => {
    return {
      errors: window.jsErrors || [],
      ajaxErrors: window.ajaxErrors || [],
      resourceErrors: window.resourceErrors || []
    };
  });
  
  if (jsErrors.errors.length > 0 || jsErrors.ajaxErrors.length > 0 || jsErrors.resourceErrors.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(LOGS_DIR, `${name}-${timestamp}-js-errors.json`);
    fs.writeFileSync(filePath, JSON.stringify(jsErrors, null, 2), 'utf8');
    logDebug(`Saved JavaScript errors to: ${filePath}`);
    
    if (jsErrors.errors.length > 0) {
      logDebug(`Found ${jsErrors.errors.length} JavaScript errors`);
    }
    if (jsErrors.ajaxErrors.length > 0) {
      logDebug(`Found ${jsErrors.ajaxErrors.length} AJAX errors`);
    }
  }
  
  // Extract network requests if possible
  try {
    const requests = await page.evaluate(() => {
      if (!window.performance || !window.performance.getEntries) {
        return null;
      }
      
      return window.performance.getEntries()
        .filter(entry => entry.entryType === 'resource')
        .map(entry => ({
          name: entry.name,
          type: entry.initiatorType,
          duration: entry.duration,
          startTime: entry.startTime,
          size: entry.transferSize
        }));
    });
    
    if (requests) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = path.join(LOGS_DIR, `${name}-${timestamp}-network.json`);
      fs.writeFileSync(filePath, JSON.stringify(requests, null, 2), 'utf8');
      logDebug(`Saved network request information to: ${filePath}`);
      
      // Log API requests specifically
      const apiRequests = requests.filter(req => req.name.includes('/api/'));
      if (apiRequests.length > 0) {
        logDebug(`Found ${apiRequests.length} API requests`);
        apiRequests.forEach(req => {
          logDebug(`  API call to: ${req.name.split('/api/')[1]}`);
        });
      }
    }
  } catch (error) {
    logDebug(`Error extracting network requests: ${error.message}`);
  }
  
  // Check for specific errors in Next.js that might not be caught as JS errors
  await page.evaluate(() => {
    // Look for Next.js error containers
    const nextErrors = document.querySelectorAll('[data-next-error], #nextjs-portal-root .nextjs-container-errors-header');
    if (nextErrors.length > 0) {
      console.error('Next.js Error found in DOM:', Array.from(nextErrors).map(el => el.textContent).join('\n'));
    }
  });
  
  logDebug(`----- ANALYSIS COMPLETE -----\n`);
}

module.exports = {
  saveHtmlDump,
  captureReactStack,
  takeDetailedScreenshot,
  analyzePageComprehensively
};
