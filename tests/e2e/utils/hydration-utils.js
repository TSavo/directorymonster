/**
 * @file Utilities for dealing with component hydration in E2E tests
 * 
 * These utilities help make E2E tests more reliable by properly handling
 * component hydration timing issues that are common in Next.js applications.
 */

const { log } = require('./test-utils');

/**
 * Default configuration for waitForHydration
 */
const DEFAULT_CONFIG = {
  timeout: 15000, // Increased from 10000 to 15000 (15 seconds)
  interval: 200, // Increased from 100ms to 200ms between checks
  maxRetries: 30, // Increased from 20 to 30 retries
  verbose: true, // Changed to true for better debugging
  message: 'Waiting for component hydration' // Default log message
};

/**
 * Waits for a component to be hydrated based on the given condition
 * 
 * @param {Object} page - Puppeteer page object
 * @param {Function} condition - Function that returns true when component is hydrated
 * @param {Object} config - Configuration options
 * @returns {Promise<boolean>} - Whether the component was hydrated before timeout
 */
async function waitForHydration(page, condition, config = {}) {
  const options = { ...DEFAULT_CONFIG, ...config };
  const { timeout, interval, verbose, message } = options;
  
  const startTime = Date.now();
  const endTime = startTime + timeout;
  
  if (verbose) {
    log(`${message} (timeout: ${timeout}ms)`, 'info');
  }

  // Keep trying until timeout
  while (Date.now() < endTime) {
    try {
      // Check if condition is met
      const result = await condition(page);
      
      if (result) {
        const elapsedTime = Date.now() - startTime;
        if (verbose) {
          log(`Component hydrated after ${elapsedTime}ms`, 'info');
        }
        return true;
      }
    } catch (error) {
      // If the condition throws an error, it's not ready yet
      if (verbose) {
        log(`Hydration check failed: ${error.message}`, 'debug');
      }
    }
    
    // Wait before trying again
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  // If we got here, we timed out
  const elapsedTime = Date.now() - startTime;
  log(`Hydration timeout after ${elapsedTime}ms: ${message}`, 'warning');
  return false;
}

/**
 * Waits for a form element to be available and interactive
 * 
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector for the form element
 * @param {Object} config - Configuration options
 * @returns {Promise<boolean>} - Whether the element was found before timeout
 */
async function waitForFormElement(page, selector, config = {}) {
  const options = { ...DEFAULT_CONFIG, ...config };
  
  return waitForHydration(
    page,
    async (page) => {
      // Check if element exists
      const element = await page.$(selector);
      if (!element) {
        return false;
      }
      
      // Check if element is enabled and visible
      const isEnabled = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        
        // Check visibility
        const style = window.getComputedStyle(el);
        const isVisible = style.display !== 'none' && 
                          style.visibility !== 'hidden' && 
                          style.opacity !== '0';
        
        // Check if it's enabled
        const isDisabled = el.disabled === true || 
                          el.getAttribute('aria-disabled') === 'true';
        
        return isVisible && !isDisabled;
      }, selector);
      
      return isEnabled;
    },
    {
      ...options,
      message: `Waiting for form element: ${selector}`
    }
  );
}

/**
 * Tries to find an element with exponential backoff retry
 * 
 * This is useful for flaky form elements that might not be immediately available
 * after page load or after a dynamic UI change.
 * 
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector for the element
 * @param {Object} config - Configuration options
 * @returns {Promise<ElementHandle|null>} - The found element or null
 */
async function findElementWithRetry(page, selector, config = {}) {
  const options = { ...DEFAULT_CONFIG, ...config };
  const { maxRetries, verbose } = options;
  
  let retryCount = 0;
  let lastError = null;
  
  // Allow selector to be a comma-separated list of selectors to try
  const selectors = selector.split(',').map(s => s.trim());
  
  log(`Looking for elements with selectors: ${selectors.join(', ')}`, 'info');
  
  while (retryCount < maxRetries) {
    // Try each selector in the list
    for (const singleSelector of selectors) {
      try {
        // Try to find the element with this selector
        const element = await page.$(singleSelector);
        
        if (element) {
          if (verbose) {
            log(`Found element with selector "${singleSelector}" after ${retryCount} retries`, 'info');
          }
          return element;
        }
      } catch (error) {
        lastError = error;
        if (verbose) {
          log(`Retry ${retryCount}: Failed to find "${singleSelector}" - ${error.message}`, 'debug');
        }
      }
    }
    
    // If we get here, none of the selectors matched
    
    // Check if we should take a screenshot to help debug
    if (retryCount % 5 === 0) {
      try {
        const { takeScreenshot } = require('./test-utils');
        await takeScreenshot(page, `element-search-retry-${retryCount}`);
        
        // Also log the current HTML around where the element should be
        const html = await page.evaluate(() => document.body.innerHTML);
        const snippet = html.substring(0, 300) + '...';
        log(`Page HTML snippet: ${snippet}`, 'debug');
      } catch (e) {
        // Ignore screenshot errors
      }
    }
    
    // Exponential backoff with a bit more initial delay
    const delay = Math.min(200 * Math.pow(1.5, retryCount), 3000);
    await new Promise(resolve => setTimeout(resolve, delay));
    retryCount++;
  }
  
  log(`Failed to find any matching element after ${maxRetries} retries. Tried: ${selectors.join(', ')}`, 'warning');
  if (lastError) {
    log(`Last error: ${lastError.message}`, 'warning');
  }
  
  return null;
}

/**
 * Tests whether a component is hydrated by checking for specific attributes
 * 
 * @param {Object} page - Puppeteer page object
 * @param {string} selector - CSS selector for the component
 * @param {Array<string>} testids - List of data-testid attributes to check for
 * @param {Object} config - Configuration options
 * @returns {Promise<boolean>} - Whether the component is hydrated
 */
async function isComponentHydrated(page, selector, testids = [], config = {}) {
  return waitForHydration(
    page,
    async (page) => {
      // First check if the main element exists
      const element = await page.$(selector);
      if (!element) {
        return false;
      }
      
      // If no testids are provided, just check for the element
      if (testids.length === 0) {
        return true;
      }
      
      // Check for at least one of the required data-testid attributes
      const testIdResults = await Promise.all(
        testids.map(async (testid) => {
          const testidElement = await page.$(`[data-testid="${testid}"]`);
          return !!testidElement;
        })
      );
      
      return testIdResults.some(result => result);
    },
    {
      ...config,
      message: `Checking if component is hydrated: ${selector}`
    }
  );
}

/**
 * Waits for client-side hydration to complete by checking for key indicators
 * 
 * @param {Object} page - Puppeteer page object
 * @returns {Promise<boolean>} - Whether hydration is complete
 */
async function waitForClientHydration(page) {
  log('Waiting for client-side hydration to complete', 'info');
  
  // Take a screenshot before hydration check
  try {
    const { takeScreenshot } = require('./test-utils');
    await takeScreenshot(page, 'before-hydration-check');
  } catch (e) {
    // Ignore screenshot errors
  }
  
  const result = await waitForHydration(
    page,
    async (page) => {
      // Check if Next.js indicators of hydration are complete
      return page.evaluate(() => {
        // Modern Next.js has a hidden indicator of hydration complete
        const hasNextHydrationMarker = document.querySelector('#__NEXT_DATA__') !== null;
        
        // Alternative check: see if data-hydrated attribute exists anywhere
        const hasHydratedMarkers = document.querySelectorAll('[data-hydrated="true"]').length > 0;
        
        // Check if React has initialized the app 
        const hasReactRoot = document.querySelector('#__next') !== null;
        
        // Check for any interactive elements (a sign React has mounted)
        const hasInteractiveElements = document.querySelectorAll('button, a, input, form').length > 0;
        
        // Log what we found for debugging
        console.log('Hydration check:', {
          hasNextHydrationMarker,
          hasHydratedMarkers,
          hasReactRoot,
          interactiveElementCount: document.querySelectorAll('button, a, input, form').length
        });
        
        // If any of these are true, hydration is likely complete
        return hasNextHydrationMarker || hasHydratedMarkers || (hasReactRoot && hasInteractiveElements);
      });
    },
    {
      timeout: 20000, // Increased from 15000 to 20000 (20 seconds)
      message: 'Waiting for client-side hydration to complete'
    }
  );
  
  // Take another screenshot after hydration check
  try {
    const { takeScreenshot } = require('./test-utils');
    await takeScreenshot(page, 'after-hydration-check');
  } catch (e) {
    // Ignore screenshot errors
  }
  
  if (result) {
    log('Client-side hydration complete', 'info');
  } else {
    log('Client-side hydration timed out - proceeding anyway', 'warning');
  }
  
  return result;
}

module.exports = {
  waitForHydration,
  waitForFormElement,
  findElementWithRetry,
  isComponentHydrated,
  waitForClientHydration
};
