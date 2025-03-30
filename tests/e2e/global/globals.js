/**
 * @file Test globals
 * @description Global variables and utilities for E2E tests
 */

const { takeScreenshot, log } = require('../utils/test-utils');

// Global configuration
global.TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  SITE_DOMAIN: process.env.SITE_DOMAIN || 'mydirectory.com',
  TIMEOUTS: {
    DEFAULT: 30000,
    NAVIGATION: 5000,
    COMPONENT: 2000
  }
};

// Global helper functions
global.getNewPage = async () => {
  const page = await global.__BROWSER__.newPage();
  
  // Configure reasonable timeouts
  page.setDefaultTimeout(global.TEST_CONFIG.TIMEOUTS.DEFAULT);
  page.setDefaultNavigationTimeout(global.TEST_CONFIG.TIMEOUTS.NAVIGATION);

  // Set viewport to a standard desktop size
  await page.setViewport({
    width: 1280,
    height: 800,
  });

  // Enable console logging for debugging
  page.on('console', (message) => {
    if (process.env.DEBUG) {
      console.log(`Browser console: ${message.text()}`);
    }
  });
  
  return page;
};

// Add global screenshot and logging functions
global.takeScreenshot = takeScreenshot;
global.log = log;
