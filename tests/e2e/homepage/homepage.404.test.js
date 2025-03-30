/**
 * @file Homepage 404 error handling test
 * @description Tests that the 404 page works correctly
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../utils/test-utils');
const { waitForClientHydration } = require('../utils/hydration-utils');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';

describe('Homepage Error Handling', () => {
  let browser;
  let page;

  // Set up the browser and page before running tests
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.NODE_ENV === 'production',
      devtools: process.env.NODE_ENV !== 'production',
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--disable-setuid-sandbox',
        '--no-sandbox',
      ],
    });
    
    page = await browser.newPage();
    
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
  });

  // Clean up after all tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('Error handling - 404 page works correctly', async () => {
    // Navigate to a non-existent page with hostname parameter
    await page.goto(`${BASE_URL}/this-page-does-not-exist-${Date.now()}?hostname=${SITE_DOMAIN}`, {
      waitUntil: 'networkidle2',
    });

    // Take screenshot of 404 page
    await takeScreenshot(page, '404-page');

    // Check for 404 indicators in a more flexible way
    const has404Indicator = await page.evaluate(() => {
      const bodyText = document.body.textContent.toLowerCase();
      return bodyText.includes('404') || 
             bodyText.includes('not found') || 
             bodyText.includes("doesn't exist") ||
             bodyText.includes('could not be found') || 
             bodyText.includes('page not found') ||
             bodyText.includes('no page') ||
             bodyText.includes('missing') ||
             bodyText.includes('error');
    });
    
    // A proper site should indicate a 404 somehow
    expect(has404Indicator).toBe(true);
  });
});
