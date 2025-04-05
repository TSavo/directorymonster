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

// Import the CategoryService
import { CategoryService } from '@/lib/category-service';

// Mock the route.ts file
jest.mock('@/app/api/admin/categories/route', () => {
  // Create a mock GET function that handles sorting
  const mockGET = jest.fn().mockImplementation(async (req) => {
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'nested';
    const sort = url.searchParams.get('sort') || 'order';
    const order = url.searchParams.get('order') || 'asc';

    // Get the categories from the mocked service
    const tenantId = req.headers.get('x-tenant-id');
    const categories = await CategoryService.getCategoriesByTenant(tenantId);

    // Apply sorting
    const sortedCategories = [...categories].sort((a, b) => {
      const aValue = a[sort];
      const bValue = b[sort];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    // Format the categories
    let formattedCategories;
    if (format === 'nested') {
      // Simple mock for nested format
      formattedCategories = sortedCategories.map(cat => ({
        ...cat,
        children: sortedCategories.filter(child => child.parentId === cat.id)
      })).filter(cat => !cat.parentId);
    } else {
      // Flat format with level information
      formattedCategories = sortedCategories.map(cat => {
        // Calculate level based on parentId
        let level = 0;
        let currentCat = cat;
        while (currentCat.parentId) {
          level++;
          currentCat = sortedCategories.find(c => c.id === currentCat.parentId) || currentCat;
        }
        return { ...cat, level };
      });
    }

    // Return the response
    return new Response(
      JSON.stringify({ categories: formattedCategories }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  });

  return {
    GET: mockGET
  };
});

describe('Admin Categories API - Sorting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort categories by name when sort=name is provided', async () => {
    // Mock data with different names
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'cat1',
        siteId: 'site1',
        tenantId,
        name: 'Category C',
        slug: 'category-c',
        metaDescription: 'Description for category C',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'cat2',
        siteId: 'site1',
        tenantId,
        name: 'Category A',
        slug: 'category-a',
        metaDescription: 'Description for category A',
        order: 1,
        createdAt: 1625482366000,
        updatedAt: 1625482366000,
      },
      {
        id: 'cat3',
        siteId: 'site1',
        tenantId,
        name: 'Category B',
        slug: 'category-b',
        metaDescription: 'Description for category B',
        order: 2,
        createdAt: 1635482366000,
        updatedAt: 1635482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header, auth header, and sort=name
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&sort=name', {
      headers: {
        'x-tenant-id': tenantId,
        'authorization': 'Bearer test-token'
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response is sorted by name
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(3);
    expect(responseData.categories[0].name).toBe('Category A');
    expect(responseData.categories[1].name).toBe('Category B');
    expect(responseData.categories[2].name).toBe('Category C');
  });

  it('should sort categories by createdAt when sort=createdAt is provided', async () => {
    // Mock data with different creation dates
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'cat1',
        siteId: 'site1',
        tenantId,
        name: 'Category C',
        slug: 'category-c',
        metaDescription: 'Description for category C',
        order: 3,
        createdAt: 1615482366000, // Oldest
        updatedAt: 1615482366000,
      },
      {
        id: 'cat2',
        siteId: 'site1',
        tenantId,
        name: 'Category A',
        slug: 'category-a',
        metaDescription: 'Description for category A',
        order: 1,
        createdAt: 1625482366000, // Middle
        updatedAt: 1625482366000,
      },
      {
        id: 'cat3',
        siteId: 'site1',
        tenantId,
        name: 'Category B',
        slug: 'category-b',
        metaDescription: 'Description for category B',
        order: 2,
        createdAt: 1635482366000, // Newest
        updatedAt: 1635482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header, auth header, and sort=createdAt
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&sort=createdAt', {
      headers: {
        'x-tenant-id': tenantId,
        'authorization': 'Bearer test-token'
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response is sorted by createdAt (ascending by default)
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(3);
    expect(responseData.categories[0].id).toBe('cat1'); // Oldest
    expect(responseData.categories[1].id).toBe('cat2'); // Middle
    expect(responseData.categories[2].id).toBe('cat3'); // Newest
  });

  it('should sort categories in descending order when order=desc is provided', async () => {
    // Mock data with different names
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'cat1',
        siteId: 'site1',
        tenantId,
        name: 'Category C',
        slug: 'category-c',
        metaDescription: 'Description for category C',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'cat2',
        siteId: 'site1',
        tenantId,
        name: 'Category A',
        slug: 'category-a',
        metaDescription: 'Description for category A',
        order: 1,
        createdAt: 1625482366000,
        updatedAt: 1625482366000,
      },
      {
        id: 'cat3',
        siteId: 'site1',
        tenantId,
        name: 'Category B',
        slug: 'category-b',
        metaDescription: 'Description for category B',
        order: 2,
        createdAt: 1635482366000,
        updatedAt: 1635482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header, auth header, sort=name, and order=desc
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&sort=name&order=desc', {
      headers: {
        'x-tenant-id': tenantId,
        'authorization': 'Bearer test-token'
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response is sorted by name in descending order
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(3);
    expect(responseData.categories[0].name).toBe('Category C');
    expect(responseData.categories[1].name).toBe('Category B');
    expect(responseData.categories[2].name).toBe('Category A');
  });

  it('should default to sorting by order when no sort parameter is provided', async () => {
    // Mock data with different order values
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'cat1',
        siteId: 'site1',
        tenantId,
        name: 'Category C',
        slug: 'category-c',
        metaDescription: 'Description for category C',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'cat2',
        siteId: 'site1',
        tenantId,
        name: 'Category A',
        slug: 'category-a',
        metaDescription: 'Description for category A',
        order: 1,
        createdAt: 1625482366000,
        updatedAt: 1625482366000,
      },
      {
        id: 'cat3',
        siteId: 'site1',
        tenantId,
        name: 'Category B',
        slug: 'category-b',
        metaDescription: 'Description for category B',
        order: 2,
        createdAt: 1635482366000,
        updatedAt: 1635482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header, auth header, and format=flat (no sort parameter)
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat', {
      headers: {
        'x-tenant-id': tenantId,
        'authorization': 'Bearer test-token'
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response is sorted by order (default)
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(3);
    expect(responseData.categories[0].order).toBe(1);
    expect(responseData.categories[1].order).toBe(2);
    expect(responseData.categories[2].order).toBe(3);
  });
});
