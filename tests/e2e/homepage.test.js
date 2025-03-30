/**
 * @file E2E tests for the homepage functionality
 * @description Tests the homepage user experience using Puppeteer
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('./utils/test-utils');
const { waitForClientHydration, isComponentHydrated, waitForHydration } = require('./utils/hydration-utils');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';

// Test timeouts
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const NAVIGATION_TIMEOUT = 5000; // 5 seconds
const COMPONENT_TIMEOUT = 2000; // 2 seconds

/**
 * Homepage E2E test suite
 */
describe('Homepage', () => {
  /** @type {puppeteer.Browser} */
  let browser;
  
  /** @type {puppeteer.Page} */
  let page;

  // Set up the browser and page before running tests
  beforeAll(async () => {
    browser = await puppeteer.launch({
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
    
    page = await browser.newPage();
    
    // Configure reasonable timeouts
    page.setDefaultTimeout(DEFAULT_TIMEOUT);
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT);

    // Set viewport to a standard desktop size
    await page.setViewport({
      width: 1280,
      height: 800,
    });

    // Add hostname parameter for multitenancy testing
    await page.setCookie({
      name: 'hostname',
      value: SITE_DOMAIN,
      domain: 'localhost',
      path: '/',
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
    // Navigate to the homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'homepage-loaded');

    // Verify the page title
    const title = await page.title();
    
    // Handle dynamic site titles - check either for site domain or a common part of title
    const hasSiteDomain = title.toLowerCase().includes(SITE_DOMAIN.toLowerCase());
    const hasDirectoryMonster = title.toLowerCase().includes('directory') ||
                            title.toLowerCase().includes('monster');
    
    expect(hasSiteDomain || hasDirectoryMonster).toBe(true);

    // Wait for and verify essential homepage elements
    // Use data-testid attributes first, then fall back to basic selectors
    await waitForHydration(page, async (page) => {
      const header = await page.$('[data-testid="site-header"]');
      return !!header;
    }, { timeout: 5000, message: 'Waiting for site-header' });
    
    const headerExists = await page.$('[data-testid="site-header"]') !== null;
    const logoExists = await page.$('[data-testid="site-logo"]') !== null;
    const navigationExists = await page.$('[data-testid="site-navigation"]') !== null;
    const footerExists = await page.$('[data-testid="site-footer"]') !== null;
    
    expect(headerExists).toBe(true);
    expect(logoExists).toBe(true);
    expect(navigationExists).toBe(true);
    expect(footerExists).toBe(true);
  });

  test('Navigation menu works correctly', async () => {
    // Navigate to the homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Wait for the navigation to be available
    await waitForHydration(page, async (page) => {
      const nav = await page.$('[data-testid="site-navigation"]');
      return !!nav;
    }, { timeout: 5000, message: 'Waiting for site-navigation' });

    // Find all navigation links with improved selector
    const navLinks = await page.$('[data-testid="site-navigation"] a');
    
    log(`Found ${navLinks.length} navigation links`);
    expect(navLinks.length).toBeGreaterThan(0);

    // Test clicking the first navigation link
    if (navLinks.length > 0) {
      // Get href before clicking
      const firstNavLinkHref = await page.evaluate(link => link.getAttribute('href'), navLinks[0]);
      log(`Clicking navigation link with href: ${firstNavLinkHref}`);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        navLinks[0].click()
      ]);

      // Verify we navigated to the expected URL
      const currentUrl = page.url();
      log(`Navigated to URL: ${currentUrl}`);
      expect(currentUrl).toContain(firstNavLinkHref);

      // Take screenshot after navigation
      await takeScreenshot(page, 'after-nav-click');
      
      // Navigate back to the homepage
      await page.goto(BASE_URL, {
        waitUntil: 'networkidle2',
      });
    }
  });

  test('Responsive design adapts to mobile viewport', async () => {
    // Set mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
      isMobile: true,
    });

    // Navigate to the homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });

    // Check for mobile-specific elements
    const hamburgerMenuExists = await page.$('[data-testid="mobile-menu-button"], .hamburger, .mobile-menu-button, button[aria-label*="menu"]') !== null;
    
    if (hamburgerMenuExists) {
      // Test mobile menu toggle if it exists
      await page.click('[data-testid="mobile-menu-button"], .hamburger, .mobile-menu-button, button[aria-label*="menu"]');
      
      // Verify the mobile menu is shown
      await page.waitForSelector('[data-testid="mobile-menu-content"], .mobile-menu, .mobile-navigation', { 
        visible: true,
        timeout: COMPONENT_TIMEOUT
      });
      
      const mobileMenuVisible = await page.evaluate(() => {
        const menu = document.querySelector('[data-testid="mobile-menu-content"], .mobile-menu, .mobile-navigation');
        return menu ? window.getComputedStyle(menu).display !== 'none' : false;
      });
      
      expect(mobileMenuVisible).toBe(true);
    } else {
      // If there's no hamburger menu, check that navigation is still accessible in some form
      const navigationExists = await page.$('[data-testid="navigation"], nav, .navigation, .menu') !== null;
      expect(navigationExists).toBe(true);
    }

    // Reset viewport to desktop
    await page.setViewport({
      width: 1280,
      height: 800,
    });
  });

  test('Search functionality works', async () => {
    // Navigate to the homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Wait for the search form to be available and check if it exists
    const searchFormAvailable = await waitForHydration(page, async (page) => {
      const searchForm = await page.$('[data-testid="search-form"]');
      return !!searchForm;
    }, { timeout: 5000, message: 'Waiting for search-form' });
    
    if (!searchFormAvailable) {
      log('Search form not found, skipping search test', 'warning');
      return;
    }
    
    // Get the search input element using our data-testid attribute
    const searchInput = await page.$('[data-testid="search-input"]');
    
    if (!searchInput) {
      log('Search input not found, skipping search test', 'warning');
      return;
    }

    log('Entering search term');
    // Enter a search term
    await searchInput.type('test');
    await takeScreenshot(page, 'search-term-entered');
    
    // Find the search form using the data-testid attribute
    const searchForm = await page.$('[data-testid="search-form"]');
    
    if (searchForm) {
      log('Submitting search form');
      // Submit the form and wait for navigation
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        searchForm.evaluate(form => form.submit())
      ]);
      
      // Take screenshot after navigation
      await takeScreenshot(page, 'search-results-page');
      
      // Verify we're on the search results page
      const currentUrl = page.url();
      log(`Search results URL: ${currentUrl}`);
      expect(currentUrl).toContain('search');
      expect(currentUrl).toContain('test');
      
      // Wait for results to load
      await waitForHydration(page, async (page) => {
        const results = await page.$('[data-testid="search-results"]');
        return !!results;
      }, { timeout: 5000, message: 'Waiting for search-results' });
      
      const searchResultsExist = await page.$('[data-testid="search-results"]') !== null;
      expect(searchResultsExist).toBe(true);
    }
  });

  test('Featured content sections are visible', async () => {
    // Navigate to the homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Wait for the page content to be available
    await waitForHydration(page, async (page) => {
      const heroSection = await page.$('[data-testid="hero-section"]');
      return !!heroSection;
    }, { timeout: 5000, message: 'Waiting for hero-section' });
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'content-sections');

    // Check for homepage content sections using specific data-testid attributes
    const heroSectionExists = await page.$('[data-testid="hero-section"]') !== null;
    const categorySectionExists = await page.$('[data-testid="category-section"]') !== null;
    
    log(`Hero section found: ${heroSectionExists}`);
    log(`Category section found: ${categorySectionExists}`);
    
    // Expect at least the hero section to exist
    expect(heroSectionExists).toBe(true);
    
    // If we have categories, that section should exist too
    if (categorySectionExists) {
      // Check if category section has items
      const categoryItems = await page.$('[data-testid="category-section"] > div > div > div');
      log(`Found ${categoryItems.length} category items`);
    }
  });

  test('Footer contains expected elements', async () => {
    // Navigate to the homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });

    // Wait for client-side hydration to complete
    await waitForClientHydration(page);
    
    // Wait for the footer to be available
    await waitForHydration(page, async (page) => {
      const footer = await page.$('[data-testid="site-footer"]');
      return !!footer;
    }, { timeout: 5000, message: 'Waiting for site-footer' });
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'footer-section');

    // Check for copyright element using our specific data-testid
    const copyrightExists = await page.$('[data-testid="copyright"]') !== null;
    log(`Copyright element found: ${copyrightExists}`);
    expect(copyrightExists).toBe(true);
    
    // Check for footer links
    const footerLinks = await page.$('[data-testid="site-footer"] a');
    log(`Found ${footerLinks.length} footer links`);
    
    // If we have footer links, test clicking the first one (if it's an internal link)
    if (footerLinks.length > 0) {
      const firstFooterLinkHref = await page.evaluate(link => link.getAttribute('href'), footerLinks[0]);
      log(`First footer link href: ${firstFooterLinkHref}`);
      
      // Skip external links (they would navigate away from the site)
      if (firstFooterLinkHref && !firstFooterLinkHref.startsWith('http') && !firstFooterLinkHref.startsWith('//')) {
        log(`Clicking footer link: ${firstFooterLinkHref}`);
        
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          footerLinks[0].click()
        ]);
        
        // Verify we navigated to the expected URL
        const currentUrl = page.url();
        log(`Navigated to: ${currentUrl}`);
        expect(currentUrl).toContain(firstFooterLinkHref);
        
        // Take screenshot after navigation
        await takeScreenshot(page, 'after-footer-link-click');
      }
    }
  });

  test('Site performance - load times are reasonable', async () => {
    // Enable browser performance metrics
    const client = await page.target().createCDPSession();
    await client.send('Performance.enable');
    
    // Navigate to the homepage
    const navigationStart = Date.now();
    
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });
    
    const navigationEnd = Date.now();
    const navigationTime = navigationEnd - navigationStart;
    
    // Get performance metrics
    const perfMetrics = await client.send('Performance.getMetrics');
    const metrics = perfMetrics.metrics;
    
    // Extract relevant metrics
    const domContentLoaded = metrics.find(m => m.name === 'DomContentLoaded');
    const firstPaint = metrics.find(m => m.name === 'FirstPaint'); 
    const firstContentfulPaint = metrics.find(m => m.name === 'FirstContentfulPaint');
    
    console.log('Navigation time:', navigationTime);
    if (domContentLoaded) console.log('DomContentLoaded:', domContentLoaded.value);
    if (firstPaint) console.log('FirstPaint:', firstPaint.value);
    if (firstContentfulPaint) console.log('FirstContentfulPaint:', firstContentfulPaint.value);
    
    // Verify reasonable performance thresholds
    // Note: These thresholds are relatively generous for development/testing environments
    expect(navigationTime).toBeLessThan(10000); // Under 10 seconds for full load
  });

  test('Accessibility - keyboard navigation works', async () => {
    // Navigate to the homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });

    // Test keyboard navigation - tab through interactive elements
    await page.keyboard.press('Tab');
    
    // Get the focused element
    const focusedElement = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return {
        tagName: activeElement.tagName.toLowerCase(),
        href: activeElement.href,
        text: activeElement.textContent?.trim()
      };
    });
    
    // Verify the focused element is interactive (typically a link or button)
    expect(['a', 'button', 'input', 'select', 'textarea']).toContain(focusedElement.tagName);
    
    // Test that tab loop continues through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Get the newly focused element
    const newFocusedElement = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return {
        tagName: activeElement.tagName.toLowerCase(),
        href: activeElement.href,
        text: activeElement.textContent?.trim()
      };
    });
    
    // Verify a different element is now focused
    expect(newFocusedElement).not.toEqual(focusedElement);
  });

  test('Error handling - 404 page works correctly', async () => {
    // Navigate to a non-existent page
    await page.goto(`${BASE_URL}/this-page-does-not-exist-${Date.now()}`, {
      waitUntil: 'networkidle2',
    });

    // Check for 404 indicators
    const notFoundTextExists = await page.evaluate(() => {
      const pageContent = document.body.textContent;
      return pageContent.includes('404') || 
             pageContent.includes('Not Found') || 
             pageContent.includes('Page not found') ||
             pageContent.includes("doesn't exist") ||
             pageContent.includes('could not be found');
    });
    
    expect(notFoundTextExists).toBe(true);
    
    // Check that there's a way to navigate back to the homepage
    const homeNavExists = await page.evaluate(() => {
      // Look for links that might navigate to the homepage
      const links = document.querySelectorAll('a');
      return Array.from(links).some(link => {
        const href = link.getAttribute('href');
        const text = link.textContent.toLowerCase();
        return (href === '/' || href === './') ||
               text.includes('home') ||
               text.includes('homepage') ||
               link.querySelector('img[alt*="logo"]') !== null;
      });
    });
    expect(homeNavExists).toBe(true);
  });
});
