import { v4 as uuidv4 } from 'uuid';
import { SiteConfig, Category } from '@/types';

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

describe('CategoryService', () => {
  const testSiteId = 'site_' + uuidv4();
  const testCategoryId1 = 'category_' + uuidv4();
  const testCategoryId2 = 'category_' + uuidv4();

  const mockSite: SiteConfig = {
    id: testSiteId,
    name: 'Test Site',
    slug: 'test-site',
    primaryKeyword: 'test',
    metaDescription: 'Test site for API testing',
    headerText: 'Test Site Header',
    defaultLinkAttributes: 'dofollow',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const mockCategories: Category[] = [
    {
      id: testCategoryId1,
      siteId: testSiteId,
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

  it('should have a getCategoriesBySiteId method', async () => {
    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Verify the method exists
    expect(typeof CategoryService.getCategoriesBySiteId).toBe('function');
  });

  it('should return categories for a site', async () => {
    // Mock Redis to return category IDs and category data
    const { redis } = require('@/lib/redis-client');
    redis.smembers.mockResolvedValue([testCategoryId1, testCategoryId2]);
    redis.get.mockImplementation((key) => {
      if (key === `test:category:id:${testCategoryId1}`) {
        return Promise.resolve(JSON.stringify(mockCategories[0]));
      } else if (key === `test:category:id:${testCategoryId2}`) {
        return Promise.resolve(JSON.stringify(mockCategories[1]));
      }
      return Promise.resolve(null);
    });

    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Call the method
    const categories = await CategoryService.getCategoriesBySiteId(testSiteId);

    // Verify Redis was called with the correct keys
    expect(redis.smembers).toHaveBeenCalledWith(`test:site:${testSiteId}:categories`);
    expect(redis.get).toHaveBeenCalledWith(`test:category:id:${testCategoryId1}`);
    expect(redis.get).toHaveBeenCalledWith(`test:category:id:${testCategoryId2}`);

    // Verify the result
    expect(categories).toHaveLength(2);
    expect(categories[0].id).toBe(testCategoryId1);
    expect(categories[1].id).toBe(testCategoryId2);
  });

  it('should return an empty array when site has no categories', async () => {
    // Mock Redis to return empty array for category IDs
    const { redis } = require('@/lib/redis-client');
    redis.smembers.mockResolvedValue([]);

    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Call the method
    const categories = await CategoryService.getCategoriesBySiteId(testSiteId);

    // Verify Redis was called with the correct key
    expect(redis.smembers).toHaveBeenCalledWith(`test:site:${testSiteId}:categories`);

    // Verify the result is an empty array
    expect(Array.isArray(categories)).toBe(true);
    expect(categories).toHaveLength(0);
  });

  it('should have a createCategory method', async () => {
    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Verify the method exists
    expect(typeof CategoryService.createCategory).toBe('function');
  });

  it('should create a new category', async () => {
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

    // Create category data
    const categoryData = {
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
      tenantId: 'tenant1',
      siteId: testSiteId,
      parentId: null,
    };

    // Call the method
    const category = await CategoryService.createCategory(categoryData);

    // Verify Redis was called to check for existing category
    expect(redis.get).toHaveBeenCalledWith(`test:category:site:${testSiteId}:${categoryData.slug}`);

    // Verify Redis transaction was used correctly
    expect(redis.multi).toHaveBeenCalled();
    expect(mockMulti.set).toHaveBeenCalledWith(
      `test:category:id:category_${mockTimestamp}`,
      expect.any(String)
    );
    expect(mockMulti.set).toHaveBeenCalledWith(
      `test:category:site:${testSiteId}:${categoryData.slug}`,
      expect.any(String)
    );
    expect(mockMulti.sadd).toHaveBeenCalledWith(
      `test:site:${testSiteId}:categories`,
      `category_${mockTimestamp}`
    );
    expect(mockMulti.exec).toHaveBeenCalled();

    // Verify the returned category
    expect(category).toEqual({
      id: `category_${mockTimestamp}`,
      name: categoryData.name,
      slug: categoryData.slug,
      metaDescription: categoryData.metaDescription,
      tenantId: categoryData.tenantId,
      siteId: categoryData.siteId,
      parentId: categoryData.parentId,
      order: 1, // First category should have order 1
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp
    });

    // Restore Date.now
    global.Date.now = originalDateNow;
  });

  it('should throw an error if a category with the same slug already exists', async () => {
    // Mock Redis to return an existing category
    const { redis } = require('@/lib/redis-client');
    redis.get.mockResolvedValue(JSON.stringify({
      id: 'existing_category',
      name: 'Existing Category',
      slug: 'existing-slug',
      siteId: testSiteId
    }));

    // Import the service
    const { CategoryService } = require('@/services/category-service');

    // Create category data with the same slug as an existing category
    const categoryData = {
      name: 'New Category',
      slug: 'existing-slug', // Same slug as existing category
      metaDescription: 'This is a new category',
      tenantId: 'tenant1',
      siteId: testSiteId,
      parentId: null,
    };

    // Call the method and expect it to throw an error
    await expect(CategoryService.createCategory(categoryData))
      .rejects
      .toThrow('A category with this slug already exists');

    // Verify Redis was called to check for existing category
    expect(redis.get).toHaveBeenCalledWith(`test:category:site:${testSiteId}:${categoryData.slug}`);

    // Verify Redis transaction was NOT used
    expect(redis.multi).not.toHaveBeenCalled();
  });
});
