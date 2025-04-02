/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/categories/route';

// Mock the middleware
jest.mock('@/app/api/middleware', () => {
  const withTenantAccess = jest.fn();
  const withPermission = jest.fn();
  const withSitePermission = jest.fn();

  withTenantAccess.mockImplementation((req, handler) => {
    return handler(req);
  });

  withPermission.mockImplementation((req, resourceType, permission, handler) => {
    return handler(req);
  });

  withSitePermission.mockImplementation((req, siteId, permission, handler) => {
    return handler(req);
  });

  return {
    withTenantAccess,
    withPermission,
    withSitePermission
  };
});

// Mock the CategoryService
jest.mock('@/lib/category-service', () => ({
  CategoryService: {
    getCategoriesByTenant: jest.fn(),
    getCategoryStats: jest.fn(),
  },
}));

// Import the mocked modules
import { CategoryService } from '@/lib/category-service';

describe('Admin Categories API - Statistics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should include category statistics when includeStats=true', async () => {
    // Mock data with parent-child relationships
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'parent1',
        siteId: 'site1',
        tenantId,
        name: 'Parent Category',
        slug: 'parent-category',
        metaDescription: 'Parent category',
        order: 1,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child1',
        siteId: 'site1',
        tenantId,
        name: 'Child Category',
        slug: 'child-category',
        metaDescription: 'Child category',
        parentId: 'parent1',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'grandchild1',
        siteId: 'site1',
        tenantId,
        name: 'Grandchild Category',
        slug: 'grandchild-category',
        metaDescription: 'Grandchild category',
        parentId: 'child1',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock statistics
    const mockStats = {
      totalCategories: 3,
      topLevelCategories: 1,
      totalListings: 15,
      maxDepth: 3,
    };

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);
    (CategoryService.getCategoryStats as jest.Mock).mockResolvedValue(mockStats);

    // Create request with tenant header and includeStats=true
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&includeStats=true', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response includes statistics
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty('categories');
    expect(responseData).toHaveProperty('pagination');
    expect(responseData).toHaveProperty('stats');
    expect(responseData.stats).toEqual(mockStats);

    // Verify the service was called with the correct tenant ID
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
    expect(CategoryService.getCategoryStats).toHaveBeenCalledWith(tenantId);
  });

  it('should not include category statistics when includeStats is not provided', async () => {
    // Mock data
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'cat1',
        siteId: 'site1',
        tenantId,
        name: 'Category 1',
        slug: 'category-1',
        metaDescription: 'Description for category 1',
        order: 1,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header (no includeStats parameter)
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response does not include statistics
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty('categories');
    expect(responseData).toHaveProperty('pagination');
    expect(responseData).not.toHaveProperty('stats');

    // Verify the getCategoryStats service was not called
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
    expect(CategoryService.getCategoryStats).not.toHaveBeenCalled();
  });
});
