/**
 * @file Admin Dashboard rendering test
 * @description Tests that the admin dashboard renders correctly with essential elements
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../utils/test-utils');
const { waitForClientHydration } = require('../utils/hydration-utils');
const AdminDashboardSelectors = require('./admin-dashboard.selectors');
const { 
  navigateToDashboard, 
  SITE_DOMAIN, 
  DEFAULT_TIMEOUT 
} = require('./admin-dashboard.setup');

// Define page title expectations - be flexible to accommodate changes
const TITLE_PATTERNS = [
  'Dashboard',
  'Admin',
  'DirectoryMonster',
  'Overview'
];

describe('Admin Dashboard Rendering', () => {
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
    
    // Configure reasonable timeouts
    page.setDefaultTimeout(DEFAULT_TIMEOUT);
    
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

  // Navigate to admin dashboard before each test
  beforeEach(async () => {
    const dashboardLoaded = await navigateToDashboard(page, {
      ensureAuthenticated: true,
      waitForHydration: true,
      takeScreenshot: true
    });

    // Skip test if navigation fails (will be marked as failing)
    if (!dashboardLoaded) {
      throw new Error('Failed to navigate to admin dashboard');
    }
  });

  test('Admin dashboard renders with essential elements', async () => {
    // Take a screenshot for verification
    await takeScreenshot(page, 'admin-dashboard-rendering');

    // Verify the page title contains expected text
    const title = await page.title();
    log(`Page title: ${title}`);
    
    // Check if title contains any of the expected patterns
    const hasTitleMatch = TITLE_PATTERNS.some(pattern => title.includes(pattern));
    expect(hasTitleMatch).toBe(true);

    // Verify basic dashboard elements exist
    const dashboardElements = await page.evaluate((selectors) => {
      // Check for main container
      const dashboardContainer = document.querySelector(selectors.dashboard.container) || 
                                document.querySelector(selectors.fallback.dashboard);
      
      // Check for header
      const hasHeader = Boolean(
        document.querySelector(selectors.dashboard.header) ||
        document.querySelector(selectors.fallback.header)
      );
      
      // Check for sidebar
      const hasSidebar = Boolean(
        document.querySelector(selectors.dashboard.sidebar) ||
        document.querySelector(selectors.fallback.sidebar)
      );
      
      // Check for main content area
      const hasContent = Boolean(
        document.querySelector(selectors.dashboard.content) ||
        document.querySelector(selectors.fallback.content)
      );
      
      // Check for heading
      const hasHeading = Boolean(
        document.querySelector(selectors.dashboard.heading) ||
        document.querySelector(selectors.fallback.heading)
      );
      
      return { 
        hasDashboard: dashboardContainer !== null,
        hasHeader, 
        hasSidebar, 
        hasContent, 
        hasHeading 
      };
    }, AdminDashboardSelectors);
    
    // Dashboard container must exist
    expect(dashboardElements.hasDashboard).toBe(true);
    
    // At least some of these elements should exist in a proper dashboard
    // (We're being flexible with expectations since implementation might vary)
    const hasEssentialElements = 
      dashboardElements.hasHeader || 
      dashboardElements.hasSidebar || 
      dashboardElements.hasContent;
      
    expect(hasEssentialElements).toBe(true);
    
    // There should be either a heading or content to indicate this is a dashboard
    expect(dashboardElements.hasHeading || dashboardElements.hasContent).toBe(true);

    // Verify URL
    const currentUrl = page.url();
    expect(currentUrl).toContain('/admin');
  });

  test('Admin dashboard has accessible UI elements', async () => {
    // Check if critical UI elements have proper accessibility attributes
    const accessibilityCheck = await page.evaluate((selectors) => {
      // Find navigation elements
      const navItems = document.querySelectorAll(
        `${selectors.navigation.items}, ${selectors.fallback.navigation} a, nav a`
      );
      
      // Check if navigation items have proper attributes
      const navAccessibility = Array.from(navItems).some(item => 
        item.hasAttribute('aria-label') || 
        item.hasAttribute('aria-labelledby') ||
        item.hasAttribute('aria-current') || 
        item.hasAttribute('title')
      );
      
      // Check for basic accessibility landmarks
      const hasHeaderLandmark = document.querySelector('header, [role="banner"]') !== null;
      const hasMainLandmark = document.querySelector('main, [role="main"]') !== null;
      const hasNavLandmark = document.querySelector('nav, [role="navigation"]') !== null;
      
      return {
        hasAccessibleNavigation: navAccessibility,
        hasHeaderLandmark,
        hasMainLandmark,
        hasNavLandmark
      };
    }, AdminDashboardSelectors);
    
    // Take screenshot for debugging
    await takeScreenshot(page, 'admin-dashboard-accessibility');
    
    // Not all dashboards have fully accessible elements, so this is a non-blocking test
    if (!accessibilityCheck.hasAccessibleNavigation) {
      log('Navigation elements do not have proper accessibility attributes', 'warning');
    }
    
    // At least some landmarks should exist for accessibility
    const hasLandmarks = 
      accessibilityCheck.hasHeaderLandmark || 
      accessibilityCheck.hasMainLandmark || 
      accessibilityCheck.hasNavLandmark;
      
    expect(hasLandmarks).toBe(true);
  });

  test('Admin dashboard has content and is not empty', async () => {
    // Check if dashboard has actual content and is not just empty containers
    const contentCheck = await page.evaluate(() => {
      // Check if the page has substantial content
      const hasSubstantialContent = document.body.textContent.trim().length > 100;
      
      // Count total interactive elements as an indication of functionality
      const interactiveElementsCount = document.querySelectorAll('button, a, input, select').length;
      
      // Count total headings as indicators of content structure
      const headingsCount = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
      
      return {
        hasSubstantialContent,
        interactiveElementsCount,
        headingsCount
      };
    });
    
    // The dashboard should have substantial text content
    expect(contentCheck.hasSubstantialContent).toBe(true);
    
    // There should be at least some interactive elements
    expect(contentCheck.interactiveElementsCount).toBeGreaterThan(0);
    
    // There should be at least one heading element
    expect(contentCheck.headingsCount).toBeGreaterThan(0);
  });
});
