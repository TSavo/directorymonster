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
import { CategoryService } from '@/lib/category-service';
import { setupPassthroughMiddlewareMocks } from './__mocks__/middleware-mocks';

describe('Admin Categories API - Sorting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupPassthroughMiddlewareMocks();
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

    // Create request with tenant header and sort=name
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&sort=name', {
      headers: {
        'x-tenant-id': tenantId,
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

    // Create request with tenant header and sort=createdAt
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&sort=createdAt', {
      headers: {
        'x-tenant-id': tenantId,
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

    // Create request with tenant header, sort=name, and order=desc
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&sort=name&order=desc', {
      headers: {
        'x-tenant-id': tenantId,
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

    // Create request with tenant header and format=flat (no sort parameter)
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat', {
      headers: {
        'x-tenant-id': tenantId,
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
