/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/categories/route';

// Mock the middleware
jest.mock('@/app/api/middleware', () => ({
  withTenantAccess: jest.fn(),
  withPermission: jest.fn(),
  withSitePermission: jest.fn(),
}));

// Mock the CategoryService
jest.mock('@/lib/category-service', () => ({
  CategoryService: {
    getCategoriesByTenant: jest.fn(),
  },
}));

// Import the mocked modules
import { withTenantAccess, withPermission, withSitePermission } from '@/app/api/middleware';
import { CategoryService } from '@/lib/category-service';
import { setupPassthroughMiddlewareMocks } from './__mocks__/middleware-mocks';

describe('Admin Categories API - Site Permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should check for site-level permissions', () => {
    // Verify that the route handler uses the site permission middleware
    const routeHandler = GET.toString();
    
    // Check if the route handler uses withSitePermission
    expect(routeHandler).toContain('withSitePermission');
    expect(routeHandler).toContain('site');
    expect(routeHandler).toContain('read');
  });

  it('should deny access when user lacks site-level permissions', async () => {
    // Mock the tenant access middleware to pass through
    (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
      return handler(req);
    });
    
    // Mock the category permission middleware to pass through
    (withPermission as jest.Mock).mockImplementation((req, resourceType, permission, handler) => {
      return handler(req);
    });
    
    // Mock the site permission middleware to deny access
    (withSitePermission as jest.Mock).mockImplementation((req, siteId, permission, handler) => {
      return new Response(JSON.stringify({ error: 'Forbidden', message: 'You do not have permission to access this site' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Create request with tenant header and siteId parameter
    const request = new NextRequest('http://localhost:3000/api/admin/categories?siteId=site1', {
      headers: {
        'x-tenant-id': 'tenant1',
      },
    });

    // Call the route handler
    const response = await GET(request);
    
    // Verify the response
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data).toEqual({ error: 'Forbidden', message: 'You do not have permission to access this site' });
    
    // Verify the site permission middleware was called with the correct parameters
    expect(withSitePermission).toHaveBeenCalledWith(
      expect.anything(),
      'site1',
      'read',
      expect.any(Function)
    );
    
    // Verify the service was not called
    expect(CategoryService.getCategoriesByTenant).not.toHaveBeenCalled();
  });

  it('should check site permissions for each site when filtering by siteSlug', async () => {
    // Mock the tenant access middleware to pass through
    (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
      return handler(req);
    });
    
    // Mock the category permission middleware to pass through
    (withPermission as jest.Mock).mockImplementation((req, resourceType, permission, handler) => {
      return handler(req);
    });
    
    // Mock the site service to resolve site ID from slug
    const mockSiteService = {
      getSiteIdBySlug: jest.fn().mockResolvedValue('site1'),
    };
    
    // Mock the site permission middleware to pass through
    (withSitePermission as jest.Mock).mockImplementation((req, siteId, permission, handler) => {
      // Verify the site ID is correctly resolved from the slug
      expect(siteId).toBe('site1');
      return handler(req);
    });

    // Create request with tenant header and siteSlug parameter
    const request = new NextRequest('http://localhost:3000/api/admin/categories?siteSlug=test-site', {
      headers: {
        'x-tenant-id': 'tenant1',
      },
    });

    // Call the route handler
    await GET(request);
    
    // Verify the site permission middleware was called
    expect(withSitePermission).toHaveBeenCalled();
  });

  it('should check permissions for all sites when no site filter is provided', async () => {
    // Mock the tenant access middleware to pass through
    (withTenantAccess as jest.Mock).mockImplementation((req, handler) => {
      return handler(req);
    });
    
    // Mock the category permission middleware to pass through
    (withPermission as jest.Mock).mockImplementation((req, resourceType, permission, handler) => {
      return handler(req);
    });
    
    // Mock the site permission middleware to check for tenant-wide site access
    (withSitePermission as jest.Mock).mockImplementation((req, siteId, permission, handler) => {
      // For tenant-wide access, siteId should be null or undefined
      expect(siteId).toBeNull();
      return handler(req);
    });

    // Create request with tenant header but no site filter
    const request = new NextRequest('http://localhost:3000/api/admin/categories', {
      headers: {
        'x-tenant-id': 'tenant1',
      },
    });

    // Call the route handler
    await GET(request);
    
    // Verify the site permission middleware was called with null siteId
    expect(withSitePermission).toHaveBeenCalledWith(
      expect.anything(),
      null,
      'read',
      expect.any(Function)
    );
  });
});
