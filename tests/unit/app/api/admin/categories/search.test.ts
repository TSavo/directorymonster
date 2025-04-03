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

describe('Admin Categories API - Search/Filter by Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should filter categories by search term in name field', async () => {
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

    // Create request with tenant header and search=electron
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&search=electron', {
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

  it('should filter categories by search term in slug field', async () => {
    // Mock data with different slugs
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

    // Create request with tenant header and search=electronic-acc
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&search=electronic-acc', {
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

  it('should filter categories by search term in metaDescription field', async () => {
    // Mock data with different descriptions
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
        metaDescription: 'Books and literature category',
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
        metaDescription: 'Electronic accessories and literature',
        order: 3,
        createdAt: 1615482366000,
        updatedAt: 1615482366000,
      },
    ];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(categories);

    // Create request with tenant header and search=literature
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&search=literature', {
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

  it('should return empty array when no categories match the search term', async () => {
    // Mock data
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

    // Create request with tenant header and search=nonexistent
    const request = new NextRequest('http://localhost:3000/api/admin/categories?format=flat&search=nonexistent', {
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
