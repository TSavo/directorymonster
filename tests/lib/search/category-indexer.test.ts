/**
 * @jest-environment node
 */
import { CategoryIndexer } from '@/lib/search/category-indexer';
import { searchKeys } from '@/lib/tenant';
import { Category } from '@/types';
import { redis, kv } from '@/lib/redis-client';

// Mock Redis and KV store
jest.mock('../../../src/lib/redis-client', () => ({
  redis: {
    hset: jest.fn().mockResolvedValue(true),
    sadd: jest.fn().mockResolvedValue(true),
    srem: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(true),
    hdel: jest.fn().mockResolvedValue(true),
    smembers: jest.fn().mockResolvedValue([]),
  },
  kv: {
    get: jest.fn().mockResolvedValue(null),
  },
}));

// Mock utility functions
jest.mock('../../../src/lib/search/utils', () => ({
  getIntersection: jest.fn((sets) => sets.length > 0 ? sets[0] : []),
}));

describe('CategoryIndexer', () => {
  let categoryIndexer: CategoryIndexer;
  
  const mockCategory: Category = {
    id: 'cat1',
    name: 'Test Category',
    slug: 'test-category',
    parentId: null,
    siteId: 'site1',
    metaDescription: 'Test category description',
    featuredImage: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    categoryIndexer = new CategoryIndexer();
  });
  
  describe('indexCategory', () => {
    it('adds category to main index and term indices', async () => {
      await categoryIndexer.indexCategory(mockCategory);
      
      // Check if added to main index
      expect(redis.hset).toHaveBeenCalledWith(
        searchKeys.categoryIndex('site1'),
        mockCategory.id,
        expect.any(String) // JSON string
      );
      
      // Check if terms were extracted and added to term indices
      expect(redis.sadd).toHaveBeenCalled();
    });
  });
  
  describe('updateCategory', () => {
    it('removes old terms and re-indexes category', async () => {
      // Setup mock for smembers to return some terms
      (redis.smembers as jest.Mock).mockResolvedValue(['test', 'category']);
      
      await categoryIndexer.updateCategory(mockCategory);
      
      // Should remove old terms
      expect(redis.srem).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
      
      // Should re-index category
      expect(redis.hset).toHaveBeenCalledWith(
        searchKeys.categoryIndex('site1'),
        mockCategory.id,
        expect.any(String)
      );
    });
  });
  
  describe('removeCategory', () => {
    it('removes category from all indices', async () => {
      // Setup mock for smembers to return some terms
      (redis.smembers as jest.Mock).mockResolvedValue(['test', 'category']);
      
      await categoryIndexer.removeCategory('cat1', 'site1');
      
      // Should remove from main index
      expect(redis.hdel).toHaveBeenCalledWith(
        searchKeys.categoryIndex('site1'),
        'cat1'
      );
      
      // Should remove terms
      expect(redis.srem).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });
  });
  
  describe('searchCategories', () => {
    beforeEach(() => {
      // Setup mocks for search
      (redis.smembers as jest.Mock).mockResolvedValue(['cat1', 'cat2']);
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'category:id:cat1') {
          return Promise.resolve({
            ...mockCategory,
            id: 'cat1',
            name: 'Test Category'
          });
        } else if (key === 'category:id:cat2') {
          return Promise.resolve({
            ...mockCategory,
            id: 'cat2',
            name: 'Another Category'
          });
        }
        return Promise.resolve(null);
      });
    });
    
    it('returns empty array for empty query', async () => {
      const results = await categoryIndexer.searchCategories('site1', '');
      expect(results).toEqual([]);
    });
    
    it('returns empty array for too short query', async () => {
      const results = await categoryIndexer.searchCategories('site1', 'ab');
      expect(results).toEqual([]);
    });
    
    it('searches by query terms and returns matching categories', async () => {
      const results = await categoryIndexer.searchCategories('site1', 'test category');
      
      // Should get term matches
      expect(redis.smembers).toHaveBeenCalledWith(
        expect.stringContaining('term:test')
      );
      expect(redis.smembers).toHaveBeenCalledWith(
        expect.stringContaining('term:category')
      );
      
      // Should get categories
      expect(kv.get).toHaveBeenCalledWith('category:id:cat1');
      expect(kv.get).toHaveBeenCalledWith('category:id:cat2');
      
      expect(results.length).toBe(2);
    });
    
    it('sorts results by relevance (name match priority)', async () => {
      // Mock categories with different names
      const catWithExactMatch = {
        ...mockCategory,
        id: 'cat1',
        name: 'Exact Test Match' // Exact match to 'test'
      };
      
      const catWithoutExactMatch = {
        ...mockCategory,
        id: 'cat2',
        name: 'No Exact Testing' // Contains 'test' but not exact
      };
      
      // Override the mock implementation for this specific test
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'category:id:cat1') return Promise.resolve(catWithExactMatch);
        if (key === 'category:id:cat2') return Promise.resolve(catWithoutExactMatch);
        return Promise.resolve(null);
      });
      
      const results = await categoryIndexer.searchCategories('site1', 'test');
      
      // Exact match should be first
      expect(results[0].id).toBe('cat1');
    });
    
    it('returns empty array when no matches found', async () => {
      // Override the mock to return empty results
      (redis.smembers as jest.Mock).mockResolvedValue([]);
      
      const results = await categoryIndexer.searchCategories('site1', 'nonexistent');
      
      expect(results).toEqual([]);
    });
  });
});
