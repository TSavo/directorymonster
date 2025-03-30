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
  timeout: 10000, // 10 seconds
  interval: 100, // 100ms between checks
  maxRetries: 20, // Maximum number of retries
  verbose: false, // Whether to log detailed information
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
  
  while (retryCount < maxRetries) {
    try {
      // Try to find the element
      const element = await page.$(selector);
      
      if (element) {
        if (verbose && retryCount > 0) {
          log(`Found element ${selector} after ${retryCount} retries`, 'info');
        }
        return element;
      }
    } catch (error) {
      lastError = error;
      if (verbose) {
        log(`Retry ${retryCount}: Failed to find ${selector} - ${error.message}`, 'debug');
      }
    }
    
    // Exponential backoff
    const delay = Math.min(100 * Math.pow(1.5, retryCount), 2000);
    await new Promise(resolve => setTimeout(resolve, delay));
    retryCount++;
  }
  
  log(`Failed to find element ${selector} after ${maxRetries} retries`, 'warning');
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
  return waitForHydration(
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
        
        // Check for any event listeners (a sign React has mounted)
        const hasEventListeners = document.querySelectorAll('button, a, input').length > 0;
        
        // If any of these are true, hydration is likely complete
        return hasNextHydrationMarker || hasHydratedMarkers || (hasReactRoot && hasEventListeners);
      });
    },
    {
      timeout: 15000, // Give it a bit more time
      message: 'Waiting for client-side hydration to complete'
    }
  );
}

module.exports = {
  waitForHydration,
  waitForFormElement,
  findElementWithRetry,
  isComponentHydrated,
  waitForClientHydration
};
