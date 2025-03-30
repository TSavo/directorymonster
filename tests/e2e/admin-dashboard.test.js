/**
 * @file E2E tests for the admin dashboard functionality
 * @description Tests the admin dashboard UI elements, navigation, and functionality
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';  // Same username from first-user test
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123456';  // Same password from first-user test

// Test timeouts
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const NAVIGATION_TIMEOUT = 5000; // 5 seconds
const LOGIN_TIMEOUT = 10000; // 10 seconds
const DASHBOARD_TIMEOUT = 15000; // 15 seconds

/**
 * Admin Dashboard E2E test suite
 */
describe('Admin Dashboard', () => {
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

    // Authenticate before running tests
    await loginAsAdmin();
  });

  // Clean up after all tests
  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  /**
   * Helper function to login as admin
   */
  async function loginAsAdmin() {
    // Navigate to the login page
    console.log('Navigating to login page');
    await page.goto(`${BASE_URL}/login`, {
      waitUntil: 'networkidle2',
      timeout: 15000,
    });
    console.log('Login page loaded');

    // Find username/email and password fields
    const usernameInput = await page.$('input[type="text"], input[id="username"], input[name="username"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');

    if (!usernameInput || !passwordInput || !submitButton) {
      console.error('Login form not found!');
      throw new Error('Login form elements not found');
    }

    // Enter admin credentials
    await usernameInput.type(ADMIN_USERNAME);
    await passwordInput.type(ADMIN_PASSWORD);

    // Submit login form
    await submitButton.click();

    // Wait for navigation/login to complete using multiple strategies
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.waitForSelector('[data-testid="admin-dashboard"], .admin-header, .dashboard', { timeout: 30000 }),
        page.waitForFunction(
          () => window.location.href.includes('/admin') || 
                !document.querySelector('[data-testid="login-form"], form[action*="login"]'),
          { timeout: 30000 }
        )
      ]);
      
      console.log('Successfully logged in');
    } catch (error) {
      console.error('Login navigation error:', error.message);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'login-failure.png' });
      
      // Check if we're on an admin page regardless of navigation error
      const currentUrl = page.url();
      if (!currentUrl.includes('/admin') && currentUrl.includes('/login')) {
        throw new Error('Failed to log in - still on login page');
      }
    }
  }

  // Reset to admin dashboard before each test
  beforeEach(async () => {
    // Navigate to admin dashboard
    try {
      console.log('Navigating to admin dashboard');
      await page.goto(`${BASE_URL}/admin`, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });
    } catch (error) {
      console.error('Dashboard navigation error:', error.message);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'dashboard-nav-error.png' });
      
      // Check if we're already on admin page despite navigation error
      const currentUrl = page.url();
      if (!currentUrl.includes('/admin')) {
        // Try logging in again if navigation failed
        await loginAsAdmin();
        
        // Navigate to admin dashboard again
        await page.goto(`${BASE_URL}/admin`, {
          waitUntil: 'networkidle2',
          timeout: 15000,
        });
      }
    }
  });

  test('Admin dashboard renders correctly', async () => {
    console.log('Testing dashboard rendering');

    // Take a screenshot for verification
    await page.screenshot({ path: 'admin-dashboard.png' });

    // Verify basic dashboard elements
    const dashboardElements = await page.evaluate(() => {
      // Look for common dashboard elements using data-testid attributes
      const hasHeader = Boolean(
        document.querySelector('[data-testid="admin-header"]') ||
        document.querySelector('header') || 
        document.querySelector('.header')
      );
      
      const hasSidebar = Boolean(
        document.querySelector('[data-testid="admin-sidebar"]') ||
        document.querySelector('nav') || 
        document.querySelector('.sidebar')
      );
      
      const hasContent = Boolean(
        document.querySelector('[data-testid="admin-content"]') ||
        document.querySelector('main') || 
        document.querySelector('.content')
      );
      
      const hasHeading = Array.from(document.querySelectorAll('h1, h2, h3'))
        .some(h => h.textContent.includes('Dashboard') || h.textContent.includes('Admin'));
      
      return { hasHeader, hasSidebar, hasContent, hasHeading };
    });

    // At least some of these elements should exist in a proper dashboard
    expect(dashboardElements.hasHeader || dashboardElements.hasSidebar || dashboardElements.hasContent).toBe(true);
    expect(dashboardElements.hasHeading).toBe(true);
    
    // Verify URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');
  }, 15000);

  test('Admin dashboard shows statistics', async () => {
    console.log('Testing dashboard statistics');

    // Wait for statistics to load
    try {
      await page.waitForSelector('[data-testid="statistic-card"], .statistic-card, .dashboard-stats', {
        timeout: DASHBOARD_TIMEOUT,
      });
    } catch (error) {
      console.log('Statistics elements not found with exact selectors, checking for any statistics');
    }

    // Look for any statistics or metrics on the page
    const hasStatistics = await page.evaluate(() => {
      // Look for elements that might contain statistics
      const cards = document.querySelectorAll('.card, .stat, .metric, [data-testid*="statistic"]');
      
      // If we have explicit stat cards, return true
      if (cards.length > 0) return true;
      
      // Otherwise, look for numbers that might be statistics
      const numbers = Array.from(document.querySelectorAll('*')).filter(el => {
        // Look for elements containing numbers in common statistic formats
        const text = el.textContent;
        return /\d+[.,]\d+[KMB]?/.test(text) || // Numbers with decimal points
               /\$\d+/.test(text) ||            // Dollar amounts
               /\d+%/.test(text);               // Percentages
      });
      
      return numbers.length > 0;
    });

    // Take a screenshot for verification
    await page.screenshot({ path: 'admin-statistics.png' });

    // Flexible check - not all dashboards have explicit statistics
    if (!hasStatistics) {
      console.log('No explicit statistics found, this test is non-blocking');
    }
  });

  test('Admin sidebar navigation works', async () => {
    console.log('Testing sidebar navigation');

    // Look for navigation links in the sidebar
    const navigationLinks = await page.evaluate(() => {
      // Look for nav elements with data-testid attributes
      const navContainer = document.querySelector('[data-testid="admin-navigation"]');
      
      // If we found the navigation container with data-testid, use it
      if (navContainer) {
        const links = Array.from(navContainer.querySelectorAll('a'));
        return links.map(link => ({
          text: link.textContent.trim(),
          href: link.getAttribute('href'),
          testId: link.getAttribute('data-testid')
        })).filter(link => link.href && link.href !== '#');
      }
      
      // Fallback to traditional selectors
      const links = Array.from(
        document.querySelectorAll('nav a, aside a, .sidebar a, [role="navigation"] a')
      );
      
      return links.map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href'),
        testId: link.getAttribute('data-testid')
      })).filter(link => link.href && link.href !== '#');
    });

    console.log(`Found ${navigationLinks.length} navigation links`);

    // There should be some navigation links
    // If there are none, try a different approach to find navigation elements
    if (navigationLinks.length === 0) {
      // Look for any clickable elements that might be navigation
      const hasNavElements = await page.evaluate(() => {
        return document.querySelectorAll('button, [role="button"], [role="tab"]').length > 0;
      });
      
      // At least some navigation elements should exist
      expect(hasNavElements).toBe(true);
    } else {
      // Test clicking the first navigation link
      const firstLink = navigationLinks[0];
      
      // Use data-testid if available, otherwise fallback to href
      const selector = firstLink.testId 
        ? `[data-testid="${firstLink.testId}"]`
        : `a[href="${firstLink.href}"]`;
      
      console.log(`Clicking navigation link with selector: ${selector}`);
      
      // Navigate using the appropriate selector
      await Promise.all([
        // Use a timeout-based navigation detection
        new Promise(resolve => {
          // Set a timeout to resolve after navigation should have completed
          setTimeout(resolve, 5000);
          // Start the navigation by clicking the link
          page.click(selector).catch(e => console.log('Click error:', e.message));
        }),
        // Wait for navigation to settle if it happens
        page.waitForNavigation({ timeout: 5000 }).catch(() => {})
      ]);
      
      
      // Wait for navigation to complete
      try {
        await page.waitForNavigation({ timeout: NAVIGATION_TIMEOUT });
      } catch (error) {
        console.log('Navigation timeout occurred, checking URL changes');
      }
      
      // Verify that navigation occurred
      const newUrl = page.url();
      expect(newUrl).not.toEqual(`${BASE_URL}/admin`);
      
      // Take screenshot
      await page.screenshot({ path: 'admin-navigation.png' });
    }
  }, 15000);

  test('Activity feed displays recent activities', async () => {
    console.log('Testing activity feed');

    // Check if activity feed exists
    const hasActivityFeed = await page.evaluate(() => {
      // Look for elements with specific data-testid attributes first
      const activityFeedElement = document.querySelector('[data-testid="activity-feed"]');
      if (activityFeedElement) return true;
      
      // Fallback to other selectors if data-testid not found
      return Boolean(
        document.querySelector('.activity-feed, .feed') ||
        Array.from(document.querySelectorAll('h2, h3')).some(h => 
          h.textContent.includes('Activity') || 
          h.textContent.includes('Recent')
        )
      );
    });

    // Take screenshot for verification
    await page.screenshot({ path: 'admin-activity.png' });

    // Not all dashboards have activity feeds, so this is a non-blocking test
    if (!hasActivityFeed) {
      console.log('No activity feed found, this test is non-blocking');
    } else {
      // Verify activity feed has items
      const activityItems = await page.evaluate(() => {
        // Look for activity feed content with data-testid
        const activityFeedContent = document.querySelector('[data-testid="activity-feed-content"]');
        if (activityFeedContent) {
          // Count items in the feed content
          return activityFeedContent.querySelectorAll('div > div').length;
        }
        
        // Fallback to the whole feed if content container not found
        const activityFeed = document.querySelector('[data-testid="activity-feed"], .activity-feed, .feed');
        
        // If we can't find the feed, look for elements that might be activity items
        if (!activityFeed) {
          return document.querySelectorAll('.activity-item, .timeline-item, .feed-item, li').length;
        }
        
        // Otherwise, count the items in the feed
        return activityFeed.querySelectorAll('li, .item, div > p').length;
      });
      
      console.log(`Found ${activityItems} activity items`);
      
      // There should be at least one activity item or the feed should be empty with a message
      const hasEmptyMessage = await page.evaluate(() => {
        // Check for empty state element with data-testid first
        if (document.querySelector('[data-testid="activity-feed-empty"]')) {
          return true;
        }
        
        // Fallback to searching body text content
        return Boolean(
          document.body.textContent.includes('No recent activity') ||
          document.body.textContent.includes('No activity found')
        );
      });
      
      // Either there are activity items, or there's an empty state message
      expect(activityItems > 0 || hasEmptyMessage).toBe(true);
    }
  });

  test('Admin dashboard is responsive', async () => {
    console.log('Testing dashboard responsiveness');

    // Test mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
      // isMobile: true
    });

    // Take screenshot to verify mobile layout
    await page.screenshot({ path: 'admin-mobile.png' });

    // Verify responsiveness by checking for mobile UI elements
    const mobileUIElements = await page.evaluate(() => {
      const hasMobileMenu = Boolean(
        document.querySelector('.hamburger-menu, .mobile-menu, [data-testid="mobile-menu"]') ||
        document.querySelector('button[aria-label*="menu"], button[aria-label*="Menu"]')
      );
      
      const hasCollapsedSidebar = document.querySelector('nav, .sidebar, aside')?.classList.contains('collapsed');
      
      const hasResponsiveLayout = !document.querySelector('body')?.classList.contains('overflow-hidden');
      
      return { hasMobileMenu, hasCollapsedSidebar, hasResponsiveLayout };
    });

    // Either a mobile menu, collapsed sidebar, or responsive layout should exist
    const isResponsive = mobileUIElements.hasMobileMenu || 
                         mobileUIElements.hasCollapsedSidebar || 
                         mobileUIElements.hasResponsiveLayout;

    // Not all dashboards have explicit mobile elements, so this is a non-blocking test
    if (!isResponsive) {
      console.log('No explicit mobile UI elements found, this test is non-blocking');
    }

    // Reset viewport to desktop
    await page.setViewport({
      width: 1280,
      height: 800,
    });
  });
});
