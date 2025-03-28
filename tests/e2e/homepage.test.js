/**
 * @file E2E tests for the homepage functionality
 * @description Tests the homepage user experience using Puppeteer
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, expect } = require('@jest/globals');

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

    // Verify the page title
    const title = await page.title();
    expect(title).toContain(SITE_DOMAIN);

    // Verify essential homepage elements
    const headerExists = await page.$('[data-testid="site-header"], header, .header') !== null;
    const logoExists = await page.$('[data-testid="site-logo"], .logo, img[alt*="logo"]') !== null;
    const navigationExists = await page.$('[data-testid="navigation"], nav, .navigation, .menu') !== null;
    const footerExists = await page.$('[data-testid="site-footer"], footer, .footer') !== null;
    
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

    // Find all navigation links
    const navLinks = await page.$$('[data-testid="navigation"] a, nav a, .navigation a, .menu a');
    expect(navLinks.length).toBeGreaterThan(0);

    // Test clicking the first navigation link
    if (navLinks.length > 0) {
      const firstNavLinkHref = await page.evaluate(link => link.getAttribute('href'), navLinks[0]);
      
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        navLinks[0].click()
      ]);

      // Verify we navigated to the expected URL
      const currentUrl = page.url();
      expect(currentUrl).toContain(firstNavLinkHref);

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

    // Check if search form exists
    const searchFormExists = await page.$('[data-testid="search-form"], form[role="search"], .search-form, input[type="search"]') !== null;
    
    if (searchFormExists) {
      // Get the search input element
      const searchInput = await page.$('[data-testid="search-input"], input[type="search"], .search-input, input[placeholder*="search" i]');
      
      if (searchInput) {
        // Enter a search term
        await searchInput.type('test');
        
        // Submit the search form
        const searchForm = await page.$('[data-testid="search-form"], form[role="search"], .search-form');
        
        if (searchForm) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2' }),
            searchForm.evaluate(form => form.submit())
          ]);
          
          // Verify we're on the search results page
          const currentUrl = page.url();
          expect(currentUrl).toContain('search');
          expect(currentUrl).toContain('test');
          
          // Verify search results are displayed
          const searchResultsExist = await page.$('[data-testid="search-results"], .search-results, .results') !== null;
          expect(searchResultsExist).toBe(true);
        }
      }
    } else {
      console.log('Search functionality not found, skipping search test');
    }
  });

  test('Featured content sections are visible', async () => {
    // Navigate to the homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });

    // Check for common homepage content sections
    const featuredSectionExists = await page.$('[data-testid="featured-content"], .featured, .featured-section, .spotlight, .hero') !== null;
    const categorySectionExists = await page.$('[data-testid="category-section"], .categories, .category-list, .category-section') !== null;
    const listingSectionExists = await page.$('[data-testid="listing-section"], .listings, .listing-list, .listing-section, .products') !== null;
    
    // Expect at least one content section to exist
    expect(featuredSectionExists || categorySectionExists || listingSectionExists).toBe(true);
  });

  test('Footer contains expected elements', async () => {
    // Navigate to the homepage
    await page.goto(BASE_URL, {
      waitUntil: 'networkidle2',
    });

    // Check for common footer elements
    const copyrightExists = await page.$('[data-testid="copyright"], .copyright, footer *:contains("©")') !== null;
    const footerLinksExist = await page.$('footer a, [data-testid="footer-links"], .footer-links, .footer-nav') !== null;
    
    expect(footerLinksExist).toBe(true);
    
    // Test if at least one footer link is clickable
    const footerLinks = await page.$$('footer a, [data-testid="footer-links"] a, .footer-links a, .footer-nav a');
    
    if (footerLinks.length > 0) {
      const firstFooterLinkHref = await page.evaluate(link => link.getAttribute('href'), footerLinks[0]);
      
      // Skip external links (they would navigate away from the site)
      if (firstFooterLinkHref && !firstFooterLinkHref.startsWith('http') && !firstFooterLinkHref.startsWith('//')) {
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2' }),
          footerLinks[0].click()
        ]);
        
        // Verify we navigated to the expected URL
        const currentUrl = page.url();
        expect(currentUrl).toContain(firstFooterLinkHref);
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
    const homeNavExists = await page.$('a[href="/"], a[href="./"], a:contains("Home"), a:contains("homepage")') !== null;
    expect(homeNavExists).toBe(true);
  });
});
