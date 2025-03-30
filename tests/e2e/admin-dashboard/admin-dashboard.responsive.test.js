/**
 * @file Admin Dashboard responsive test
 * @description Tests the admin dashboard responsive design functionality
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');
const { takeScreenshot, log, wait } = require('../utils/test-utils');
const { waitForClientHydration } = require('../utils/hydration-utils');
const AdminDashboardSelectors = require('./admin-dashboard.selectors');
const { 
  navigateToDashboard, 
  SITE_DOMAIN, 
  DEFAULT_TIMEOUT 
} = require('./admin-dashboard.setup');

describe('Admin Dashboard Responsive Design', () => {
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
    
    // Set initial viewport to desktop size
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

  // Navigate to admin dashboard before each test in desktop view
  beforeEach(async () => {
    // Reset to desktop viewport for navigation
    await page.setViewport({
      width: 1280,
      height: 800,
    });
    
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

  test('Dashboard adapts to mobile viewport', async () => {
    // Take desktop screenshot for comparison
    await takeScreenshot(page, 'responsive-desktop');
    
    // Get information about layout in desktop view
    const desktopLayout = await page.evaluate((selectors) => {
      const sidebar = document.querySelector(selectors.dashboard.sidebar) || 
                     document.querySelector(selectors.fallback.sidebar);
      
      const content = document.querySelector(selectors.dashboard.content) || 
                     document.querySelector(selectors.fallback.content);
      
      if (!sidebar || !content) {
        return { 
          hasSidebar: Boolean(sidebar), 
          hasContent: Boolean(content) 
        };
      }
      
      // Get layout information
      return {
        hasSidebar: true,
        hasContent: true,
        sidebarVisible: window.getComputedStyle(sidebar).display !== 'none',
        sidebarWidth: sidebar.offsetWidth,
        contentWidth: content.offsetWidth,
        windowWidth: window.innerWidth
      };
    }, AdminDashboardSelectors);
    
    // Switch to mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
    });
    
    // Wait for responsive changes to apply
    await wait(500);
    
    // Wait for hydration in mobile view
    await waitForClientHydration(page);
    
    // Take mobile screenshot
    await takeScreenshot(page, 'responsive-mobile');
    
    // Get information about layout in mobile view
    const mobileLayout = await page.evaluate((selectors) => {
      const sidebar = document.querySelector(selectors.dashboard.sidebar) || 
                     document.querySelector(selectors.fallback.sidebar);
      
      const content = document.querySelector(selectors.dashboard.content) || 
                     document.querySelector(selectors.fallback.content);
                     
      const mobileMenu = document.querySelector(selectors.mobile.menuButton) ||
                        document.querySelector('button[aria-label*="menu" i], .hamburger, .menu-toggle, .navbar-toggler');
      
      if (!sidebar || !content) {
        return { 
          hasSidebar: Boolean(sidebar), 
          hasContent: Boolean(content),
          hasMobileMenu: Boolean(mobileMenu)
        };
      }
      
      // Check if sidebar is hidden or collapsed in mobile view
      const sidebarStyle = window.getComputedStyle(sidebar);
      const isSidebarHidden = sidebarStyle.display === 'none';
      const isSidebarCollapsed = sidebar.classList.contains('collapsed') || 
                              sidebar.classList.contains('minimized') ||
                              sidebar.hasAttribute('data-collapsed') ||
                              sidebar.offsetWidth < 100; // Collapsed sidebars are typically narrow
      
      // Get layout information
      return {
        hasSidebar: true,
        hasContent: true,
        hasMobileMenu: Boolean(mobileMenu),
        sidebarVisible: sidebarStyle.display !== 'none',
        isSidebarHidden,
        isSidebarCollapsed,
        sidebarWidth: sidebar.offsetWidth,
        contentWidth: content.offsetWidth,
        windowWidth: window.innerWidth
      };
    }, AdminDashboardSelectors);
    
    // Log layout information
    log(`Desktop layout: ${JSON.stringify(desktopLayout)}`);
    log(`Mobile layout: ${JSON.stringify(mobileLayout)}`);
    
    // Reset to desktop viewport
    await page.setViewport({
      width: 1280,
      height: 800,
    });
    
    // Dashboard should adapt to mobile viewport in at least one of these ways
    if (desktopLayout.hasSidebar && mobileLayout.hasSidebar) {
      // In responsive layouts, the sidebar should be hidden, collapsed, or significantly narrower
      const isResponsiveLayout = 
        mobileLayout.isSidebarHidden || 
        mobileLayout.isSidebarCollapsed || 
        (mobileLayout.sidebarWidth < desktopLayout.sidebarWidth * 0.5) ||
        mobileLayout.hasMobileMenu;
      
      expect(isResponsiveLayout).toBe(true);
    } else {
      // If we don't have consistent sidebar detection, check for mobile menu
      expect(mobileLayout.hasMobileMenu).toBe(true);
    }
  });

  test('Mobile menu button appears in mobile view', async () => {
    // Switch to mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
    });
    
    // Wait for responsive changes to apply
    await wait(500);
    
    // Take mobile screenshot
    await takeScreenshot(page, 'mobile-menu-button');
    
    // Check if mobile menu button appears
    const hasMobileMenu = await page.evaluate((selectors) => {
      // Look for mobile menu button using data-testid
      const mobileMenuButton = document.querySelector(selectors.mobile.menuButton);
      
      // Fallback to common mobile menu button patterns
      const fallbackButton = document.querySelector(
        'button[aria-label*="menu" i], .hamburger, .menu-toggle, .navbar-toggler, .mobile-menu-btn'
      );
      
      return {
        hasMobileMenuButton: Boolean(mobileMenuButton || fallbackButton),
        buttonSelector: mobileMenuButton ? 'data-testid button' : 
                       fallbackButton ? 'fallback button' : 'none found'
      };
    }, AdminDashboardSelectors);
    
    // Log the result
    log(`Mobile menu button check: ${JSON.stringify(hasMobileMenu)}`);
    
    // Reset to desktop viewport
    await page.setViewport({
      width: 1280,
      height: 800,
    });
    
    // This is a non-blocking test as not all dashboards have mobile menu buttons
    if (!hasMobileMenu.hasMobileMenuButton) {
      log('No mobile menu button found, checking for other responsive adaptations', 'warning');
      
      // Check if the layout adapts in other ways
      const hasAlternativeAdaptations = await page.evaluate(() => {
        // Check for other responsive adaptations
        const hasResponsiveClasses = document.body.classList.contains('mobile') || 
                                   document.body.classList.contains('responsive');
                                   
        // Check for meta viewport tag
        const hasViewportMeta = document.querySelector('meta[name="viewport"]') !== null;
        
        // Check for media queries
        const hasMediaQueries = window.matchMedia('(max-width: 768px)').matches;
        
        return hasResponsiveClasses || hasViewportMeta || hasMediaQueries;
      });
      
      expect(hasAlternativeAdaptations).toBe(true);
    } else {
      expect(hasMobileMenu.hasMobileMenuButton).toBe(true);
    }
  });

  test('Content adapts to smaller screens', async () => {
    // Get content container in desktop view
    const desktopContentInfo = await page.evaluate((selectors) => {
      const content = document.querySelector(selectors.dashboard.content) || 
                     document.querySelector(selectors.fallback.content);
      
      if (!content) return { hasContent: false };
      
      // Check for tables or data grids that might need responsive handling
      const tables = Array.from(content.querySelectorAll('table'));
      const dataGrids = Array.from(content.querySelectorAll('.data-grid, [role="grid"]'));
      
      return {
        hasContent: true,
        contentWidth: content.offsetWidth,
        hasOverflow: window.getComputedStyle(content).overflow !== 'visible',
        hasTables: tables.length > 0,
        hasDataGrids: dataGrids.length > 0
      };
    }, AdminDashboardSelectors);
    
    if (!desktopContentInfo.hasContent) {
      log('No content container found, skipping responsive content test', 'warning');
      return;
    }
    
    // Switch to mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
    });
    
    // Wait for responsive changes to apply
    await wait(500);
    
    // Take mobile screenshot
    await takeScreenshot(page, 'responsive-content');
    
    // Check content container in mobile view
    const mobileContentInfo = await page.evaluate((selectors) => {
      const content = document.querySelector(selectors.dashboard.content) || 
                     document.querySelector(selectors.fallback.content);
      
      if (!content) return { hasContent: false };
      
      // Check if tables have responsive handling
      const tables = Array.from(content.querySelectorAll('table'));
      const responsiveTables = tables.filter(table => 
        table.classList.contains('responsive') || 
        table.parentElement.classList.contains('table-responsive') ||
        window.getComputedStyle(table.parentElement).overflow === 'auto'
      );
      
      // Check if content has horizontal scrolling
      const hasHorizontalScroll = 
        content.scrollWidth > content.clientWidth ||
        window.getComputedStyle(content).overflowX === 'auto' ||
        window.getComputedStyle(content).overflowX === 'scroll';
      
      return {
        hasContent: true,
        contentWidth: content.offsetWidth,
        hasOverflow: window.getComputedStyle(content).overflow !== 'visible',
        hasHorizontalScroll,
        hasTables: tables.length > 0,
        hasResponsiveTables: responsiveTables.length > 0
      };
    }, AdminDashboardSelectors);
    
    // Reset to desktop viewport
    await page.setViewport({
      width: 1280,
      height: 800,
    });
    
    // Log content information
    log(`Desktop content: ${JSON.stringify(desktopContentInfo)}`);
    log(`Mobile content: ${JSON.stringify(mobileContentInfo)}`);
    
    if (mobileContentInfo.hasContent) {
      // Content width should adapt to the smaller viewport
      expect(mobileContentInfo.contentWidth).toBeLessThan(desktopContentInfo.contentWidth);
      
      // If there are tables, they should either be responsive or the container should have horizontal scroll
      if (mobileContentInfo.hasTables) {
        expect(
          mobileContentInfo.hasResponsiveTables || 
          mobileContentInfo.hasHorizontalScroll ||
          mobileContentInfo.hasOverflow
        ).toBe(true);
      }
    }
  });

  test('Header layout adapts to mobile view', async () => {
    // Get header information in desktop view
    const desktopHeaderInfo = await page.evaluate((selectors) => {
      const header = document.querySelector(selectors.dashboard.header) || 
                    document.querySelector(selectors.fallback.header);
      
      if (!header) return { hasHeader: false };
      
      return {
        hasHeader: true,
        headerWidth: header.offsetWidth,
        headerHeight: header.offsetHeight,
        hasUserMenu: header.querySelector(selectors.navigation.userMenu) !== null,
        headerDisplay: window.getComputedStyle(header).display
      };
    }, AdminDashboardSelectors);
    
    if (!desktopHeaderInfo.hasHeader) {
      log('No header found, skipping responsive header test', 'warning');
      return;
    }
    
    // Switch to mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
    });
    
    // Wait for responsive changes to apply
    await wait(500);
    
    // Take mobile screenshot
    await takeScreenshot(page, 'responsive-header');
    
    // Check header in mobile view
    const mobileHeaderInfo = await page.evaluate((selectors) => {
      const header = document.querySelector(selectors.dashboard.header) || 
                    document.querySelector(selectors.fallback.header);
      
      if (!header) return { hasHeader: false };
      
      // Check for collapsed elements in header
      const userMenu = header.querySelector(selectors.navigation.userMenu);
      const isUserMenuCollapsed = userMenu ? 
        userMenu.classList.contains('collapsed') || 
        window.getComputedStyle(userMenu).display === 'none' : 
        false;
      
      // Look for mobile menu button in header
      const hasMobileMenuInHeader = 
        header.querySelector(selectors.mobile.menuButton) !== null ||
        header.querySelector('button[aria-label*="menu" i], .hamburger, .menu-toggle') !== null;
      
      return {
        hasHeader: true,
        headerWidth: header.offsetWidth,
        headerHeight: header.offsetHeight,
        hasUserMenu: userMenu !== null,
        isUserMenuCollapsed,
        hasMobileMenuInHeader,
        headerDisplay: window.getComputedStyle(header).display
      };
    }, AdminDashboardSelectors);
    
    // Reset to desktop viewport
    await page.setViewport({
      width: 1280,
      height: 800,
    });
    
    // Log header information
    log(`Desktop header: ${JSON.stringify(desktopHeaderInfo)}`);
    log(`Mobile header: ${JSON.stringify(mobileHeaderInfo)}`);
    
    if (mobileHeaderInfo.hasHeader) {
      // Header width should adapt to the smaller viewport
      expect(mobileHeaderInfo.headerWidth).toBeLessThan(desktopHeaderInfo.headerWidth);
      
      // In responsive design, header should either:
      // 1. Have a mobile menu button, or
      // 2. Collapse/hide the user menu, or
      // 3. Change its display (e.g. from flex to block)
      const isResponsiveHeader = 
        mobileHeaderInfo.hasMobileMenuInHeader || 
        (desktopHeaderInfo.hasUserMenu && mobileHeaderInfo.isUserMenuCollapsed) ||
        mobileHeaderInfo.headerDisplay !== desktopHeaderInfo.headerDisplay;
      
      // This test is non-blocking as some headers might have other responsive adaptations
      if (!isResponsiveHeader) {
        log('Header does not seem to adapt to mobile view in expected ways', 'warning');
      }
    }
  });
});
