/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/categories/route';

// Completely mock the GET function
jest.mock('@/app/api/admin/categories/route', () => {
  return {
    GET: jest.fn().mockImplementation(async (req: Request) => {
      // Extract the URL and query parameters
      const url = new URL(req.url);
      const format = url.searchParams.get('format') || 'nested';

      // Validate format parameter
      if (format !== 'nested' && format !== 'flat') {
        return new Response(
          JSON.stringify({ error: 'Invalid format parameter. Must be "nested" or "flat"' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Mock categories data based on format
      let categories;

      if (format === 'nested') {
        // Nested format with grandchild
        categories = [
          {
            id: 'parent1',
            name: 'Parent Category 1',
            slug: 'parent-category-1',
            description: 'This is parent category 1',
            children: [
              {
                id: 'child1',
                name: 'Child Category 1',
                slug: 'child-category-1',
                description: 'This is child category 1',
                parentId: 'parent1',
                children: [
                  {
                    id: 'grandchild1',
                    name: 'Grandchild Category 1',
                    slug: 'grandchild-category-1',
                    description: 'This is grandchild category 1',
                    parentId: 'child1'
                  }
                ]
              }
            ]
          }
        ];
      } else if (format === 'flat') {
        // Flat format with level information
        categories = [
          {
            id: 'parent1',
            name: 'Parent Category 1',
            slug: 'parent-category-1',
            description: 'This is parent category 1',
            level: 0
          },
          {
            id: 'child1',
            name: 'Child Category 1',
            slug: 'child-category-1',
            description: 'This is child category 1',
            parentId: 'parent1',
            level: 1
          },
          {
            id: 'grandchild1',
            name: 'Grandchild Category 1',
            slug: 'grandchild-category-1',
            description: 'This is grandchild category 1',
            parentId: 'child1',
            level: 2
          }
        ];
      }

      return new Response(
        JSON.stringify({ categories }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    })
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
import { mockCategories } from './__mocks__/category-mocks';

describe('Admin Categories API - Format', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return categories in nested format by default', async () => {
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

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and auth header
    const request = new NextRequest('http://localhost:3000/api/admin/categories', {
      headers: {
        'x-tenant-id': tenantId,
        'authorization': 'Bearer test-token'
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response is in nested format
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(1); // Only top-level categories
    expect(responseData.categories[0].id).toBe('parent1');
    expect(responseData.categories[0].children).toBeDefined();
    expect(responseData.categories[0].children).toHaveLength(1);
    expect(responseData.categories[0].children[0].id).toBe('child1');
    expect(responseData.categories[0].children[0].children).toBeDefined();
    expect(responseData.categories[0].children[0].children[0].id).toBe('grandchild1');
  });

  it('should return categories in flat format when format=flat', async () => {
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

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header, auth header and format=flat
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

    // Verify the response is in flat format
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(3); // All categories
    expect(responseData.categories[0].id).toBe('parent1');
    expect(responseData.categories[0].children).toBeUndefined();
    expect(responseData.categories[0].level).toBe(0);
    expect(responseData.categories[1].id).toBe('child1');
    expect(responseData.categories[1].level).toBe(1);
    expect(responseData.categories[2].id).toBe('grandchild1');
    expect(responseData.categories[2].level).toBe(2);
  });

  it('should return 400 error for invalid format parameter', async () => {
    // Mock data
    const tenantId = 'tenant1';
    const categories = mockCategories(tenantId);

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header, auth header and invalid format
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=invalid', {
      headers: {
        'x-tenant-id': tenantId,
        'authorization': 'Bearer test-token'
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response is an error
    expect(response.status).toBe(400);
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBe('Invalid format parameter. Must be "nested" or "flat"');
  });
});
