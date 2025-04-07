const { test, expect } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

test.describe('Admin Dashboard Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/session', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: 'user-1',
            name: 'Test User',
            email: 'test@example.com',
          },
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
    });

    // Mock site data
    await page.route('**/api/admin/sites/current', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          site: {
            id: 'site-1',
            name: 'Test Site',
            slug: 'test-site',
            domain: 'test-site.com',
          },
        }),
      });
    });

    // Mock metrics data
    await page.route('**/api/admin/metrics**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalListings: 150,
          totalCategories: 12,
          totalUsers: 45,
          activeListings: 120,
          pendingListings: 30,
          listingsTrend: 15,
          usersTrend: 8,
          categoriesTrend: -2,
        }),
      });
    });

    // Mock activity feed data
    await page.route('**/api/admin/activity**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          activities: [
            {
              id: 'activity-1',
              userId: 'user-1',
              userName: 'John Doe',
              action: 'created',
              resourceType: 'listing',
              resourceId: 'listing-1',
              resourceName: 'Business Listing',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'activity-2',
              userId: 'user-2',
              userName: 'Jane Smith',
              action: 'updated',
              resourceType: 'category',
              resourceId: 'category-1',
              resourceName: 'Restaurants',
              timestamp: new Date(Date.now() - 7200000).toISOString(),
            },
          ],
        }),
      });
    });
  });

  test('Admin Dashboard - Default View', async ({ page }) => {
    // Navigate to the admin dashboard
    await page.goto('/admin/dashboard');
    
    // Wait for the dashboard to load
    await page.waitForSelector('[data-testid="metrics-overview"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'Admin Dashboard - Default View');
  });

  test('Admin Dashboard - Mobile View', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Navigate to the admin dashboard
    await page.goto('/admin/dashboard');
    
    // Wait for the dashboard to load
    await page.waitForSelector('[data-testid="metrics-overview"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'Admin Dashboard - Mobile View');
  });

  test('Admin Dashboard - Dark Mode', async ({ page }) => {
    // Navigate to the admin dashboard
    await page.goto('/admin/dashboard');
    
    // Wait for the dashboard to load
    await page.waitForSelector('[data-testid="metrics-overview"]');
    
    // Toggle dark mode
    await page.click('[data-testid="theme-toggle"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'Admin Dashboard - Dark Mode');
  });
});
