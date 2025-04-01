import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/admin/categories/reorder/route';
import { redis, kv } from '@/lib/redis-client';
import { Category } from '@/types';
import { AuditService } from '@/lib/audit/audit-service';
import { CategoryService } from '@/lib/category-service';

// Mock dependencies
jest.mock('@/lib/category-service', () => ({
  CategoryService: {
    reorderCategoriesWithTenantValidation: jest.fn()
  }
}));

jest.mock('@/middleware/tenant-validation', () => ({
  withTenantAccess: jest.fn().mockImplementation((req, handlerOrMiddleware) => {
    // If handlerOrMiddleware is a function, call it directly
    if (typeof handlerOrMiddleware === 'function') {
      return handlerOrMiddleware(req);
    }
    // Otherwise, it's the result of another middleware, so call it with the request
    return handlerOrMiddleware(req);
  })
}));

jest.mock('@/middleware/withPermission', () => ({
  withPermission: jest.fn().mockImplementation((req, resourceType, permission, handler) => {
    // Return a function that will be called by withTenantAccess
    return (validatedReq) => handler(validatedReq);
  })
}));

jest.mock('@/lib/redis-client', () => {
  const mockMulti = {
    set: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue([])
  };

  return {
    redis: {
      multi: jest.fn().mockReturnValue(mockMulti)
    },
    kv: {
      get: jest.fn(),
      set: jest.fn(),
      keys: jest.fn()
    }
  };
});

jest.mock('@/lib/audit/audit-service', () => ({
  AuditService: {
    logEvent: jest.fn().mockResolvedValue(true)
  }
}));

describe('Category Reordering Implementation', () => {
  // Mock data
  const mockTenantId = 'test-tenant';
  const mockSiteId = 'test-site';

  const mockCategories: Category[] = [
    {
      id: 'category-1',
      siteId: mockSiteId,
      name: 'Category 1',
      slug: 'category-1',
      metaDescription: 'Description 1',
      order: 3,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'category-2',
      siteId: mockSiteId,
      name: 'Category 2',
      slug: 'category-2',
      metaDescription: 'Description 2',
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'category-3',
      siteId: mockSiteId,
      name: 'Category 3',
      slug: 'category-3',
      metaDescription: 'Description 3',
      order: 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock kv.get to return the appropriate category
    (kv.get as jest.Mock).mockImplementation((key: string) => {
      const categoryId = key.split(':').pop();
      return Promise.resolve(mockCategories.find(c => c.id === categoryId) || null);
    });
  });

  it('should reorder categories successfully', async () => {
    // Create a test request with a new order
    const newOrder = ['category-2', 'category-3', 'category-1']; // Change the order

    const req = new NextRequest('https://example.com/api/admin/categories/reorder', {
      method: 'POST',
      headers: {
        'x-tenant-id': mockTenantId,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ categoryIds: newOrder })
    });

    // Mock the CategoryService to return updated categories
    const updatedCategories = [
      { ...mockCategories[1], order: 0 },
      { ...mockCategories[2], order: 1 },
      { ...mockCategories[0], order: 2 }
    ];

    (CategoryService.reorderCategoriesWithTenantValidation as jest.Mock).mockResolvedValue({
      updatedCategories
    });

    // Call the route handler
    const response = await POST(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe('Categories reordered successfully');
    expect(data.categories).toHaveLength(3);

    // Verify CategoryService was called with correct parameters
    expect(CategoryService.reorderCategoriesWithTenantValidation).toHaveBeenCalledWith(
      newOrder,
      mockTenantId
    );

    // No need to verify Redis operations as we're using CategoryService

    // Verify audit log was created
    expect(AuditService.logEvent).toHaveBeenCalledWith({
      action: 'categories_reordered',
      resourceType: 'category',
      tenantId: mockTenantId,
      details: {
        categoryIds: newOrder,
        count: newOrder.length
      }
    });
  });

  it('should return an error for invalid category IDs', async () => {
    // Create a test request with invalid category IDs
    const invalidOrder = ['category-2', 'non-existent-category', 'category-1'];

    const req = new NextRequest('https://example.com/api/admin/categories/reorder', {
      method: 'POST',
      headers: {
        'x-tenant-id': mockTenantId,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ categoryIds: invalidOrder })
    });

    // Mock the CategoryService to return invalid category IDs
    (CategoryService.reorderCategoriesWithTenantValidation as jest.Mock).mockResolvedValue({
      updatedCategories: [],
      invalidCategoryIds: ['non-existent-category']
    });

    // Call the route handler
    const response = await POST(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.error).toBe('Some categories were not found or do not belong to this tenant');
    expect(data.invalidCategoryIds).toContain('non-existent-category');

    // Verify CategoryService was called with correct parameters
    expect(CategoryService.reorderCategoriesWithTenantValidation).toHaveBeenCalledWith(
      invalidOrder,
      mockTenantId
    );

    // Verify audit log was not created
    expect(AuditService.logEvent).not.toHaveBeenCalled();
  });

  it('should return an error for empty category IDs array', async () => {
    // Create a test request with empty category IDs
    const req = new NextRequest('https://example.com/api/admin/categories/reorder', {
      method: 'POST',
      headers: {
        'x-tenant-id': mockTenantId,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ categoryIds: [] })
    });

    // Call the route handler
    const response = await POST(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid category order data');

    // Verify CategoryService was not called
    expect(CategoryService.reorderCategoriesWithTenantValidation).not.toHaveBeenCalled();

    // Verify audit log was not created
    expect(AuditService.logEvent).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    // Mock CategoryService to throw an error
    (CategoryService.reorderCategoriesWithTenantValidation as jest.Mock).mockRejectedValue(
      new Error('Database error')
    );

    // Create a test request
    const req = new NextRequest('https://example.com/api/admin/categories/reorder', {
      method: 'POST',
      headers: {
        'x-tenant-id': mockTenantId,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ categoryIds: ['category-1', 'category-2'] })
    });

    // Call the route handler
    const response = await POST(req);
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to reorder categories');

    // Verify CategoryService was called
    expect(CategoryService.reorderCategoriesWithTenantValidation).toHaveBeenCalled();

    // Verify audit log was not created
    expect(AuditService.logEvent).not.toHaveBeenCalled();
  });
});
