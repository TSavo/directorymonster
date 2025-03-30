/**
 * @file Homepage performance test
 * @description Tests that the homepage loads within a reasonable time
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { log } = require('../utils/test-utils');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';

describe('Homepage Performance', () => {
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

  test('Site performance - load times are reasonable', async () => {
    // Simple performance test without complex metrics
    
    // Navigate to the homepage with hostname parameter
    const navigationStart = Date.now();
    
    await page.goto(`${BASE_URL}?hostname=${SITE_DOMAIN}`, {
      waitUntil: 'networkidle2',
    });
    
    const navigationEnd = Date.now();
    const navigationTime = navigationEnd - navigationStart;
    
    log(`Navigation time: ${navigationTime}ms`);
    
    // Be very generous with the threshold for Docker/CI environments
    expect(navigationTime).toBeLessThan(20000); // Under 20 seconds
  });
});
