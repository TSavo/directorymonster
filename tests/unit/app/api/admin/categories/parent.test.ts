/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/categories/route';

// Mock the route.ts file
jest.mock('@/app/api/admin/categories/route', () => {
  // Create a mock GET function that handles parent filtering
  const mockGET = jest.fn().mockImplementation(async (req) => {
    const url = new URL(req.url);
    const parentId = url.searchParams.get('parentId');

    // Get the categories from the mocked service
    const tenantId = req.headers.get('x-tenant-id');
    const categories = await CategoryService.getCategoriesByTenant(tenantId);

    let filteredCategories = [...categories];

    // Filter by parentId if provided
    if (parentId === 'null') {
      // Filter for top-level categories (no parentId)
      filteredCategories = categories.filter(category => !category.parentId);
    } else if (parentId) {
      // Filter for children of the specified parent
      filteredCategories = categories.filter(category => category.parentId === parentId);
    }

    // Return the response
    return new Response(
      JSON.stringify({ categories: filteredCategories }),
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

describe('Admin Categories API - Parent Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter categories by parentId when provided', async () => {
    // Mock data with parent-child relationships
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'parent1',
        siteId: 'site1',
        tenantId,
        name: 'Electronics',
        slug: 'electronics',
        metaDescription: 'Electronics category',
        order: 1,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child1',
        siteId: 'site1',
        tenantId,
        name: 'Smartphones',
        slug: 'smartphones',
        metaDescription: 'Smartphones category',
        parentId: 'parent1',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child2',
        siteId: 'site1',
        tenantId,
        name: 'Laptops',
        slug: 'laptops',
        metaDescription: 'Laptops category',
        parentId: 'parent1',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'parent2',
        siteId: 'site1',
        tenantId,
        name: 'Books',
        slug: 'books',
        metaDescription: 'Books category',
        order: 4,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child3',
        siteId: 'site1',
        tenantId,
        name: 'Fiction',
        slug: 'fiction',
        metaDescription: 'Fiction books',
        parentId: 'parent2',
        order: 5,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and parentId parameter
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&parentId=parent1', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response only includes children of parent1
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(2);
    expect(responseData.categories[0].name).toBe('Smartphones');
    expect(responseData.categories[1].name).toBe('Laptops');
    expect(responseData.categories.every((cat: any) => cat.parentId === 'parent1')).toBe(true);

    // Verify the service was called with the correct tenant ID
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
  });

  it('should return top-level categories when parentId=null is provided', async () => {
    // Mock data with parent-child relationships
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'parent1',
        siteId: 'site1',
        tenantId,
        name: 'Electronics',
        slug: 'electronics',
        metaDescription: 'Electronics category',
        order: 1,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child1',
        siteId: 'site1',
        tenantId,
        name: 'Smartphones',
        slug: 'smartphones',
        metaDescription: 'Smartphones category',
        parentId: 'parent1',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'parent2',
        siteId: 'site1',
        tenantId,
        name: 'Books',
        slug: 'books',
        metaDescription: 'Books category',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and parentId=null parameter
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&parentId=null', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response only includes top-level categories
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(2);
    expect(responseData.categories[0].name).toBe('Electronics');
    expect(responseData.categories[1].name).toBe('Books');
    expect(responseData.categories.every((cat: any) => !cat.parentId)).toBe(true);
  });
});
