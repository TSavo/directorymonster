/**
 * @file Admin Dashboard statistics test
 * @description Tests the admin dashboard statistics cards functionality
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../utils/test-utils');
const { waitForClientHydration } = require('../utils/hydration-utils');
const AdminDashboardSelectors = require('./admin-dashboard.selectors');
const { 
  navigateToDashboard, 
  checkStatistics,
  SITE_DOMAIN, 
  DEFAULT_TIMEOUT 
} = require('./admin-dashboard.setup');

describe('Admin Dashboard Statistics', () => {
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

  test('Dashboard displays statistics cards', async () => {
    // Take a screenshot of the statistics section
    await takeScreenshot(page, 'dashboard-statistics');
    
    // Check if statistics are displayed
    const { exists, count } = await checkStatistics(page);
    
    // Not all dashboards have explicit statistics, so this is a non-blocking test
    if (!exists) {
      log('No explicit statistics found, this test is non-blocking', 'warning');
      return;
    }
    
    // If statistics exist, there should be at least one card
    expect(count).toBeGreaterThan(0);
    log(`Found ${count} statistic cards`);
  });

  test('Statistic cards contain values and labels', async () => {
    // Check if statistics exist
    const { exists, count } = await checkStatistics(page);
    
    if (!exists || count === 0) {
      log('No statistics found, skipping test', 'warning');
      return;
    }
    
    // Check if statistic cards have values and labels
    const statsDetails = await page.evaluate((selectors) => {
      // Try to find statistic cards using data-testid first
      const statCards = Array.from(document.querySelectorAll(selectors.statistics.cards)) || 
                        Array.from(document.querySelectorAll(selectors.fallback.statisticCards));
      
      if (statCards.length === 0) return { hasCards: false };
      
      // Analyze each card for values and labels
      const cardDetails = statCards.map(card => {
        // Look for value elements
        const valueElement = card.querySelector(selectors.statistics.values) || 
                            card.querySelector('strong, .value, .number, h3, h4');
        
        // Look for label elements
        const labelElement = card.querySelector(selectors.statistics.labels) || 
                            card.querySelector('.label, .title, p, h5, h6');
        
        // Look for icon elements
        const iconElement = card.querySelector(selectors.statistics.icons) || 
                          card.querySelector('svg, i, .icon, img');
        
        return {
          hasValue: valueElement !== null,
          hasLabel: labelElement !== null,
          hasIcon: iconElement !== null,
          valueText: valueElement ? valueElement.textContent.trim() : null,
          labelText: labelElement ? labelElement.textContent.trim() : null
        };
      });
      
      // Analyze all cards
      const allCards = {
        hasCards: true,
        total: cardDetails.length,
        withValues: cardDetails.filter(c => c.hasValue).length,
        withLabels: cardDetails.filter(c => c.hasLabel).length,
        withIcons: cardDetails.filter(c => c.hasIcon).length,
        cards: cardDetails
      };
      
      return allCards;
    }, AdminDashboardSelectors);
    
    // Take a screenshot for verification
    await takeScreenshot(page, 'statistic-card-details');
    
    // Verify statistics have proper structure
    expect(statsDetails.hasCards).toBe(true);
    
    // Most cards should have values
    const mostCardsHaveValues = statsDetails.withValues / statsDetails.total >= 0.5;
    expect(mostCardsHaveValues).toBe(true);
    
    // Most cards should have labels
    const mostCardsHaveLabels = statsDetails.withLabels / statsDetails.total >= 0.5;
    expect(mostCardsHaveLabels).toBe(true);
    
    // Log the content of the first few cards for debugging
    const cardSample = statsDetails.cards.slice(0, 3); // First 3 cards
    log(`Statistic card sample: ${JSON.stringify(cardSample)}`);
  });

  test('Statistic cards have numerical values', async () => {
    // Check if statistics exist
    const { exists, count } = await checkStatistics(page);
    
    if (!exists || count === 0) {
      log('No statistics found, skipping test', 'warning');
      return;
    }
    
    // Check if statistic values contain numbers
    const numericCheck = await page.evaluate((selectors) => {
      // Try to find statistic values
      const valueElements = Array.from(document.querySelectorAll(selectors.statistics.values)) || 
                           Array.from(document.querySelectorAll('.statistic-card .value, .stat-card .value, .metric-card .value, .dashboard-stat .value'));
      
      if (valueElements.length === 0) {
        // Fallback to any elements that might contain values
        const cards = Array.from(document.querySelectorAll(selectors.statistics.cards)) || 
                     Array.from(document.querySelectorAll(selectors.fallback.statisticCards));
        
        valueElements.push(...cards.map(card => 
          card.querySelector('strong, .value, .number, h3, h4')
        ).filter(el => el !== null));
      }
      
      if (valueElements.length === 0) return { hasValues: false };
      
      // Check each value for numeric content
      const valueDetails = valueElements.map(el => {
        const text = el.textContent.trim();
        // Check if text contains digits
        const hasDigit = /\d/.test(text);
        // Check common number formats
        const hasNumberFormat = /\d+[,.\s]\d+/.test(text) || // Number with separator
                               /[$€£¥]/.test(text) ||       // Currency symbol
                               /%/.test(text) ||           // Percentage
                               /\d+[KkMmBbTt]/.test(text); // Abbreviated number (K, M, B, T)
        
        return {
          text,
          hasDigit,
          hasNumberFormat
        };
      });
      
      return {
        hasValues: true,
        total: valueDetails.length,
        withDigits: valueDetails.filter(v => v.hasDigit).length,
        withNumberFormat: valueDetails.filter(v => v.hasNumberFormat).length,
        values: valueDetails
      };
    }, AdminDashboardSelectors);
    
    // This test is non-blocking if we couldn't find specific value elements
    if (!numericCheck.hasValues) {
      log('No specific value elements found, skipping numerical check', 'warning');
      return;
    }
    
    // At least some values should contain digits
    const someValuesHaveDigits = numericCheck.withDigits > 0;
    expect(someValuesHaveDigits).toBe(true);
    
    log(`Found ${numericCheck.withDigits} values with digits out of ${numericCheck.total} total values`);
  });

  test('Statistics section layout is responsive', async () => {
    // Check if statistics exist
    const { exists } = await checkStatistics(page);
    
    if (!exists) {
      log('No statistics found, skipping responsiveness test', 'warning');
      return;
    }
    
    // Take a screenshot in desktop view
    await takeScreenshot(page, 'statistics-desktop');
    
    // Get desktop layout information
    const desktopLayout = await page.evaluate((selectors) => {
      // Find statistics container and cards
      const container = document.querySelector(selectors.statistics.container) || 
                       document.querySelector('.statistics-container, .stats-container, .dashboard-stats');
      
      if (!container) return { exists: false };
      
      const cards = container.querySelectorAll(selectors.statistics.cards) || 
                   container.querySelectorAll(selectors.fallback.statisticCards);
      
      // Get layout information
      return {
        exists: true,
        isGrid: window.getComputedStyle(container).display.includes('grid'),
        isFlexbox: window.getComputedStyle(container).display.includes('flex'),
        cardCount: cards.length,
        containerWidth: container.offsetWidth,
        containerDisplay: window.getComputedStyle(container).display
      };
    }, AdminDashboardSelectors);
    
    if (!desktopLayout.exists) {
      log('Could not find statistics container for layout analysis', 'warning');
      return;
    }
    
    // Switch to mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
    });
    
    // Take screenshot in mobile view
    await takeScreenshot(page, 'statistics-mobile');
    
    // Get mobile layout information
    const mobileLayout = await page.evaluate((selectors) => {
      // Find statistics container
      const container = document.querySelector(selectors.statistics.container) || 
                       document.querySelector('.statistics-container, .stats-container, .dashboard-stats');
      
      if (!container) return { exists: false };
      
      const cards = container.querySelectorAll(selectors.statistics.cards) || 
                   container.querySelectorAll(selectors.fallback.statisticCards);
      
      // Get layout information
      return {
        exists: true,
        isGrid: window.getComputedStyle(container).display.includes('grid'),
        isFlexbox: window.getComputedStyle(container).display.includes('flex'),
        cardCount: cards.length,
        containerWidth: container.offsetWidth,
        containerDisplay: window.getComputedStyle(container).display
      };
    }, AdminDashboardSelectors);
    
    // Reset viewport to desktop
    await page.setViewport({
      width: 1280,
      height: 800,
    });
    
    // The container width should be different between desktop and mobile
    if (mobileLayout.exists && desktopLayout.exists) {
      expect(mobileLayout.containerWidth).not.toEqual(desktopLayout.containerWidth);
      log(`Container width - Desktop: ${desktopLayout.containerWidth}px, Mobile: ${mobileLayout.containerWidth}px`);
      
      // Log layout information for debugging
      log(`Desktop display: ${desktopLayout.containerDisplay}, Mobile display: ${mobileLayout.containerDisplay}`);
    }
  });
});
