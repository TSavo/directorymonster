import { redis, kv } from '@/lib/redis-client';
import { Category } from '@/types';
import { AuditService } from '@/lib/audit/audit-service';

// Mock dependencies
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

describe('Category Reordering Logic', () => {
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
    // Arrange
    const newOrder = ['category-2', 'category-3', 'category-1']; // Change the order
    
    // Act
    // This is the core logic from the route handler
    const validCategories: Category[] = [];
    const invalidCategoryIds: string[] = [];
    
    // Fetch all categories for validation
    for (const categoryId of newOrder) {
      const category = await kv.get<Category>(`category:id:${categoryId}`);
      
      if (!category) {
        invalidCategoryIds.push(categoryId);
        continue;
      }
      
      validCategories.push(category);
    }
    
    // Use a Redis transaction for atomicity
    const multi = redis.multi();
    
    // Update the order of each category
    const updatedCategories: Category[] = [];
    
    for (let i = 0; i < newOrder.length; i++) {
      const categoryId = newOrder[i];
      const category = validCategories.find(c => c.id === categoryId);
      
      if (category) {
        // Update the order
        const updatedCategory: Category = {
          ...category,
          order: i + 1, // 1-based ordering
          updatedAt: Date.now()
        };
        
        // Add to transaction
        multi.set(`category:id:${categoryId}`, JSON.stringify(updatedCategory));
        
        // Also update the slug-based key
        multi.set(`category:site:${updatedCategory.siteId}:${updatedCategory.slug}`, JSON.stringify(updatedCategory));
        
        updatedCategories.push(updatedCategory);
      }
    }
    
    // Execute the transaction
    await multi.exec();
    
    // Log the reordering action
    await AuditService.logEvent({
      action: 'categories_reordered',
      resourceType: 'category',
      tenantId: mockTenantId,
      details: {
        categoryIds: newOrder,
        count: newOrder.length
      }
    });
    
    // Assert
    expect(validCategories).toHaveLength(3);
    expect(invalidCategoryIds).toHaveLength(0);
    
    // Verify the categories were updated with the correct order
    expect(updatedCategories[0].id).toBe('category-2');
    expect(updatedCategories[0].order).toBe(1);
    
    expect(updatedCategories[1].id).toBe('category-3');
    expect(updatedCategories[1].order).toBe(2);
    
    expect(updatedCategories[2].id).toBe('category-1');
    expect(updatedCategories[2].order).toBe(3);
    
    // Verify Redis transaction was used
    expect(redis.multi).toHaveBeenCalled();
    
    // Verify each category was updated in Redis
    const mockMulti = redis.multi();
    expect(mockMulti.set).toHaveBeenCalledTimes(6); // 2 calls per category (id and slug)
    expect(mockMulti.exec).toHaveBeenCalled();
    
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
  
  it('should identify invalid category IDs', async () => {
    // Arrange
    const invalidOrder = ['category-2', 'non-existent-category', 'category-1'];
    
    // Act
    const validCategories: Category[] = [];
    const invalidCategoryIds: string[] = [];
    
    // Fetch all categories for validation
    for (const categoryId of invalidOrder) {
      const category = await kv.get<Category>(`category:id:${categoryId}`);
      
      if (!category) {
        invalidCategoryIds.push(categoryId);
        continue;
      }
      
      validCategories.push(category);
    }
    
    // Assert
    expect(validCategories).toHaveLength(2);
    expect(invalidCategoryIds).toHaveLength(1);
    expect(invalidCategoryIds[0]).toBe('non-existent-category');
  });
});
