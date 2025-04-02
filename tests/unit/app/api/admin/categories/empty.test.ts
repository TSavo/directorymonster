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
    getCategoryListingCount: jest.fn(),
  },
}));

// Import the mocked modules
import { CategoryService } from '@/lib/category-service';

describe('Admin Categories API - Empty Category Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter out empty categories when includeEmpty=false', async () => {
    // Mock data with categories that have different listing counts
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
      {
        id: 'cat2',
        siteId: 'site1',
        tenantId,
        name: 'Category 2',
        slug: 'category-2',
        metaDescription: 'Description for category 2',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'cat3',
        siteId: 'site1',
        tenantId,
        name: 'Category 3',
        slug: 'category-3',
        metaDescription: 'Description for category 3',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock listing counts (cat1 and cat3 have listings, cat2 is empty)
    const listingCounts = {
      cat1: 5,
      cat2: 0,
      cat3: 3,
    };

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);
    (CategoryService.getCategoryListingCount as jest.Mock).mockImplementation(
      (categoryId) => Promise.resolve(listingCounts[categoryId] || 0)
    );

    // Create request with tenant header and includeEmpty=false
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&includeEmpty=false', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response only includes non-empty categories
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(2);
    expect(responseData.categories[0].id).toBe('cat1');
    expect(responseData.categories[1].id).toBe('cat3');

    // Verify the service was called with the correct parameters
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
    expect(CategoryService.getCategoryListingCount).toHaveBeenCalledWith('cat1');
    expect(CategoryService.getCategoryListingCount).toHaveBeenCalledWith('cat2');
    expect(CategoryService.getCategoryListingCount).toHaveBeenCalledWith('cat3');
  });

  it('should include all categories by default (includeEmpty=true)', async () => {
    // Mock data with categories that have different listing counts
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
      {
        id: 'cat2',
        siteId: 'site1',
        tenantId,
        name: 'Category 2',
        slug: 'category-2',
        metaDescription: 'Description for category 2',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock listing counts (cat1 has listings, cat2 is empty)
    const listingCounts = {
      cat1: 5,
      cat2: 0,
    };

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);
    (CategoryService.getCategoryListingCount as jest.Mock).mockImplementation(
      (categoryId) => Promise.resolve(listingCounts[categoryId] || 0)
    );

    // Create request with tenant header (no includeEmpty parameter)
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response includes all categories
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(2);
    expect(responseData.categories[0].id).toBe('cat1');
    expect(responseData.categories[1].id).toBe('cat2');

    // Verify the service was not called to get listing counts
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
    expect(CategoryService.getCategoryListingCount).not.toHaveBeenCalled();
  });
});
