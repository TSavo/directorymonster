/**
 * Homepage test setup
 * 
 * Sets up the browser and page for homepage tests
 */

import puppeteer, { Browser, Page } from 'puppeteer';

// Test timeouts
export const DEFAULT_TIMEOUT = 30000; // 30 seconds
export const NAVIGATION_TIMEOUT = 5000; // 5 seconds
export const COMPONENT_TIMEOUT = 2000; // 2 seconds

/**
 * Initialize puppeteer browser and page for tests
 */
export async function setupBrowserAndPage(): Promise<{ browser: Browser; page: Page }> {
  const browser = await puppeteer.launch({
    // Run in non-headless mode during development for debugging
    headless: process.env.NODE_ENV === 'production',
    // Enable Chrome DevTools for debugging
    devtools: process.env.NODE_ENV !== 'production',
    // Additional arguments for better testing performance
    args: [
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--no-sandbox',
    ],
  });
  
  const page = await browser.newPage();
  
  // Configure reasonable timeouts
  page.setDefaultTimeout(DEFAULT_TIMEOUT);
  page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

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

  return { browser, page };
}

/**
 * Clean up browser after tests
 */
export async function teardownBrowser(browser: Browser): Promise<void> {
  if (browser) {
    await browser.close();
  }
}
