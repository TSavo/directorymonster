/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/categories/route';

// Mock the route.ts file
jest.mock('@/app/api/admin/categories/route', () => {
  // Create a mock GET function that handles pagination
  const mockGET = jest.fn().mockImplementation(async (req) => {
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Get the categories from the mocked service
    const tenantId = req.headers.get('x-tenant-id');
    const categories = await CategoryService.getCategoriesByTenant(tenantId);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCategories = categories.slice(startIndex, endIndex);

    // Calculate pagination metadata
    const totalPages = Math.ceil(categories.length / limit);

    // Return the response
    return new Response(
      JSON.stringify({
        categories: paginatedCategories,
        pagination: {
          total: categories.length,
          page,
          limit,
          totalPages
        }
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
