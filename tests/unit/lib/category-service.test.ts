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
  
  describe('getCategoryWithTenantValidation', () => {
    it('should return null when category does not exist', async () => {
      // Mock implementation to simulate category not found
      mockGet.mockResolvedValue(null);
      
      // Call the service method
      const result = await CategoryService.getCategoryWithTenantValidation('non-existent-id', 'test-tenant');
      
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
      const result = await CategoryService.getCategoryWithTenantValidation('test-category-id', 'test-tenant');
      
      // Verify the result
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
    });
    
    it('should return the category when it belongs to the correct tenant', async () => {
      // Mock implementation to simulate category from the correct tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
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
      const result = await CategoryService.getCategoryWithTenantValidation('test-category-id', 'test-tenant');
      
      // Verify the result
      expect(result).toEqual(mockCategory);
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
    });
  });
  
  describe('getCategoriesByTenant', () => {
    it('should return only categories belonging to the specified tenant', async () => {
      // Mock implementation to simulate multiple categories
      mockKeys.mockResolvedValue(['category:id:1', 'category:id:2', 'category:id:3']);
      
      const mockCategories = [
        {
          id: '1',
          siteId: 'site1',
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
          siteId: 'site1',
          tenantId: 'different-tenant', // Doesn't match
          name: 'Category 2',
          slug: 'category-2',
          metaDescription: 'Description 2',
          order: 2,
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          id: '3',
          siteId: 'site2',
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
        if (key === 'category:id:1') return mockCategories[0];
        if (key === 'category:id:2') return mockCategories[1];
        if (key === 'category:id:3') return mockCategories[2];
        return null;
      });
      
      // Call the service method
      const result = await CategoryService.getCategoriesByTenant('test-tenant');
      
      // Verify the result - should only include categories with matching tenant
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(mockCategories[0]);
      expect(result).toContainEqual(mockCategories[2]);
      expect(result).not.toContainEqual(mockCategories[1]);
      
      // Verify the Redis calls
      expect(mockKeys).toHaveBeenCalledWith('category:id:*');
      expect(mockGet).toHaveBeenCalledTimes(3);
    });
  });
  
  describe('updateCategoryWithTenantValidation', () => {
    it('should return null when category does not exist', async () => {
      // Mock implementation to simulate category not found
      mockGet.mockResolvedValue(null);
      
      // Call the service method
      const result = await CategoryService.updateCategoryWithTenantValidation(
        'non-existent-id',
        'test-tenant',
        { name: 'Updated Name' }
      );
      
      // Verify the result
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('category:id:non-existent-id');
      expect(mockSet).not.toHaveBeenCalled();
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
      const result = await CategoryService.updateCategoryWithTenantValidation(
        'test-category-id',
        'test-tenant',
        { name: 'Updated Name' }
      );
      
      // Verify the result
      expect(result).toBeNull();
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockSet).not.toHaveBeenCalled();
    });
    
    it('should update the category when it belongs to the correct tenant', async () => {
      // Mock implementation to simulate category from the correct tenant
      const mockCategory: Category = {
        id: 'test-category-id',
        siteId: 'test-site',
        tenantId: 'test-tenant', // Same as the request tenant
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
      const result = await CategoryService.updateCategoryWithTenantValidation(
        'test-category-id',
        'test-tenant',
        updateData
      );
      
      // Verify the result
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Updated Name');
      expect(result?.tenantId).toBe('test-tenant'); // Tenant ID should remain the same
      expect(result?.updatedAt).not.toBe(123456789); // Updated timestamp
      
      // Verify the Redis calls
      expect(mockGet).toHaveBeenCalledWith('category:id:test-category-id');
      expect(mockSet).toHaveBeenCalledTimes(2); // Once for the main key, once for the tenant-specific key
    });
  });
});
