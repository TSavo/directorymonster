/**
 * @file Browser setup utilities for E2E testing
 */

const { log } = require('./test-utils');

/**
 * Sets up the browser and page for testing
 * @param {Object} puppeteer - Puppeteer instance
 * @param {Object} options - Setup options
 * @returns {Promise<Object>} - Browser and page objects
 */
async function setupBrowser(puppeteer, options = {}) {
  const {
    headless = true,
    width = 1280,
    height = 800,
    timeout = 60000,
    domain = 'localhost'
  } = options;
  
  log('Setting up browser for testing');
  
  try {
    // Launch browser
    const browser = await puppeteer.launch({
      headless,
      devtools: !headless,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        `--window-size=${width},${height}`
      ],
      defaultViewport: { width, height }
    });
    
    // Create page with extended timeouts
    const page = await browser.newPage();
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);
    
    // Set up console logging from browser
    page.on('console', msg => log(`Browser console: ${msg.text()}`));
    page.on('pageerror', err => log(`Browser page error: ${err.message}`, 'error'));
    
    // Set cookie for multitenancy testing
    if (domain !== 'localhost') {
      await page.setCookie({
        name: 'hostname',
        value: domain,
        domain: 'localhost',
        path: '/',
      });
      log(`Set hostname cookie for domain: ${domain}`);
    }
    
    // Set up error tracking
    page.on('requestfailed', request => {
      log(`Request failed: ${request.url()}`, 'error');
    });
    
    log('Browser setup complete');
    return { browser, page };
  } catch (error) {
    log(`Error setting up browser: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Gracefully closes the browser
 * @param {Object} browser - Puppeteer browser instance
 */
async function closeBrowser(browser) {
  if (browser) {
    log('Closing browser');
    await browser.close();
  }
}

/**
 * Checks if API is available and seeds test data if needed
 * @param {string} baseUrl - Base URL of the application
 * @param {string} siteSlug - Site slug to check/create
 * @returns {Promise<boolean>} - Whether API is available
 */
async function checkApiAndSeed(baseUrl, siteSlug) {
  log('Checking API availability and seeding data');
  
  try {
    // Check if API is available
    const healthResponse = await fetch(`${baseUrl}/api/healthcheck`);
    
    if (!healthResponse.ok) {
      log('API health check failed', 'error');
      return false;
    }
    
    log('API health check passed');
    
    // Try to seed the database
    try {
      const seedResponse = await fetch(`${baseUrl}/api/test/seed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          force: true,
          sites: [
            {
              name: `Test Site ${siteSlug}`,
              slug: siteSlug,
              domain: `${siteSlug}.example.com`,
              primaryKeyword: 'test site',
              metaDescription: 'Site created for E2E testing'
            }
          ]
        })
      });
      
      if (seedResponse.ok) {
        log('Database seeded successfully');
      } else {
        log(`Seed response status: ${seedResponse.status}`, 'warning');
        log('Could not seed database through API. Tests may still work with existing data.');
      }
    } catch (seedError) {
      log(`Error seeding database: ${seedError.message}`, 'warning');
    }
    
    return true;
  } catch (error) {
    log(`Error checking API: ${error.message}`, 'error');
    log('API may not be running. Start the server with npm run dev');
    return false;
  }
}

module.exports = {
  setupBrowser,
  closeBrowser,
  checkApiAndSeed
};
