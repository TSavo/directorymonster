import { v4 as uuidv4 } from 'uuid';
import { Category } from '@/types';

// Mock Redis client
jest.mock('@/lib/redis-client', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    smembers: jest.fn().mockResolvedValue([]),
    multi: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  return {
    redis: mockRedis,
  };
});

describe('CategoryService - Tenant Isolation', () => {
  const testSiteId = 'site_' + uuidv4();
  const testCategoryId1 = 'category_' + uuidv4();
  const testCategoryId2 = 'category_' + uuidv4();

  const tenant1 = 'tenant1';
  const tenant2 = 'tenant2';

  const mockCategories: Category[] = [
    {
      id: testCategoryId1,
      siteId: testSiteId,
      tenantId: tenant1,
      name: 'Category 1',
      slug: 'category-1',
      metaDescription: 'Test category 1',
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: testCategoryId2,
      siteId: testSiteId,
      tenantId: tenant2,
      name: 'Category 2',
      slug: 'category-2',
      metaDescription: 'Test category 2',
      order: 2,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should have a validateCategoryTenant method', async () => {
    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Verify the method exists
    expect(typeof CategoryService.validateCategoryTenant).toBe('function');
  });

  it('should throw an error if category belongs to a different tenant', async () => {
    // Mock Redis to return a category from a different tenant
    const { redis } = require('@/lib/redis-client');
    redis.get.mockResolvedValue(JSON.stringify(mockCategories[1])); // tenant2's category

    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Call the method and expect it to throw an error
    await expect(CategoryService.validateCategoryTenant(testCategoryId2, tenant1))
      .rejects
      .toThrow('Category does not belong to the specified tenant');

    // Verify Redis was called with the correct key
    expect(redis.get).toHaveBeenCalledWith(`test:category:id:${testCategoryId2}`);
  });

  it('should return the category if it belongs to the correct tenant', async () => {
    // Mock Redis to return a category from the same tenant
    const { redis } = require('@/lib/redis-client');
    redis.get.mockResolvedValue(JSON.stringify(mockCategories[0])); // tenant1's category

    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Call the method
    const category = await CategoryService.validateCategoryTenant(testCategoryId1, tenant1);

    // Verify Redis was called with the correct key
    expect(redis.get).toHaveBeenCalledWith(`test:category:id:${testCategoryId1}`);

    // Verify the result
    expect(category).toEqual(mockCategories[0]);
  });

  it('should throw an error if category does not exist', async () => {
    // Mock Redis to return null
    const { redis } = require('@/lib/redis-client');
    redis.get.mockResolvedValue(null);

    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Call the method and expect it to throw an error
    await expect(CategoryService.validateCategoryTenant('non-existent-id', tenant1))
      .rejects
      .toThrow('Category not found');

    // Verify Redis was called with the correct key
    expect(redis.get).toHaveBeenCalledWith('test:category:id:non-existent-id');
  });

  it('should throw an error when creating a category for a different tenant', async () => {
    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Create category data for tenant2
    const categoryData = {
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
      tenantId: tenant2,
      siteId: testSiteId,
      parentId: null,
    };

    // Call the method with tenant1 as the requesting tenant and expect it to throw an error
    await expect(CategoryService.createCategory(categoryData, tenant1))
      .rejects
      .toThrow('You do not have permission to create categories for this tenant');
  });

  it('should allow creating a category when tenant IDs match', async () => {
    // Mock Redis for transaction operations
    const { redis } = require('@/lib/redis-client');
    // Mock that no existing category is found
    redis.get.mockResolvedValue(null);
    // Mock that no existing categories exist for order calculation
    redis.smembers.mockResolvedValue([]);

    const mockMulti = {
      set: jest.fn().mockReturnThis(),
      sadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 'OK'], [null, 'OK'], [null, 1]])
    };
    redis.multi.mockReturnValue(mockMulti);

    // Mock Date.now() to return a consistent timestamp
    const originalDateNow = Date.now;
    const mockTimestamp = 1234567890;
    global.Date.now = jest.fn(() => mockTimestamp);

    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Create category data for tenant1
    const categoryData = {
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
      tenantId: tenant1,
      siteId: testSiteId,
      parentId: null,
    };

    // Call the method with tenant1 as the requesting tenant
    const category = await CategoryService.createCategory(categoryData, tenant1);

    // Verify the category was created
    expect(category).toEqual({
      id: `category_${mockTimestamp}`,
      name: categoryData.name,
      slug: categoryData.slug,
      metaDescription: categoryData.metaDescription,
      tenantId: categoryData.tenantId,
      siteId: categoryData.siteId,
      parentId: categoryData.parentId,
      order: 1,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp
    });

    // Restore Date.now
    global.Date.now = originalDateNow;
  });
});
