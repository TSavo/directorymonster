/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/categories/route';

// Mock the CategoryService
jest.mock('@/lib/category-service', () => ({
  CategoryService: {
    getCategoriesByTenant: jest.fn(),
  },
}));

// Import the mocked modules
import { CategoryService } from '@/lib/category-service';
import { mockCategories } from './__mocks__/category-mocks';
import {
  setupPassthroughMiddlewareMocks,
  setupDenyTenantAccessMock,
  setupDenyPermissionMock,
  resetMiddlewareMocks,
  withTenantAccess,
  withPermission
} from './__mocks__/middleware-mocks';

describe('Admin Categories API - Security', () => {
  it('should use middleware for tenant isolation and permission checking', () => {
    // Verify that the route handler uses the middleware
    const routeHandler = GET.toString();

    // Check if the route handler uses withTenantAccess and withPermission
    expect(routeHandler).toContain('withTenantAccess');
    expect(routeHandler).toContain('withPermission');
    expect(routeHandler).toContain('category');
    expect(routeHandler).toContain('read');
  });

  it('should return 401 when tenant access is denied', async () => {
    // Set up middleware mock to deny tenant access
    setupDenyTenantAccessMock();

    // Create request with tenant header
    const request = new NextRequest('http://localhost:3000/api/admin/categories', {
      headers: {
        'x-tenant-id': 'unauthorized-tenant',
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Verify the response
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unauthorized', message: 'Authentication required' });
  });

  it('should return 401 when permission is denied', async () => {
    // Set up middleware mock to deny permission
    setupDenyPermissionMock();

    // Create request with tenant header
    const request = new NextRequest('http://localhost:3000/api/admin/categories', {
      headers: {
        'x-tenant-id': 'tenant1',
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Verify the response
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Unauthorized', message: 'Authentication required' });
  });
});
