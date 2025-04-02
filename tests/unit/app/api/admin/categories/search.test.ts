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

describe('Admin Categories API - Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter categories by name when search parameter is provided', async () => {
    // Mock data with different names
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'cat1',
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
        id: 'cat2',
        siteId: 'site1',
        tenantId,
        name: 'Books',
        slug: 'books',
        metaDescription: 'Books category',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'cat3',
        siteId: 'site1',
        tenantId,
        name: 'Electronic Accessories',
        slug: 'electronic-accessories',
        metaDescription: 'Electronic accessories category',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and search parameter
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&search=electronic', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response only includes categories with 'electronic' in the name
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(2);
    expect(responseData.categories[0].name).toBe('Electronics');
    expect(responseData.categories[1].name).toBe('Electronic Accessories');

    // Verify the service was called with the correct tenant ID
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
  });

  it('should perform case-insensitive search', async () => {
    // Mock data with different names
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'cat1',
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
        id: 'cat2',
        siteId: 'site1',
        tenantId,
        name: 'Books',
        slug: 'books',
        metaDescription: 'Books category',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and search parameter (lowercase)
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&search=electronics', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response includes the Electronics category despite case difference
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(1);
    expect(responseData.categories[0].name).toBe('Electronics');
  });

  it('should search in name, slug, and metaDescription fields', async () => {
    // Mock data with search term in different fields
    const tenantId = 'tenant1';
    const categories = [
      {
        id: 'cat1',
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
        id: 'cat2',
        siteId: 'site1',
        tenantId,
        name: 'Books',
        slug: 'books-and-media',
        metaDescription: 'Books and media category',
        order: 2,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
      {
        id: 'cat3',
        siteId: 'site1',
        tenantId,
        name: 'Toys',
        slug: 'toys',
        metaDescription: 'Toys and games for children of all ages',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and search parameter
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&search=media', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response includes categories with 'media' in any searchable field
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(1);
    expect(responseData.categories[0].name).toBe('Books');
    expect(responseData.categories[0].slug).toBe('books-and-media');
  });
});
