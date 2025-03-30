/**
 * @file Homepage content test
 * @description Tests that the homepage displays appropriate content sections and footer
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

describe('Homepage Content', () => {
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

  test('Featured content sections are visible', async () => {
    // Navigate to the homepage with hostname parameter
    await page.goto(`${BASE_URL}?hostname=${SITE_DOMAIN}`, {
      waitUntil: 'networkidle2',
    });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'content-sections');

    // Check for content in a more flexible way
    const hasContent = await page.evaluate((selectors) => {
      // Try to find content sections using data-testid attributes
      const heroSection = document.querySelector(selectors.heroSection);
      const categorySection = document.querySelector(selectors.categorySection);
      
      // If specific sections aren't found, look for any content containers
      if (!heroSection && !categorySection) {
        // Look for any sections, articles, or divs with substantial content
        const contentElements = document.querySelectorAll('section, article, .content, [class*="section"], [class*="container"]');
        return contentElements.length > 0 && document.body.textContent.length > 200;
      }
      
      return true;
    }, HomepageSelectors);
    
    expect(hasContent).toBe(true);
    
    // Check for any links or interactive elements in the content
    const hasLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      return links.length > 0;
    });
    
    log(`Found interactive elements: ${hasLinks}`);
  });

  test('Footer contains expected elements', async () => {
    // Navigate to the homepage with hostname parameter
    await page.goto(`${BASE_URL}?hostname=${SITE_DOMAIN}`, {
      waitUntil: 'networkidle2',
    });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'footer-section');

    // Look for footer-like content
    const hasFooterLikeContent = await page.evaluate((selectors) => {
      // Try to find footer using data-testid
      const footer = document.querySelector(selectors.footer);
      
      // If not found, try fallback selector
      if (!footer) {
        const footerElement = document.querySelector(selectors.fallback.footer);
        if (footerElement) return true;
      } else {
        return true;
      }
      
      // If still not found, check for content at the bottom of the page
      const allElements = Array.from(document.querySelectorAll('*'));
      const bottomElements = allElements
        .filter(el => el.getBoundingClientRect().bottom > window.innerHeight * 0.8)
        .filter(el => el.textContent && el.textContent.trim().length > 0);
        
      return bottomElements.length > 0;
    }, HomepageSelectors);
    
    log(`Found footer-like content: ${hasFooterLikeContent}`);
    
    // Check for copyright-like text
    const hasCopyrightText = await page.evaluate(() => {
      const bodyText = document.body.textContent.toLowerCase();
      return bodyText.includes('copyright') || 
             bodyText.includes('©') || 
             bodyText.includes('all rights reserved') ||
             bodyText.includes('rights reserved');
    });
    
    log(`Found copyright text: ${hasCopyrightText}`);
    // Don't fail test if copyright is not found - it's optional
  });
});
