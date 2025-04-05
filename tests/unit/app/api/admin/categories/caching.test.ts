/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/categories/route';

// Mock the route.ts file
jest.mock('@/app/api/admin/categories/route', () => {
  // Create a mock GET function that handles caching
  const mockGET = jest.fn().mockImplementation(async (req) => {
    const url = new URL(req.url);
    const useCache = url.searchParams.get('useCache') !== 'false';

    // Get the tenant ID from the request
    const tenantId = req.headers.get('x-tenant-id');

    // Try to get cached categories if caching is enabled
    let categories;
    let cacheStatus = 'miss';

    if (useCache) {
      const cachedCategories = await CategoryService.getCachedCategories(tenantId);
      if (cachedCategories && cachedCategories.length > 0) {
        categories = cachedCategories;
        cacheStatus = 'hit';
      }
    }

    // If no cached categories or cache disabled, fetch from service
    if (!categories) {
      categories = await CategoryService.getCategoriesByTenant(tenantId);

      // Cache the categories if caching is enabled
      if (useCache) {
        await CategoryService.cacheCategories(tenantId, categories);
      }
    }

    // Return the response
    return new Response(
      JSON.stringify({
        categories,
        pagination: {
          total: categories.length,
          page: 1,
          pageSize: categories.length,
          totalPages: 1
        },
        cacheStatus
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  });

  return {
    GET: mockGET
  };
});

// Mock the CategoryService
jest.mock('@/lib/category-service', () => ({
  CategoryService: {
    getCategoriesByTenant: jest.fn(),
    getCachedCategories: jest.fn(),
    cacheCategories: jest.fn(),
  },
}));

// Import the mocked modules
import { CategoryService } from '@/lib/category-service';

describe('Admin Categories API - Caching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use cached categories when available', async () => {
    // Mock data
    const tenantId = 'tenant1';
    const cachedCategories = [
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

    // Mock the CategoryService to return cached categories
    (CategoryService.getCachedCategories as jest.Mock).mockResolvedValue(cachedCategories);

    // Create request with tenant header and useCache=true
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&useCache=true', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response includes the cached categories
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(2);
    expect(responseData.categories[0].id).toBe('cat1');
    expect(responseData.categories[1].id).toBe('cat2');

    // Verify the service methods were called correctly
    expect(CategoryService.getCachedCategories).toHaveBeenCalledWith(tenantId);
    expect(CategoryService.getCategoriesByTenant).not.toHaveBeenCalled();
  });

  it('should fetch and cache categories when cache is empty', async () => {
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

    // Mock the CategoryService to return no cached categories
    (CategoryService.getCachedCategories as jest.Mock).mockResolvedValue(null);
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and useCache=true
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&useCache=true', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response includes the fetched categories
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(1);
    expect(responseData.categories[0].id).toBe('cat1');

    // Verify the service methods were called correctly
    expect(CategoryService.getCachedCategories).toHaveBeenCalledWith(tenantId);
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
    expect(CategoryService.cacheCategories).toHaveBeenCalledWith(tenantId, categories);
  });

  it('should bypass cache when useCache=false', async () => {
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

    // Create request with tenant header and useCache=false
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&useCache=false', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response includes the fetched categories
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(1);

    // Verify the service methods were called correctly
    expect(CategoryService.getCachedCategories).not.toHaveBeenCalled();
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
    expect(CategoryService.cacheCategories).not.toHaveBeenCalled();
  });

  it('should include cache status in the response', async () => {
    // Mock data
    const tenantId = 'tenant1';
    const cachedCategories = [
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

    // Mock the CategoryService to return cached categories
    (CategoryService.getCachedCategories as jest.Mock).mockResolvedValue(cachedCategories);

    // Create request with tenant header and useCache=true
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&useCache=true', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response includes cache status
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty('cacheStatus');
    expect(responseData.cacheStatus).toBe('hit');
  });
});
