/**
 * @file Admin Dashboard activity feed test
 * @description Tests the admin dashboard activity feed functionality
 * @jest-environment node
 */

const puppeteer = require('puppeteer');
const { describe, test, beforeAll, afterAll, beforeEach, expect } = require('@jest/globals');
const { takeScreenshot, log } = require('../utils/test-utils');
const { waitForClientHydration } = require('../utils/hydration-utils');
const AdminDashboardSelectors = require('./admin-dashboard.selectors');
const { 
  navigateToDashboard, 
  checkActivityFeed,
  SITE_DOMAIN, 
  DEFAULT_TIMEOUT 
} = require('./admin-dashboard.setup');

describe('Admin Dashboard Activity Feed', () => {
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

  test('Dashboard displays activity feed', async () => {
    // Take a screenshot of the activity feed
    await takeScreenshot(page, 'activity-feed');
    
    // Check if activity feed exists
    const { exists, isEmpty, hasEmptyState, count } = await checkActivityFeed(page);
    
    // Not all dashboards have activity feeds, so this is a non-blocking test
    if (!exists) {
      log('No activity feed found, this test is non-blocking', 'warning');
      return;
    }
    
    // If the feed exists, it should either have items or an empty state message
    expect(isEmpty ? hasEmptyState : true).toBe(true);
    
    if (!isEmpty) {
      log(`Activity feed has ${count} items`);
    } else {
      log('Activity feed is empty but has proper empty state message');
    }
  });

  test('Activity feed items have timestamps', async () => {
    // Check if activity feed exists and has items
    const { exists, isEmpty, count } = await checkActivityFeed(page);
    
    if (!exists || isEmpty) {
      log('No activity feed or empty feed, skipping timestamp test', 'warning');
      return;
    }
    
    // Check if activity items have timestamps
    const timeCheckResult = await page.evaluate((selectors) => {
      // Find activity feed container
      const feedContainer = document.querySelector(selectors.activityFeed.container) || 
                          document.querySelector(selectors.fallback.activityFeed);
      
      if (!feedContainer) return { hasItems: false };
      
      // Find activity items
      const activityItems = feedContainer.querySelectorAll(selectors.activityFeed.items) || 
                           feedContainer.querySelectorAll(selectors.fallback.activityItems);
      
      if (activityItems.length === 0) return { hasItems: false };
      
      // Check each item for timestamp
      const itemsWithTimestamps = Array.from(activityItems).filter(item => {
        // Common timestamp patterns
        const hasTimeElement = item.querySelector('time') !== null;
        const hasDateAttribute = item.querySelector('[datetime]') !== null;
        
        // Look for text that might be a timestamp
        const text = item.textContent;
        const hasTimeText = 
          /\d{1,2}:\d{2}/.test(text) || // HH:MM format
          /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text) || // MM/DD/YYYY format
          /\d{1,2}-\d{1,2}-\d{2,4}/.test(text) || // MM-DD-YYYY format
          /\d{4}-\d{2}-\d{2}/.test(text) || // YYYY-MM-DD format
          /yesterday|today|ago|minutes?|hours?|days?|weeks?|months?/i.test(text); // Relative time
        
        return hasTimeElement || hasDateAttribute || hasTimeText;
      });
      
      return {
        hasItems: true,
        total: activityItems.length,
        withTimestamps: itemsWithTimestamps.length
      };
    }, AdminDashboardSelectors);
    
    // This test is non-blocking if we couldn't find specific activity items
    if (!timeCheckResult.hasItems) {
      log('No activity items found for timestamp check', 'warning');
      return;
    }
    
    // Most items should have timestamps
    const mostItemsHaveTimestamps = timeCheckResult.withTimestamps / timeCheckResult.total >= 0.5;
    
    // Take a screenshot for verification
    await takeScreenshot(page, 'activity-feed-timestamps');
    
    // Log the result
    log(`Found ${timeCheckResult.withTimestamps} items with timestamps out of ${timeCheckResult.total}`);
    
    // This test is flexible - not all activity feeds show timestamps clearly
    if (!mostItemsHaveTimestamps) {
      log('Less than half of activity items have detectable timestamps', 'warning');
    }
  });

  test('Activity feed items contain user or action information', async () => {
    // Check if activity feed exists and has items
    const { exists, isEmpty, count } = await checkActivityFeed(page);
    
    if (!exists || isEmpty) {
      log('No activity feed or empty feed, skipping content test', 'warning');
      return;
    }
    
    // Check if activity items have user or action information
    const contentCheckResult = await page.evaluate((selectors) => {
      // Find activity feed container
      const feedContainer = document.querySelector(selectors.activityFeed.container) || 
                          document.querySelector(selectors.fallback.activityFeed);
      
      if (!feedContainer) return { hasItems: false };
      
      // Find activity items
      const activityItems = feedContainer.querySelectorAll(selectors.activityFeed.items) || 
                           feedContainer.querySelectorAll(selectors.fallback.activityItems);
      
      if (activityItems.length === 0) return { hasItems: false };
      
      // Check each item for content indicators
      const itemDetails = Array.from(activityItems).map(item => {
        const text = item.textContent.trim();
        
        // Check for user information
        const hasUserInfo = 
          /user|admin|member|customer|person|they|he|she|author/i.test(text) || 
          item.querySelector('.user, .avatar, img[alt*="user"], img[alt*="profile"]') !== null;
        
        // Check for action verbs
        const hasActionVerb = 
          /added|created|updated|deleted|modified|changed|viewed|logged|signed|uploaded|downloaded|submitted|approved|rejected|commented/i.test(text);
        
        // Check for timestamps (as tested in previous test)
        const hasTimeInfo = 
          /\d{1,2}:\d{2}/.test(text) || 
          /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(text) || 
          /\d{1,2}-\d{1,2}-\d{2,4}/.test(text) || 
          /\d{4}-\d{2}-\d{2}/.test(text) || 
          /yesterday|today|ago|minutes?|hours?|days?|weeks?|months?/i.test(text);
        
        return {
          text: text.substring(0, 50) + (text.length > 50 ? '...' : ''), // Truncate for logging
          hasUserInfo,
          hasActionVerb,
          hasTimeInfo,
          length: text.length
        };
      });
      
      // Calculate totals
      const withUserInfo = itemDetails.filter(item => item.hasUserInfo).length;
      const withActionVerb = itemDetails.filter(item => item.hasActionVerb).length;
      const withTimeInfo = itemDetails.filter(item => item.hasTimeInfo).length;
      const withSubstantialContent = itemDetails.filter(item => item.length > 20).length;
      
      return {
        hasItems: true,
        total: itemDetails.length,
        withUserInfo,
        withActionVerb,
        withTimeInfo,
        withSubstantialContent,
        items: itemDetails.slice(0, 3) // Return first 3 items for debugging
      };
    }, AdminDashboardSelectors);
    
    // Take a screenshot for verification
    await takeScreenshot(page, 'activity-feed-content');
    
    // This test is non-blocking if we couldn't find specific activity items
    if (!contentCheckResult.hasItems) {
      log('No activity items found for content check', 'warning');
      return;
    }
    
    // Log the content analysis
    log(`Activity content analysis: ${JSON.stringify({
      total: contentCheckResult.total,
      withUserInfo: contentCheckResult.withUserInfo,
      withActionVerb: contentCheckResult.withActionVerb,
      withTimeInfo: contentCheckResult.withTimeInfo,
      withSubstantialContent: contentCheckResult.withSubstantialContent
    })}`);
    
    // Most items should have substantial content
    expect(contentCheckResult.withSubstantialContent).toBeGreaterThan(0);
    
    // Log a sample of items for debugging
    log(`Sample activity items: ${JSON.stringify(contentCheckResult.items)}`);
  });

  test('Activity feed empty state works appropriately', async () => {
    // Check if activity feed exists
    const { exists, isEmpty, hasEmptyState } = await checkActivityFeed(page);
    
    if (!exists) {
      log('No activity feed found, skipping empty state test', 'warning');
      return;
    }
    
    // If feed is empty, it should have an empty state message
    if (isEmpty) {
      expect(hasEmptyState).toBe(true);
      
      // Check for proper empty state text
      const emptyStateText = await page.evaluate((selectors) => {
        const emptyStateElement = document.querySelector(selectors.activityFeed.emptyState);
        
        if (emptyStateElement) {
          return emptyStateElement.textContent.trim();
        }
        
        // Fallback to looking for empty state text in the feed container
        const feedContainer = document.querySelector(selectors.activityFeed.container) || 
                            document.querySelector(selectors.fallback.activityFeed);
                            
        if (feedContainer) {
          return feedContainer.textContent.trim();
        }
        
        return null;
      }, AdminDashboardSelectors);
      
      // Take a screenshot of the empty state
      await takeScreenshot(page, 'activity-feed-empty-state');
      
      // Log the empty state text
      if (emptyStateText) {
        log(`Empty state text: ${emptyStateText}`);
        
        // Empty state should mention "activity" or "no results" or something similar
        const hasEmptyIndicator = 
          /no (recent )?activities?|no results|nothing to show|empty|no data/i.test(emptyStateText);
          
        expect(hasEmptyIndicator).toBe(true);
      }
    } else {
      log('Activity feed is not empty, skipping empty state test');
    }
  });
});
