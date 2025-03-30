/**
 * @file Admin Dashboard test setup
 * @description Setup utilities for admin dashboard E2E tests
 */

const puppeteer = require('puppeteer');
const { takeScreenshot, log, wait, BASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD } = require('../utils/test-utils');
const { waitForClientHydration, waitForHydration, isComponentHydrated } = require('../utils/hydration-utils');
const AdminDashboardSelectors = require('./admin-dashboard.selectors');

// Configuration
const SITE_DOMAIN = process.env.SITE_DOMAIN || 'mydirectory.com';
const DEFAULT_TIMEOUT = 30000;
const DASHBOARD_TIMEOUT = 15000;

/**
 * Navigate to the admin dashboard with proper authentication
 * 
 * @param {puppeteer.Page} page - Puppeteer page object
 * @param {Object} config - Configuration options
 * @returns {Promise<boolean>} - Whether navigation was successful
 */
async function navigateToDashboard(page, config = {}) {
  const options = {
    ensureAuthenticated: true,
    waitForHydration: true,
    takeScreenshot: true,
    ...config
  };

  try {
    log('Navigating to admin dashboard');
    
    // Navigate to the admin dashboard with hostname parameter
    await page.goto(`${BASE_URL}/admin?hostname=${SITE_DOMAIN}`, {
      waitUntil: 'networkidle2',
      timeout: DEFAULT_TIMEOUT
    });

    // Check if we need to authenticate
    if (options.ensureAuthenticated) {
      const isLoginPage = await page.evaluate(() => {
        return window.location.href.includes('/login') || 
               document.querySelector('form[action*="login"]') !== null;
      });

      if (isLoginPage) {
        log('Login required. Authenticating...');
        const success = await loginAsAdmin(page);
        
        if (!success) {
          log('Authentication failed', 'error');
          if (options.takeScreenshot) {
            await takeScreenshot(page, 'login-failure');
          }
          return false;
        }
        
        // Navigate to admin dashboard again after login
        await page.goto(`${BASE_URL}/admin?hostname=${SITE_DOMAIN}`, {
          waitUntil: 'networkidle2',
          timeout: DEFAULT_TIMEOUT
        });
      }
    }

    // Wait for page to hydrate if requested
    if (options.waitForHydration) {
      log('Waiting for dashboard hydration');
      await waitForClientHydration(page);
      
      // Look for the admin dashboard container specifically
      const dashboardContainer = AdminDashboardSelectors.dashboard.container;
      const fallbackContainer = AdminDashboardSelectors.fallback.dashboard;
      
      // Wait for either specific container or fallback
      const dashboardReady = await waitForHydration(
        page, 
        async () => {
          return page.evaluate(
            (selector, fallback) => {
              return document.querySelector(selector) !== null || 
                     document.querySelector(fallback) !== null;
            }, 
            dashboardContainer, 
            fallbackContainer
          );
        },
        { timeout: DASHBOARD_TIMEOUT, message: 'Waiting for dashboard container' }
      );
      
      if (!dashboardReady) {
        log('Dashboard container not found after timeout', 'warning');
        if (options.takeScreenshot) {
          await takeScreenshot(page, 'dashboard-hydration-failure');
        }
        return false;
      }
    }

    // Take a screenshot for verification if requested
    if (options.takeScreenshot) {
      await takeScreenshot(page, 'admin-dashboard-loaded');
    }

    return true;
  } catch (error) {
    log(`Dashboard navigation error: ${error.message}`, 'error');
    if (options.takeScreenshot) {
      await takeScreenshot(page, 'dashboard-navigation-error');
    }
    return false;
  }
}

/**
 * Login as admin user
 * 
 * @param {puppeteer.Page} page - Puppeteer page object
 * @returns {Promise<boolean>} - Whether login was successful
 */
async function loginAsAdmin(page) {
  try {
    log('Attempting to log in as admin');
    
    // Navigate to login page if not already there
    const currentUrl = page.url();
    if (!currentUrl.includes('/login')) {
      await page.goto(`${BASE_URL}/login?hostname=${SITE_DOMAIN}`, {
        waitUntil: 'networkidle2',
        timeout: DEFAULT_TIMEOUT
      });
    }
    
    // Wait for client hydration
    await waitForClientHydration(page);
    
    // Take a screenshot of the login page
    await takeScreenshot(page, 'login-page');
    
    // Find form elements with retry
    const usernameSelector = 'input[type="text"], input[id="username"], input[name="username"]';
    const passwordSelector = 'input[type="password"]';
    const submitSelector = 'button[type="submit"]';
    
    // Wait for form elements to be ready
    const formReady = await waitForHydration(
      page,
      async () => {
        return page.evaluate(
          (userSel, passSel, submitSel) => {
            const hasUsername = document.querySelector(userSel) !== null;
            const hasPassword = document.querySelector(passSel) !== null;
            const hasSubmit = document.querySelector(submitSel) !== null;
            return hasUsername && hasPassword && hasSubmit;
          },
          usernameSelector,
          passwordSelector,
          submitSelector
        );
      },
      { timeout: DEFAULT_TIMEOUT, message: 'Waiting for login form' }
    );
    
    if (!formReady) {
      log('Login form not ready after timeout', 'error');
      return false;
    }
    
    // Find form elements
    const usernameInput = await page.$(usernameSelector);
    const passwordInput = await page.$(passwordSelector);
    const submitButton = await page.$(submitSelector);
    
    if (!usernameInput || !passwordInput || !submitButton) {
      log('Login form elements not found', 'error');
      return false;
    }
    
    // Clear existing values first (in case of autofill)
    await usernameInput.click({ clickCount: 3 }); // Triple click to select all
    await usernameInput.press('Backspace');
    await passwordInput.click({ clickCount: 3 }); // Triple click to select all
    await passwordInput.press('Backspace');
    
    // Enter credentials
    await usernameInput.type(ADMIN_USERNAME);
    await passwordInput.type(ADMIN_PASSWORD);
    
    // Submit the form
    await submitButton.click();
    
    // Wait for navigation/login to complete using multiple strategies
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: DEFAULT_TIMEOUT }),
        page.waitForSelector(AdminDashboardSelectors.dashboard.container + ', ' + 
                            AdminDashboardSelectors.fallback.dashboard, 
                            { timeout: DEFAULT_TIMEOUT }),
        page.waitForFunction(
          () => window.location.href.includes('/admin') || 
                !document.querySelector('[data-testid="login-form"], form[action*="login"]'),
          { timeout: DEFAULT_TIMEOUT }
        )
      ]);
      
      log('Login successful');
      return true;
    } catch (error) {
      log(`Login navigation error: ${error.message}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Login error: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Check if the admin sidebar navigation works
 * 
 * @param {puppeteer.Page} page - Puppeteer page object
 * @returns {Promise<{success: boolean, links: Array}>} - Success status and found links
 */
async function checkSidebarNavigation(page) {
  try {
    log('Checking sidebar navigation');
    
    // Find navigation links in the sidebar
    const navigationLinks = await page.evaluate((selectors) => {
      // Try to find navigation using data-testid first
      const navContainer = document.querySelector(selectors.navigation.container) || 
                           document.querySelector(selectors.fallback.navigation);
      
      if (!navContainer) return [];
      
      // Get all links within the navigation
      const links = Array.from(navContainer.querySelectorAll('a'));
      
      return links.map(link => ({
        text: link.textContent.trim(),
        href: link.getAttribute('href'),
        testId: link.getAttribute('data-testid'),
        ariaLabel: link.getAttribute('aria-label')
      })).filter(link => link.href && link.href !== '#');
    }, AdminDashboardSelectors);
    
    log(`Found ${navigationLinks.length} navigation links`);
    
    // Return result
    return {
      success: navigationLinks.length > 0,
      links: navigationLinks
    };
  } catch (error) {
    log(`Navigation check error: ${error.message}`, 'error');
    return {
      success: false,
      links: []
    };
  }
}

/**
 * Check if statistics section exists and has content
 * 
 * @param {puppeteer.Page} page - Puppeteer page object 
 * @returns {Promise<{exists: boolean, count: number}>} - Whether stats exist and how many
 */
async function checkStatistics(page) {
  try {
    log('Checking statistics cards');
    
    // Check if statistics section exists and count cards
    const statsResult = await page.evaluate((selectors) => {
      // Look for statistics container using data-testid first
      const statsContainer = document.querySelector(selectors.statistics.container);
      let statCards = [];
      
      if (statsContainer) {
        // If container exists, look for cards within it
        statCards = Array.from(statsContainer.querySelectorAll(selectors.statistics.cards));
      } else {
        // Fallback to general selectors if container not found
        statCards = Array.from(document.querySelectorAll(selectors.fallback.statisticCards));
      }
      
      return {
        exists: statCards.length > 0,
        count: statCards.length
      };
    }, AdminDashboardSelectors);
    
    log(`Statistics section ${statsResult.exists ? 'found' : 'not found'} with ${statsResult.count} cards`);
    
    return statsResult;
  } catch (error) {
    log(`Statistics check error: ${error.message}`, 'error');
    return {
      exists: false,
      count: 0
    };
  }
}

/**
 * Check if activity feed exists and has content
 * 
 * @param {puppeteer.Page} page - Puppeteer page object
 * @returns {Promise<{exists: boolean, isEmpty: boolean, count: number}>} - Activity feed status
 */
async function checkActivityFeed(page) {
  try {
    log('Checking activity feed');
    
    // Check if activity feed exists and has items
    const feedResult = await page.evaluate((selectors) => {
      // Look for activity feed container using data-testid first
      const feedContainer = document.querySelector(selectors.activityFeed.container);
      let activityItems = [];
      let emptyStateElement = null;
      
      if (feedContainer) {
        // If container exists, look for items within it
        activityItems = Array.from(feedContainer.querySelectorAll(selectors.activityFeed.items));
        emptyStateElement = feedContainer.querySelector(selectors.activityFeed.emptyState);
      } else {
        // Fallback to general selectors if container not found
        const fallbackContainer = document.querySelector(selectors.fallback.activityFeed);
        
        if (fallbackContainer) {
          activityItems = Array.from(fallbackContainer.querySelectorAll(selectors.fallback.activityItems));
          
          // Check for empty state by looking for specific text in the container
          const hasEmptyText = fallbackContainer.textContent.includes('No recent activity') ||
                              fallbackContainer.textContent.includes('No activity found');
          
          if (hasEmptyText && activityItems.length === 0) {
            emptyStateElement = true; // Not an actual element but indicates empty state
          }
        }
      }
      
      return {
        exists: feedContainer !== null || document.querySelector(selectors.fallback.activityFeed) !== null,
        isEmpty: activityItems.length === 0,
        hasEmptyState: emptyStateElement !== null,
        count: activityItems.length
      };
    }, AdminDashboardSelectors);
    
    log(`Activity feed ${feedResult.exists ? 'found' : 'not found'}, ${feedResult.isEmpty ? 'is empty' : `has ${feedResult.count} items`}`);
    
    return {
      exists: feedResult.exists,
      isEmpty: feedResult.isEmpty,
      hasEmptyState: feedResult.hasEmptyState,
      count: feedResult.count
    };
  } catch (error) {
    log(`Activity feed check error: ${error.message}`, 'error');
    return {
      exists: false,
      isEmpty: true,
      hasEmptyState: false,
      count: 0
    };
  }
}

module.exports = {
  navigateToDashboard,
  loginAsAdmin,
  checkSidebarNavigation,
  checkStatistics,
  checkActivityFeed,
  SITE_DOMAIN,
  DEFAULT_TIMEOUT,
  DASHBOARD_TIMEOUT
};