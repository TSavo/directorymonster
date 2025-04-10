const { test, expect } = require('@playwright/test');
const percySnapshot = require('@percy/playwright');

test.describe('Role Management Visual Regression Tests', () => {
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

    // Mock roles data
    await page.route('**/api/admin/roles', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          roles: [
            {
              id: 'role-1',
              name: 'Admin',
              description: 'Administrator role',
              scope: 'tenant',
              type: 'SYSTEM',
              userCount: 5,
              createdAt: '2023-01-01T00:00:00.000Z',
            },
            {
              id: 'role-2',
              name: 'Editor',
              description: 'Editor role',
              scope: 'tenant',
              type: 'CUSTOM',
              userCount: 10,
              createdAt: '2023-01-02T00:00:00.000Z',
            },
            {
              id: 'role-3',
              name: 'Global Admin',
              description: 'Global administrator role',
              scope: 'global',
              type: 'SYSTEM',
              userCount: 2,
              createdAt: '2023-01-03T00:00:00.000Z',
            },
          ],
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 3,
            itemsPerPage: 10,
          },
        }),
      });
    });

    // Mock single role data
    await page.route('**/api/admin/roles/*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          role: {
            id: 'role-1',
            name: 'Admin',
            description: 'Administrator role',
            scope: 'tenant',
            type: 'SYSTEM',
            userCount: 5,
            permissions: {
              'listing-read': true,
              'listing-create': true,
              'listing-update': true,
              'listing-delete': true,
              'category-read': true,
              'category-create': true,
              'user-read': true,
            },
            createdAt: '2023-01-01T00:00:00.000Z',
            updatedAt: '2023-01-01T00:00:00.000Z',
          },
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
  });

  test('Role Management - Role List', async ({ page }) => {
    // Navigate to the role management page
    await page.goto('/admin/roles');
    
    // Wait for the role table to load
    await page.waitForSelector('[data-testid="roles-table"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'Role Management - Role List');
  });

  test('Role Management - Create Role Form', async ({ page }) => {
    // Navigate to the create role page
    await page.goto('/admin/roles/new');
    
    // Wait for the role form to load
    await page.waitForSelector('[data-testid="role-form"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'Role Management - Create Role Form');
  });

  test('Role Management - Edit Role Form', async ({ page }) => {
    // Navigate to the edit role page
    await page.goto('/admin/roles/role-1/edit');
    
    // Wait for the role form to load
    await page.waitForSelector('[data-testid="role-form"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'Role Management - Edit Role Form');
  });

  test('Role Management - Role Permissions', async ({ page }) => {
    // Navigate to the role permissions page
    await page.goto('/admin/roles/role-1/permissions');
    
    // Wait for the permissions table to load
    await page.waitForSelector('[data-testid="role-permissions"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'Role Management - Role Permissions');
  });

  test('Role Management - Mobile View', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Navigate to the role management page
    await page.goto('/admin/roles');
    
    // Wait for the role table to load
    await page.waitForSelector('[data-testid="roles-table"]');
    
    // Take a Percy snapshot
    await percySnapshot(page, 'Role Management - Mobile View');
  });

  test('Role Management - Filter by Scope', async ({ page }) => {
    // Navigate to the role management page
    await page.goto('/admin/roles');
    
    // Wait for the role table to load
    await page.waitForSelector('[data-testid="roles-table"]');
    
    // Click the scope filter dropdown
    await page.click('[data-testid="role-scope-select"]');
    
    // Select the "Global Roles" option
    await page.click('text=Global Roles');
    
    // Wait for the filtered table to update
    await page.waitForTimeout(500);
    
    // Take a Percy snapshot
    await percySnapshot(page, 'Role Management - Filtered by Global Scope');
  });
});
