/**
 * @jest-environment node
 */
import { getIntersection, getUnion, calculateSearchScore } from '../../../src/lib/search/utils';
import { redis } from '../../../src/lib/redis-client';
import { searchKeys } from '../../../src/lib/tenant';

// Mock the Redis client
jest.mock('../../../src/lib/redis-client', () => ({
  redis: {
    hget: jest.fn(),
  },
}));

// Mock the searchKeys
jest.mock('../../../src/lib/tenant', () => ({
  searchKeys: {
    listingIndex: jest.fn((siteId) => `search:site:${siteId}:listings`),
  },
}));

describe('Search Utility Functions', () => {
  describe('getIntersection', () => {
    it('returns empty array for empty input', () => {
      expect(getIntersection([])).toEqual([]);
    });

    it('returns the single array if only one provided', () => {
      const array = ['a', 'b', 'c'];
      expect(getIntersection([array])).toEqual(array);
    });

    it('returns intersection of multiple arrays', () => {
      const arrays = [
        ['a', 'b', 'c', 'd'],
        ['b', 'c', 'e', 'f'],
        ['c', 'b', 'g']
      ];
      // Intersection should be 'b' and 'c', but order should match first array
      expect(getIntersection(arrays).sort()).toEqual(['b', 'c'].sort());
    });

    it('returns empty array if no common elements', () => {
      const arrays = [
        ['a', 'b', 'c'],
        ['d', 'e', 'f'],
        ['g', 'h', 'i']
      ];
      expect(getIntersection(arrays)).toEqual([]);
    });
  });

  describe('getUnion', () => {
    it('returns empty array for empty input', () => {
      expect(getUnion([])).toEqual([]);
    });

    it('returns the single array if only one provided', () => {
      const array = ['a', 'b', 'c'];
      expect(getUnion([array])).toEqual(array);
    });

    it('returns union of multiple arrays without duplicates', () => {
      const arrays = [
        ['a', 'b', 'c'],
        ['b', 'c', 'd'],
        ['c', 'd', 'e']
      ];
      // Union should contain all unique elements
      expect(getUnion(arrays).sort()).toEqual(['a', 'b', 'c', 'd', 'e'].sort());
    });
  });

  describe('calculateSearchScore', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('returns 0 if listing data not found', async () => {
      (redis.hget as jest.Mock).mockResolvedValue(null);
      
      const score = await calculateSearchScore('listing1', ['test'], 'site1');
      
      expect(score).toBe(0);
      expect(redis.hget).toHaveBeenCalledWith(
        searchKeys.listingIndex('site1'),
        'listing1'
      );
    });

    it('scores title matches higher than description or content', async () => {
      const mockListingData = JSON.stringify({
        id: 'listing1',
        title: 'test title',
        description: 'some description',
        content: 'content without match',
        createdAt: Date.now(),
        featured: false
      });
      
      (redis.hget as jest.Mock).mockResolvedValue(mockListingData);
      
      const score = await calculateSearchScore('listing1', ['test'], 'site1');
      
      // Title match should give higher score
      expect(score).toBeGreaterThan(0);
    });

    it('adds recency bonus to newer listings', async () => {
      const now = Date.now();
      
      // Newer listing (created 1 day ago)
      const newListingData = JSON.stringify({
        id: 'new-listing',
        title: 'test',
        description: 'test',
        content: 'test',
        createdAt: now - 86400000, // 1 day ago
        featured: false
      });
      
      // Older listing (created 180 days ago)
      const oldListingData = JSON.stringify({
        id: 'old-listing',
        title: 'test',
        description: 'test',
        content: 'test',
        createdAt: now - (86400000 * 180), // 180 days ago
        featured: false
      });
      
      (redis.hget as jest.Mock).mockResolvedValueOnce(newListingData);
      const newScore = await calculateSearchScore('new-listing', ['test'], 'site1');
      
      (redis.hget as jest.Mock).mockResolvedValueOnce(oldListingData);
      const oldScore = await calculateSearchScore('old-listing', ['test'], 'site1');
      
      // Newer listing should have higher score
      expect(newScore).toBeGreaterThan(oldScore);
    });

    it('adds score bonus for featured listings', async () => {
      // Featured listing
      const featuredListingData = JSON.stringify({
        id: 'featured-listing',
        title: 'test',
        description: 'test',
        content: 'test',
        createdAt: Date.now(),
        featured: true
      });
      
      // Non-featured listing
      const regularListingData = JSON.stringify({
        id: 'regular-listing',
        title: 'test',
        description: 'test',
        content: 'test',
        createdAt: Date.now(),
        featured: false
      });
      
      (redis.hget as jest.Mock).mockResolvedValueOnce(featuredListingData);
      const featuredScore = await calculateSearchScore('featured-listing', ['test'], 'site1');
      
      (redis.hget as jest.Mock).mockResolvedValueOnce(regularListingData);
      const regularScore = await calculateSearchScore('regular-listing', ['test'], 'site1');
      
      // Featured listing should have higher score
      expect(featuredScore).toBeGreaterThan(regularScore);
    });
  });
});
