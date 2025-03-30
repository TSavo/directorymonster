/**
 * @file Homepage rendering test
 * @description Tests that the homepage renders correctly with essential elements
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../utils/test-utils');
const { waitForClientHydration } = require('../utils/hydration-utils');
const HomepageSelectors = require('./homepage.selectors');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';

describe('Homepage Rendering', () => {
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

  test('Homepage renders correctly with essential elements', async () => {
    // Navigate to the homepage with hostname parameter
    await page.goto(`${BASE_URL}?hostname=${SITE_DOMAIN}`, {
      waitUntil: 'networkidle2',
    });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'homepage-loaded');

    // Verify the page title
    const title = await page.title();
    log(`Page title: ${title}`);
    
    // Handle dynamic site titles - just check if it has some content
    expect(title.length).toBeGreaterThan(0);

    // Verify that the page contains content
    const bodyText = await page.evaluate(() => document.body.textContent);
    expect(bodyText.length).toBeGreaterThan(0);

    // Add more resilient checks for elements
    const hasUI = await page.evaluate((selectors) => {
      // Look for any navigation-like elements, more resilient approach
      const hasLinks = document.querySelector(selectors.fallback.links) !== null;
      const hasSubstantialContent = document.body.textContent.length > 100;
      
      // Try to find header using data-testid or fallback selector
      const header = document.querySelector(selectors.header) || 
                     document.querySelector(selectors.fallback.header);
                     
      return hasLinks && hasSubstantialContent && (header !== null);
    }, HomepageSelectors);
    
    expect(hasUI).toBe(true);
  });
});
