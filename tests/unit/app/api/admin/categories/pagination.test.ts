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
  },
}));

// Import the mocked modules
import { CategoryService } from '@/lib/category-service';

// Import mock data
import { generateMockCategories } from './__mocks__/category-mocks';

describe('Admin Categories API - Pagination', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should paginate categories when page and limit parameters are provided', async () => {
    // Create a large set of mock categories
    const tenantId = 'tenant1';
    const categories = generateMockCategories(25, tenantId);

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and pagination parameters
    const request = new NextRequest('http://localhost:3000/api/admin/categories?page=2&limit=5', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response includes correct pagination
    expect(response.status).toBe(200);
    expect(responseData).toHaveProperty('categories');
    expect(responseData).toHaveProperty('pagination');

    // Verify pagination metadata
    expect(responseData.pagination).toEqual({
      total: categories.length,
      page: 2,
      limit: 5,
      totalPages: 5
    });

    // Verify we got the correct page of results (items 6-10)
    expect(responseData.categories).toHaveLength(5);
    expect(responseData.categories[0].id).toBe('cat6');
    expect(responseData.categories[4].id).toBe('cat10');
  });
});
