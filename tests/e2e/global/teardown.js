/**
 * @file Global test teardown
 * @description Teardown file for E2E tests with Puppeteer
 */

module.exports = async function globalTeardown() {
  // Close the browser instance
  if (global.__BROWSER__) {
    await global.__BROWSER__.close();
  }
  
  // Clean up any other resources here
  console.log('✅ E2E test environment cleaned up.');
};
