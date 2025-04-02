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

describe('Admin Categories API - Filtering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter categories by siteId when provided', async () => {
    // Create mock categories with different site IDs
    const tenantId = 'tenant1';
    const site1Categories = generateMockCategories(3, tenantId).map(cat => ({
      ...cat,
      siteId: 'site1'
    }));
    const site2Categories = generateMockCategories(2, tenantId).map(cat => ({
      ...cat,
      siteId: 'site2'
    }));
    const allCategories = [...site1Categories, ...site2Categories];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(allCategories);

    // Create request with tenant header and siteId query parameter
    const request = new NextRequest('http://localhost:3000/api/admin/categories?siteId=site2', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response only includes site2 categories
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(2);
    expect(responseData.categories.every((cat: any) => cat.siteId === 'site2')).toBe(true);

    // Verify the service was called with the correct tenant ID
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
  });

  it('should filter categories by siteSlug when provided', async () => {
    // Create mock categories with different site slugs
    const tenantId = 'tenant1';
    const site1Categories = generateMockCategories(3, tenantId).map(cat => ({
      ...cat,
      siteId: 'site1',
      siteSlug: 'site-one'
    }));
    const site2Categories = generateMockCategories(2, tenantId).map(cat => ({
      ...cat,
      siteId: 'site2',
      siteSlug: 'site-two'
    }));
    const allCategories = [...site1Categories, ...site2Categories];

    // Mock the CategoryService
    (CategoryService.getCategoriesByTenant as jest.Mock).mockResolvedValue(allCategories);

    // Create request with tenant header and siteSlug query parameter
    const request = new NextRequest('http://localhost:3000/api/admin/categories?siteSlug=site-one', {
      headers: {
        'x-tenant-id': tenantId,
      },
    });

    // Call the route handler
    const response = await GET(request);

    // Parse the response
    const responseData = await response.json();

    // Verify the response only includes site-one categories
    expect(response.status).toBe(200);
    expect(responseData.categories).toHaveLength(3);
    expect(responseData.categories.every((cat: any) => cat.siteSlug === 'site-one')).toBe(true);

    // Verify the service was called with the correct tenant ID
    expect(CategoryService.getCategoriesByTenant).toHaveBeenCalledWith(tenantId);
  });
});
