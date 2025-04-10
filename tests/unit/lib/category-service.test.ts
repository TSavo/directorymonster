import { CategoryService } from '@/lib/category-service';
import { kv } from '@/lib/redis-client';
import { Category } from '@/types';

// Mock Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(),
  }
}));

describe('CategoryService', () => {
  let mockGet: jest.Mock;
  let mockSet: jest.Mock;
  let mockDel: jest.Mock;
  let mockKeys: jest.Mock;

  beforeEach(() => {
    // Get fresh mocks for each test
    mockGet = kv.get as jest.Mock;
    mockSet = kv.set as jest.Mock;
    mockDel = kv.del as jest.Mock;
    mockKeys = kv.keys as jest.Mock;

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('getCategoryWithValidation', () => {
    it('should return null when category does not exist', async () => {
      // Mock implementation to simulate category not found
      mockGet.mockResolvedValue(null);

      // Call the service method
      const result = await CategoryService.getCategoryWithValidation('non-existent-id', 'test-tenant', 'test-site');

      // Verify the result
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('category:id:non-existent-id');
    });

    it('should return null when category belongs to a different tenant', async () => {
      // Mock implementation to simulate category from different tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'different-tenant', // Different from the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockGet.mockResolvedValue(mockCategory);

      // Call the service method
      const result = await CategoryService.getCategoryWithValidation('test-category-id', 'test-tenant', 'test-site');

      // Verify the result
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
    });

    it('should return null when category belongs to a different site', async () => {
      // Mock implementation to simulate category from different site
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'different-site', // Different from the request site
        tenantId: 'test-tenant',
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockGet.mockResolvedValue(mockCategory);

      // Call the service method
      const result = await CategoryService.getCategoryWithValidation('test-category-id', 'test-tenant', 'test-site');

      // Verify the result
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
    });

    it('should return the category when it belongs to the correct tenant and site', async () => {
      // Mock implementation to simulate category from the correct tenant and site
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site', // Same as the request site
        tenantId: 'test-tenant', // Same as the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockGet.mockResolvedValue(mockCategory);

      // Call the service method
      const result = await CategoryService.getCategoryWithValidation('test-category-id', 'test-tenant', 'test-site');

      // Verify the result
      expect(result).toEqual(mockCategory);
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
    });
  });

  describe('getCategoriesBySite', () => {
    it('should return only categories belonging to the specified tenant and site', async () => {
      // Mock implementation to simulate multiple categories
      mockKeys.mockResolvedValue(['category:site:test-site:category-1', 'category:site:test-site:category-2', 'category:site:test-site:category-3']);

      const mockCategories = [
        {
          id: '1',
          siteId: 'test-site',
          tenantId: 'test-tenant', // Matches
          name: 'Category 1',
          slug: 'category-1',
          metaDescription: 'Description 1',
          order: 1,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: '2',
          siteId: 'test-site',
          tenantId: 'different-tenant', // Doesn't match tenant
          name: 'Category 2',
          slug: 'category-2',
          metaDescription: 'Description 2',
          order: 2,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: '3',
          siteId: 'test-site',
          tenantId: 'test-tenant', // Matches
          name: 'Category 3',
          slug: 'category-3',
          metaDescription: 'Description 3',
          order: 3,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ];

      // Mock get to return different categories based on the key
      mockGet.mockImplementation((key) => {
        if (key === 'category:site:test-site:category-1') return mockCategories[0];
        if (key === 'category:site:test-site:category-2') return mockCategories[1];
        if (key === 'category:site:test-site:category-3') return mockCategories[2];
        return null;
      });

      // Call the service method
      const result = await CategoryService.getCategoriesBySite('test-tenant', 'test-site');

      // Verify the result - should only include categories with matching tenant and site
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockCategories[0]);
      expect(result).toContainEqual(mockCategories[2]);
      expect(result).not.toContainEqual(mockCategories[1]);

      // Verify the Redis calls
      expect(mockKeys).toHaveBeenCalledWith('category:site:test-site:*');
      expect(mockGet).toHaveBeenCalledTimes(3);
    });
  });

  describe('updateCategory', () => {
    it('should return null when category does not exist', async () => {
      // Mock implementation to simulate category not found
      mockGet.mockResolvedValue(null);

      // Call the service method
      const result = await CategoryService.updateCategory(
        'non-existent-id',
        'test-tenant',
        'test-site',
        { name: 'Updated Name' }
      );

      // Verify the result
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('category:id:non-existent-id');
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should return null when category belongs to a different tenant or site', async () => {
      // Mock implementation to simulate category from different tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'different-tenant', // Different from the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockGet.mockResolvedValue(mockCategory);

      // Call the service method
      const result = await CategoryService.updateCategory(
        'test-category-id',
        'test-tenant',
        'test-site',
        { name: 'Updated Name' }
      );

      // Verify the result
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should update the category when it belongs to the correct tenant and site', async () => {
      // Mock implementation to simulate category from the correct tenant and site
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant', // Same as the request tenant and site
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: 123456789,
        updatedAt: 123456789
      };

      mockGet.mockResolvedValue(mockCategory);
      mockSet.mockResolvedValue(undefined);

      const updateData = { name: 'Updated Name' };

      // Call the service method
      const result = await CategoryService.updateCategory(
        'test-category-id',
        'test-tenant',
        'test-site',
        updateData
      );

      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
      expect(result?.tenantId).toBe('test-tenant'); // Tenant ID should remain the same
      expect(result?.siteId).toBe('test-site'); // Site ID should remain the same
      expect(result?.updatedAt).not.toBe(123456789); // Updated timestamp

      // Verify the Redis calls
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockSet).toHaveBeenCalledTimes(2); // Once for the main key, once for the site-specific key
    });

    it('should detect and prevent circular references when updating parent', async () => {
      // Setup: Category exists and we're trying to set a parent that would create a cycle
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Test Category',
        slug: 'test-category',
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockParentCategory: Category = {
        id: 'parent-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Parent Category',
        slug: 'parent-category',
        parentId: 'test-category-id', // This would create a cycle: child -> parent -> child
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Mock the category lookup
      mockGet.mockImplementation((key) => {
        if (key === 'category:id:test-category-id') return mockCategory;
        if (key === 'category:id:parent-category-id') return mockParentCategory;
        return null;
      });

      // Call the service method
      const result = await CategoryService.updateCategory(
        'test-category-id',
        'test-tenant',
        'test-site',
        { parentId: 'parent-category-id' }
      );

      // Verify the result
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('error', 'This would create a circular reference in the category hierarchy');

      // Verify Redis calls
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockGet).toHaveBeenCalledWith('category:id:parent-category-id');
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should validate that parent category belongs to the same site', async () => {
      // Setup: Category exists but parent is from a different site
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Test Category',
        slug: 'test-category',
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockParentCategory: Category = {
        id: 'parent-category-id',
        siteId: 'different-site', // Different site
        tenantId: 'test-tenant',
        name: 'Parent Category',
        slug: 'parent-category',
        parentId: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Mock the category lookup
      mockGet.mockImplementation((key) => {
        if (key === 'category:id:test-category-id') return mockCategory;
        if (key === 'category:id:parent-category-id') return mockParentCategory;
        return null;
      });

      // Call the service method
      const result = await CategoryService.updateCategory(
        'test-category-id',
        'test-tenant',
        'test-site',
        { parentId: 'parent-category-id' }
      );

      // Verify the result
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('error', 'Parent category must belong to the same site');

      // Verify Redis calls
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockGet).toHaveBeenCalledWith('category:id:parent-category-id');
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('should return false when category does not exist', async () => {
      // Mock implementation to simulate category not found
      mockGet.mockResolvedValue(null);

      // Call the service method
      const result = await CategoryService.deleteCategory(
        'non-existent-id',
        'test-tenant',
        'test-site'
      );

      // Verify the result
      expect(result).toBe(false);
      expect(mockGet).toHaveBeenCalledWith('category:id:non-existent-id');
      expect(mockDel).not.toHaveBeenCalled();
    });

    it('should return false when category belongs to a different tenant or site', async () => {
      // Mock implementation to simulate category from different tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'different-tenant', // Different from the request tenant
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockGet.mockResolvedValue(mockCategory);

      // Call the service method
      const result = await CategoryService.deleteCategory(
        'test-category-id',
        'test-tenant',
        'test-site'
      );

      // Verify the result
      expect(result).toBe(false);
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockDel).not.toHaveBeenCalled();
    });

    it('should delete the category when it belongs to the correct tenant and site and has no children', async () => {
      // Mock implementation to simulate category from the correct tenant and site
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant', // Same as the request tenant and site
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockGet.mockResolvedValue(mockCategory);
      mockDel.mockResolvedValue(1);

      // Mock getChildCategories to return empty array (no children)
      jest.spyOn(CategoryService, 'getChildCategories').mockResolvedValue([]);

      // Call the service method
      const result = await CategoryService.deleteCategory(
        'test-category-id',
        'test-tenant',
        'test-site'
      );

      // Verify the result
      expect(result).toBe(true);

      // Verify Redis calls
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockDel).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockDel).toHaveBeenCalledWith('category:site:test-site:test-category');
    });

    it('should prevent deletion of categories with children', async () => {
      // Mock implementation to simulate category with children
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockChildCategory: Category = {
        id: 'child-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Child Category',
        slug: 'child-category',
        parentId: 'test-category-id',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockGet.mockResolvedValue(mockCategory);

      // Mock getChildCategories to return a child
      jest.spyOn(CategoryService, 'getChildCategories').mockResolvedValue([mockChildCategory]);

      // Call the service method
      const result = await CategoryService.deleteCategory(
        'test-category-id',
        'test-tenant',
        'test-site'
      );

      // Verify the result
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('error', 'Cannot delete a category with child categories');
      expect(result).toHaveProperty('childCategories');
      expect(Array.isArray((result as any).childCategories)).toBe(true);
      expect((result as any).childCategories.length).toBe(1);
      expect((result as any).childCategories[0]).toHaveProperty('id', 'child-category-id');

      // Verify Redis calls
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockDel).not.toHaveBeenCalled();
    });
  });

  describe('createCategory', () => {
    it('should create a category with the required site ID', async () => {
      // Mock Redis set operation
      mockSet.mockResolvedValue('OK');

      // Call the method
      const result = await CategoryService.createCategory(
        {
          name: 'New Category',
          slug: 'new-category'
        },
        'test-tenant',
        'test-site'
      );

      // Verify the result
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'New Category');
      expect(result).toHaveProperty('slug', 'new-category');
      expect(result).toHaveProperty('tenantId', 'test-tenant');
      expect(result).toHaveProperty('siteId', 'test-site');

      // Verify Redis calls
      expect(mockSet).toHaveBeenCalledTimes(2);
    });

    it('should validate parent category exists and belongs to the same site', async () => {
      // Setup: Parent category exists in the same site
      const mockParentCategory: Category = {
        id: 'parent-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Parent Category',
        slug: 'parent-category',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockGet.mockResolvedValue(mockParentCategory);
      mockSet.mockResolvedValue('OK');

      // Call the method
      const result = await CategoryService.createCategory(
        {
          name: 'Child Category',
          slug: 'child-category',
          parentId: 'parent-category-id'
        },
        'test-tenant',
        'test-site'
      );

      // Verify the result
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('parentId', 'parent-category-id');

      // Verify Redis calls
      expect(mockGet).toHaveBeenCalledWith('category:id:parent-category-id');
      expect(mockSet).toHaveBeenCalledTimes(2);
    });

    it('should return error when parent category does not exist', async () => {
      // Setup: Parent category does not exist
      mockGet.mockResolvedValue(null);

      // Call the method
      const result = await CategoryService.createCategory(
        {
          name: 'Child Category',
          slug: 'child-category',
          parentId: 'non-existent-parent'
        },
        'test-tenant',
        'test-site'
      );

      // Verify the result
      expect(result).toHaveProperty('error', 'Parent category not found');

      // Verify Redis calls
      expect(mockGet).toHaveBeenCalledWith('category:id:non-existent-parent');
      expect(mockSet).not.toHaveBeenCalled();
    });

    it('should return error when parent category belongs to a different site', async () => {
      // Setup: Parent category exists but in a different site
      const mockParentCategory: Category = {
        id: 'parent-category-id',
        siteId: 'different-site',
        tenantId: 'test-tenant',
        name: 'Parent Category',
        slug: 'parent-category',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      mockGet.mockResolvedValue(mockParentCategory);

      // Call the method
      const result = await CategoryService.createCategory(
        {
          name: 'Child Category',
          slug: 'child-category',
          parentId: 'parent-category-id'
        },
        'test-tenant',
        'test-site'
      );

      // Verify the result
      expect(result).toHaveProperty('error', 'Parent category must belong to the same site');

      // Verify Redis calls
      expect(mockGet).toHaveBeenCalledWith('category:id:parent-category-id');
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe('wouldCreateCircularReference', () => {
    it('should return true when a category tries to set itself as parent', async () => {
      // Call the method with the same ID for category and parent
      const result = await CategoryService.wouldCreateCircularReference(
        'test-category-id',
        'test-category-id'
      );

      // Verify the result
      expect(result).toBe(true);
    });

    it('should return true when a circular reference would be created', async () => {
      // Setup: Child -> Parent -> Grandparent -> Child (circular)
      const mockParentCategory: Category = {
        id: 'parent-category-id',
        parentId: 'grandparent-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Parent Category',
        slug: 'parent-category',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockGrandparentCategory: Category = {
        id: 'grandparent-category-id',
        parentId: 'test-category-id', // This creates the cycle
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Grandparent Category',
        slug: 'grandparent-category',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Mock Redis responses for parent lookup
      mockGet.mockImplementation((key) => {
        if (key === 'category:id:parent-category-id') return mockParentCategory;
        if (key === 'category:id:grandparent-category-id') return mockGrandparentCategory;
        return null;
      });

      // Call the method
      const result = await CategoryService.wouldCreateCircularReference(
        'test-category-id',
        'parent-category-id'
      );

      // Verify the result
      expect(result).toBe(true);
    });

    it('should return false when no circular reference would be created', async () => {
      // Setup: Child -> Parent -> Grandparent (no circular reference)
      const mockParentCategory: Category = {
        id: 'parent-category-id',
        parentId: 'grandparent-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Parent Category',
        slug: 'parent-category',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const mockGrandparentCategory: Category = {
        id: 'grandparent-category-id',
        parentId: null, // No parent, so no cycle
        siteId: 'test-site',
        tenantId: 'test-tenant',
        name: 'Grandparent Category',
        slug: 'grandparent-category',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Mock Redis responses for parent lookup
      mockGet.mockImplementation((key) => {
        if (key === 'category:id:parent-category-id') return mockParentCategory;
        if (key === 'category:id:grandparent-category-id') return mockGrandparentCategory;
        return null;
      });

      // Call the method
      const result = await CategoryService.wouldCreateCircularReference(
        'test-category-id',
        'parent-category-id'
      );

      // Verify the result
      expect(result).toBe(false);
    });
  });
});
