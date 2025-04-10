const { test, expect } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

test.describe('User Management Visual Regression Tests', () => {
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

    // Mock users data
    await page.route('**/api/admin/users', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          users: [
            {
              id: 'user-1',
              name: 'John Doe',
              email: 'john@example.com',
              siteIds: ['site-1', 'site-2'],
              createdAt: '2023-01-01T00:00:00.000Z',
            },
            {
              id: 'user-2',
              name: 'Jane Smith',
              email: 'jane@example.com',
              siteIds: ['site-1'],
              createdAt: '2023-01-02T00:00:00.000Z',
            },
          ],
        }),
      });
    });

    // Mock sites data
    await page.route('**/api/admin/sites', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          sites: [
            { id: 'site-1', name: 'Site 1' },
            { id: 'site-2', name: 'Site 2' },
          ],
        }),
      });
    });

    // Mock user roles data
    await page.route('**/api/admin/users/*/roles', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roles: [
            { id: 'role-1', name: 'Admin', description: 'Administrator role', scope: 'tenant' },
          ],
        }),
      });
    });
  });

  test('User Management - User List', async ({ page }) => {
    // Navigate to the user management page
    await page.goto('/admin/users');
    
    // Wait for the user table to load
    await page.waitForSelector('[data-testid="user-table"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'User Management - User List');
  });

  test('User Management - Add User Modal', async ({ page }) => {
    // Navigate to the user management page
    await page.goto('/admin/users');
    
    // Wait for the user table to load
    await page.waitForSelector('[data-testid="user-table"]');
    
    // Click the Add User button
    await page.click('[data-testid="add-user-button"]');
    
    // Wait for the modal to appear
    await page.waitForSelector('[data-testid="user-form-modal"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'User Management - Add User Modal');
  });

  test('User Management - Edit User Modal', async ({ page }) => {
    // Navigate to the user management page
    await page.goto('/admin/users');
    
    // Wait for the user table to load
    await page.waitForSelector('[data-testid="user-table"]');
    
    // Click the Edit button for the first user
    await page.click('[data-testid="edit-user-user-1"]');
    
    // Wait for the modal to appear
    await page.waitForSelector('[data-testid="user-form-modal"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'User Management - Edit User Modal');
  });

  test('User Management - User Roles', async ({ page }) => {
    // Navigate to the user roles page
    await page.goto('/admin/users/user-1/roles');
    
    // Wait for the user roles manager to load
    await page.waitForSelector('[data-testid="user-role-manager"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'User Management - User Roles');
  });

  test('User Management - Mobile View', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Navigate to the user management page
    await page.goto('/admin/users');
    
    // Wait for the user table to load
    await page.waitForSelector('[data-testid="user-table"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'User Management - Mobile View');
  });
});
