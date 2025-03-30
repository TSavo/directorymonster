/**
 * @file Global test setup
 * @description Setup file for E2E tests with Puppeteer
 */

const puppeteer = require('puppeteer');

// Initialize the browser and make it globally available to all tests
module.exports = async function globalSetup() {
  // Set common timeouts for tests
  jest.setTimeout(30000);
  
  // Initialize browser and page for all tests
  global.__BROWSER__ = await puppeteer.launch({
    headless: process.env.NODE_ENV === 'production',
    devtools: process.env.NODE_ENV !== 'production',
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
    ],
  });
  
  // Make sure we log possible errors
  process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at Promise:', p, 'reason:', reason);
  });
};
