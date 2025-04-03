/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { mockGET } from './mock-route';

// Import the mocked modules
import { CategoryService } from '@/lib/category-service';

// Mock the CategoryService
jest.mock('@/lib/category-service', () => ({
  CategoryService: {
    getCategoriesByTenant: jest.fn(),
    getCachedCategories: jest.fn(),
    cacheCategories: jest.fn(),
  },
}));

describe('Admin Categories API - Parent Category Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should filter categories by parent ID', async () => {
    // Mock data with parent-child relationships
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'parent1',
        siteId: 'site1',
        tenantId,
        name: 'Parent Category 1',
        slug: 'parent-category-1',
        metaDescription: 'Parent category 1',
        order: 1,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'parent2',
        siteId: 'site1',
        tenantId,
        name: 'Parent Category 2',
        slug: 'parent-category-2',
        metaDescription: 'Parent category 2',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child1',
        siteId: 'site1',
        tenantId,
        name: 'Child Category 1',
        slug: 'child-category-1',
        metaDescription: 'Child category 1',
        parentId: 'parent1',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child2',
        siteId: 'site1',
        tenantId,
        name: 'Child Category 2',
        slug: 'child-category-2',
        metaDescription: 'Child category 2',
        parentId: 'parent1',
        order: 4,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child3',
        siteId: 'site1',
        tenantId,
        name: 'Child Category 3',
        slug: 'child-category-3',
        metaDescription: 'Child category 3',
        parentId: 'parent2',
        order: 5,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and parentId=parent1
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&parentId=parent1', {
      headers: {
        'x-tenant-id': tenantId,
        'x-user-id': 'user1',
      },
    });

    // Call the mock route handler
    const response = await mockGET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response status is 200 OK
    expect(response.status).toBe(200);

    // Verify that the response includes categories
    expect(responseData.categories.length).toBeGreaterThan(0);

    // Verify that the response includes pagination
    expect(responseData.pagination).toBeDefined();
  });

  it('should filter for top-level categories when parentId=null', async () => {
    // Mock data with parent-child relationships
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'parent1',
        siteId: 'site1',
        tenantId,
        name: 'Parent Category 1',
        slug: 'parent-category-1',
        metaDescription: 'Parent category 1',
        order: 1,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'parent2',
        siteId: 'site1',
        tenantId,
        name: 'Parent Category 2',
        slug: 'parent-category-2',
        metaDescription: 'Parent category 2',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child1',
        siteId: 'site1',
        tenantId,
        name: 'Child Category 1',
        slug: 'child-category-1',
        metaDescription: 'Child category 1',
        parentId: 'parent1',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child2',
        siteId: 'site1',
        tenantId,
        name: 'Child Category 2',
        slug: 'child-category-2',
        metaDescription: 'Child category 2',
        parentId: 'parent1',
        order: 4,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and parentId=null
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&parentId=null', {
      headers: {
        'x-tenant-id': tenantId,
        'x-user-id': 'user1',
      },
    });

    // Call the mock route handler
    const response = await mockGET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response status is 200 OK
    expect(response.status).toBe(200);

    // Verify that the response includes categories
    expect(responseData.categories.length).toBeGreaterThan(0);

    // Verify that the response includes pagination
    expect(responseData.pagination).toBeDefined();
  });

  it('should return empty array when no categories match the parent ID', async () => {
    // Mock data with parent-child relationships
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'parent1',
        siteId: 'site1',
        tenantId,
        name: 'Parent Category 1',
        slug: 'parent-category-1',
        metaDescription: 'Parent category 1',
        order: 1,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'child1',
        siteId: 'site1',
        tenantId,
        name: 'Child Category 1',
        slug: 'child-category-1',
        metaDescription: 'Child category 1',
        parentId: 'parent1',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and parentId=nonexistent
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&parentId=nonexistent', {
      headers: {
        'x-tenant-id': tenantId,
        'x-user-id': 'user1',
      },
    });

    // Call the mock route handler
    const response = await mockGET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response status is 200 OK
    expect(response.status).toBe(200);

    // Verify that the response includes pagination
    expect(responseData.pagination).toBeDefined();
  });
});
