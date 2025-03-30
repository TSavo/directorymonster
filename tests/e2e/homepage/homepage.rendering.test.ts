/**
 * Homepage rendering test
 * 
 * Tests that the homepage renders correctly with all essential elements
 */

import { Browser, Page } from 'puppeteer';
import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { HomepageSelectors } from './homepage.selectors';
import { 
  navigateToHomepage, 
  validatePageTitle, 
  hasBodyContent 
} from './homepage.utils';
import { setupBrowserAndPage, teardownBrowser } from './homepage.setup';

describe('Homepage Rendering', () => {
  let browser: Browser;
  let page: Page;

  // Set up browser and page before running tests
  beforeAll(async () => {
    const setup = await setupBrowserAndPage();
    browser = setup.browser;
    page = setup.page;
  });

  // Clean up after all tests
  afterAll(async () => {
    await teardownBrowser(browser);
  });

  test('Homepage renders with a valid title and content', async () => {
    // Navigate to the homepage
    await navigateToHomepage(page);

    // Verify page has a title
    const hasTitleContent = await validatePageTitle(page);
    expect(hasTitleContent).toBe(true);

    // Verify page has body content
    const hasContent = await hasBodyContent(page);
    expect(hasContent).toBe(true);
  });

  test('Homepage has essential UI elements', async () => {
    // Navigate to the homepage
    await navigateToHomepage(page, { takeScreenshot: false });

    // Check for basic UI elements using a resilient approach
    const hasUI = await page.evaluate((selectors) => {
      // Try to find any links, which should exist on any homepage
      const hasLinks = document.querySelector('a') !== null;
      
      // Try to find header using data-testid or fallback selector
      const header = document.querySelector(selectors.page.header) || 
                     document.querySelector(selectors.fallback.header);
      
      // Try to find navigation using data-testid or fallback selector
      const nav = document.querySelector(selectors.page.navigation) ||
                  document.querySelector(selectors.fallback.navigation);
      
      // Return true if we found some basic UI elements
      return hasLinks && (header !== null || nav !== null);
    }, HomepageSelectors);
    
    expect(hasUI).toBe(true);
  });
});
