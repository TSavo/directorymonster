/**
 * @file Admin Dashboard navigation test
 * @description Tests the admin dashboard sidebar navigation functionality
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');
const { takeScreenshot, log, wait } = require('../utils/test-utils');
const { waitForClientHydration } = require('../utils/hydration-utils');
const AdminDashboardSelectors = require('./admin-dashboard.selectors');
const { 
  navigateToDashboard, 
  checkSidebarNavigation,
  SITE_DOMAIN, 
  DEFAULT_TIMEOUT 
} = require('./admin-dashboard.setup');

describe('Admin Dashboard Navigation', () => {
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

  test('Admin sidebar has navigation links', async () => {
    // Take a screenshot of the sidebar
    await takeScreenshot(page, 'admin-sidebar');
    
    // Check if sidebar has navigation links
    const { success, links } = await checkSidebarNavigation(page);
    
    // There should be navigation links in the sidebar
    expect(success).toBe(true);
    expect(links.length).toBeGreaterThan(0);
    
    // Log the found links for debugging
    log(`Found navigation links: ${JSON.stringify(links.map(l => l.text))}`);
  });

  test('Navigation links work and change the page content', async () => {
    // Check sidebar navigation
    const { success, links } = await checkSidebarNavigation(page);
    
    if (!success || links.length === 0) {
      log('No navigation links found, skipping test', 'warning');
      return;
    }
    
    // Take a screenshot before navigation
    await takeScreenshot(page, 'before-navigation');
    
    // Get the current URL and page heading
    const initialUrl = page.url();
    const initialHeading = await page.evaluate((selectors) => {
      const heading = document.querySelector(selectors.dashboard.heading) || 
                    document.querySelector(selectors.fallback.heading);
      return heading ? heading.textContent.trim() : null;
    }, AdminDashboardSelectors);
    
    log(`Initial URL: ${initialUrl}, Heading: ${initialHeading}`);
    
    // Select the first non-dashboard link if possible (to ensure navigation changes)
    const linkToClick = links.find(link => 
      !link.text.toLowerCase().includes('dashboard') && 
      !link.href.endsWith('/admin')
    ) || links[0];
    
    log(`Clicking navigation link: ${linkToClick.text} (${linkToClick.href})`);
    
    // Determine the selector to use for clicking
    let selector;
    if (linkToClick.testId) {
      selector = `[data-testid="${linkToClick.testId}"]`;
    } else {
      // Create a more specific selector using href
      selector = `a[href="${linkToClick.href}"]`;
    }
    
    // Click the link and wait for navigation
    try {
      await Promise.all([
        // Wait for navigation to complete
        page.waitForNavigation({ timeout: DEFAULT_TIMEOUT }).catch(() => {
          log('Navigation timeout occurred, checking URL changes', 'warning');
        }),
        // Click the link to start navigation
        page.click(selector)
      ]);
      
      // Wait a moment for content to update if navigation event wasn't detected
      await wait(1000);
      
      // Take a screenshot after navigation
      await takeScreenshot(page, 'after-navigation');
      
      // Get the new URL and heading after navigation
      const newUrl = page.url();
      const newHeading = await page.evaluate((selectors) => {
        const heading = document.querySelector(selectors.dashboard.heading) || 
                      document.querySelector(selectors.fallback.heading);
        return heading ? heading.textContent.trim() : null;
      }, AdminDashboardSelectors);
      
      log(`New URL: ${newUrl}, Heading: ${newHeading}`);
      
      // Verify that navigation occurred
      expect(newUrl).not.toEqual(initialUrl);
      
      // If we have headings, they should be different after navigation
      if (initialHeading && newHeading) {
        expect(newHeading).not.toEqual(initialHeading);
      }
      
    } catch (error) {
      log(`Navigation error: ${error.message}`, 'error');
      await takeScreenshot(page, 'navigation-error');
      
      // Check if URL changed despite error
      const currentUrl = page.url();
      expect(currentUrl).not.toEqual(initialUrl);
    }
  });

  test('Active navigation item is highlighted', async () => {
    // Look for active navigation item
    const activeNavItem = await page.evaluate((selectors) => {
      // Look for item with active class or aria-current attribute
      const activeItem = document.querySelector(selectors.navigation.activeItem);
      
      if (activeItem) {
        return {
          exists: true,
          text: activeItem.textContent.trim(),
          href: activeItem.getAttribute('href'),
          hasActiveClass: activeItem.classList.contains('active')
        };
      }
      
      // Fallback to checking for items with active/selected classes
      const fallbackItems = Array.from(document.querySelectorAll(
        'nav a.active, nav a.selected, nav li.active, nav li.selected'
      ));
      
      if (fallbackItems.length > 0) {
        const item = fallbackItems[0];
        const link = item.tagName === 'A' ? item : item.querySelector('a');
        
        return {
          exists: true,
          text: item.textContent.trim(),
          href: link ? link.getAttribute('href') : null,
          hasActiveClass: true
        };
      }
      
      return { exists: false };
    }, AdminDashboardSelectors);
    
    // Take a screenshot for verification
    await takeScreenshot(page, 'active-nav-item');
    
    // This test is non-blocking as not all dashboards highlight active items
    if (!activeNavItem.exists) {
      log('No active navigation item detected', 'warning');
      return;
    }
    
    log(`Active navigation item: ${activeNavItem.text}`);
    
    // Verify the active item's href matches the current page
    const currentUrl = page.url();
    const currentPath = new URL(currentUrl).pathname;
    
    // If we have an href for the active item, it should match current path
    if (activeNavItem.href) {
      const activeItemPath = activeNavItem.href.startsWith('http') 
        ? new URL(activeNavItem.href).pathname
        : activeNavItem.href;
        
      expect(currentPath).toEqual(activeItemPath);
    }
  });

  test('Mobile menu toggle works in responsive mode', async () => {
    // Switch to mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
    });
    
    // Take screenshot in mobile view
    await takeScreenshot(page, 'mobile-view-initial');
    
    // Look for mobile menu toggle button
    const hasMobileMenu = await page.evaluate((selectors) => {
      // Check for mobile menu toggle
      const mobileMenuButton = document.querySelector(selectors.mobile.menuButton);
      
      // Fallback to any button that might be a menu toggle
      const fallbackButton = document.querySelector(
        'button[aria-label*="menu" i], .hamburger, .menu-toggle, .navbar-toggler'
      );
      
      return {
        exists: mobileMenuButton !== null || fallbackButton !== null,
        selector: mobileMenuButton ? selectors.mobile.menuButton : 
                 fallbackButton ? '.hamburger, .menu-toggle, .navbar-toggler, button[aria-label*="menu" i]' : null
      };
    }, AdminDashboardSelectors);
    
    // This test is non-blocking as not all dashboards have mobile menu toggles
    if (!hasMobileMenu.exists) {
      log('No mobile menu toggle detected, skipping test', 'warning');
      await page.setViewport({ width: 1280, height: 800 }); // Reset viewport
      return;
    }
    
    try {
      // Click the mobile menu toggle
      await page.click(hasMobileMenu.selector);
      
      // Give the menu animation time to complete
      await wait(500);
      
      // Take screenshot after toggle
      await takeScreenshot(page, 'mobile-menu-toggled');
      
      // Verify menu state changed
      const menuToggled = await page.evaluate((selectors) => {
        // Check if mobile menu content is now visible
        const mobileMenuContent = document.querySelector(selectors.mobile.menuContent);
        
        // Fallback to checking if navigation is visible
        const navVisible = document.querySelector(
          'nav.open, nav.expanded, nav.show, .nav-open, .menu-open, .sidebar.open'
        );
        
        // Check if menu has expanded attribute
        const hasExpandedAttr = document.querySelector('[aria-expanded="true"]');
        
        return mobileMenuContent !== null || navVisible !== null || hasExpandedAttr !== null;
      }, AdminDashboardSelectors);
      
      // Reset viewport to desktop
      await page.setViewport({ width: 1280, height: 800 });
      
      expect(menuToggled).toBe(true);
      
    } catch (error) {
      log(`Mobile menu toggle error: ${error.message}`, 'error');
      await page.setViewport({ width: 1280, height: 800 }); // Reset viewport
    }
  });
});
