/**
 * @jest-environment node
 */
import { ListingIndexer } from '../../../src/lib/search/listing-indexer';
import { searchKeys } from '../../../src/lib/tenant';
import { Listing } from '../../../src/types';
import { redis, kv } from '../../../src/lib/redis-client';

// Mock Redis and KV store
jest.mock('../../../src/lib/redis-client', () => ({
  redis: {
    hset: jest.fn().mockResolvedValue(true),
    sadd: jest.fn().mockResolvedValue(true),
    srem: jest.fn().mockResolvedValue(true),
    del: jest.fn().mockResolvedValue(true),
    hdel: jest.fn().mockResolvedValue(true),
    hkeys: jest.fn().mockResolvedValue([]),
    hget: jest.fn().mockResolvedValue(null),
    smembers: jest.fn().mockResolvedValue([]),
  },
  kv: {
    get: jest.fn().mockResolvedValue(null),
  },
}));

// Mock utility functions
jest.mock('../../../src/lib/search/utils', () => ({
  getIntersection: jest.fn((sets) => sets.length > 0 ? sets[0] : []),
  getUnion: jest.fn((sets) => sets.length > 0 ? sets[0] : []),
  calculateSearchScore: jest.fn().mockResolvedValue(10),
}));

describe('ListingIndexer', () => {
  let listingIndexer: ListingIndexer;
  
  const mockListing: Listing = {
    id: 'listing1',
    title: 'Test Listing',
    slug: 'test-listing',
    siteId: 'site1',
    categoryId: 'cat1',
    categorySlug: 'test-category',
    metaDescription: 'Test listing description',
    content: 'Test listing content with keywords',
    backlinkUrl: 'https://example.com',
    backlinkAnchorText: 'Example Link',
    backlinkPosition: 'prominent',
    backlinkType: 'dofollow',
    featured: true,
    status: 'published',
    customFields: {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    listingIndexer = new ListingIndexer();
  });
  
  describe('indexListing', () => {
    it('adds listing to main index and term indices', async () => {
      await listingIndexer.indexListing(mockListing);
      
      // Check if added to main index
      expect(redis.hset).toHaveBeenCalledWith(
        searchKeys.listingIndex('site1'),
        mockListing.id,
        expect.any(String) // JSON string
      );
      
      // Check if terms were extracted and added to term indices
      expect(redis.sadd).toHaveBeenCalled();
      
      // Check if added to category listings set
      expect(redis.sadd).toHaveBeenCalledWith(
        searchKeys.categoryListings('site1', 'cat1'),
        mockListing.id
      );
      
      // Check if added to featured listings set
      expect(redis.sadd).toHaveBeenCalledWith(
        searchKeys.featuredListings('site1'),
        mockListing.id
      );
      
      // Check if added to status listings set
      expect(redis.sadd).toHaveBeenCalledWith(
        searchKeys.statusListings('site1', 'published'),
        mockListing.id
      );
    });
  });
  
  describe('updateListing', () => {
    it('removes old references and re-indexes listing', async () => {
      // Setup mock for hget to return listing data
      (redis.hget as jest.Mock).mockResolvedValue(JSON.stringify({
        id: mockListing.id,
        title: mockListing.title,
        categoryId: mockListing.categoryId,
        featured: mockListing.featured,
        status: mockListing.status
      }));
      
      await listingIndexer.updateListing(mockListing);
      
      // Should remove old terms
      expect(redis.del).toHaveBeenCalled();
      
      // Should re-index listing
      expect(redis.hset).toHaveBeenCalledWith(
        searchKeys.listingIndex('site1'),
        mockListing.id,
        expect.any(String)
      );
    });
  });
  
  describe('removeListing', () => {
    it('removes listing from all indices when siteId provided', async () => {
      // Setup mock for hget
      (redis.hget as jest.Mock).mockResolvedValue(JSON.stringify({
        id: mockListing.id,
        categoryId: mockListing.categoryId,
        featured: mockListing.featured,
        status: mockListing.status
      }));
      
      await listingIndexer.removeListing(mockListing.id, mockListing.siteId);
      
      // Should remove from main index
      expect(redis.hdel).toHaveBeenCalledWith(
        searchKeys.listingIndex('site1'),
        mockListing.id
      );
      
      // Should remove from category listings set
      expect(redis.srem).toHaveBeenCalledWith(
        expect.stringContaining('category'),
        mockListing.id
      );
      
      // Should remove from featured listings set
      expect(redis.srem).toHaveBeenCalledWith(
        expect.stringContaining('featured'),
        mockListing.id
      );
      
      // Should remove terms
      expect(redis.del).toHaveBeenCalled();
    });
    
    it('looks up listing first when siteId not provided', async () => {
      // Setup mock for kv.get
      (kv.get as jest.Mock).mockResolvedValue(mockListing);
      
      await listingIndexer.removeListing(mockListing.id);
      
      // Should look up the listing
      expect(kv.get).toHaveBeenCalledWith(`listing:id:${mockListing.id}`);
      
      // Should remove from indices
      expect(redis.hdel).toHaveBeenCalled();
    });
  });
  
  describe('searchListings', () => {
    beforeEach(() => {
      (redis.smembers as jest.Mock).mockResolvedValue(['listing1', 'listing2']);
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'listing:id:listing1') {
          return Promise.resolve({
            ...mockListing,
            id: 'listing1'
          });
        } else if (key === 'listing:id:listing2') {
          return Promise.resolve({
            ...mockListing,
            id: 'listing2',
            title: 'Second Listing'
          });
        }
        return Promise.resolve(null);
      });
    });
    
    it('searches by query terms', async () => {
      await listingIndexer.searchListings('site1', 'test query', {});
      
      // Should get term matches
      expect(redis.smembers).toHaveBeenCalledWith(
        expect.stringContaining('term:test')
      );
      
      // Should get listings
      expect(kv.get).toHaveBeenCalledWith('listing:id:listing1');
      expect(kv.get).toHaveBeenCalledWith('listing:id:listing2');
    });
    
    it('filters by category', async () => {
      await listingIndexer.searchListings('site1', '', { categoryId: 'cat1' });
      
      // Should get category listings
      expect(redis.smembers).toHaveBeenCalledWith(
        searchKeys.categoryListings('site1', 'cat1')
      );
    });
    
    it('applies featured filter correctly', async () => {
      (redis.smembers as jest.Mock)
        .mockResolvedValueOnce(['listing1', 'listing2', 'listing3'])
        .mockResolvedValueOnce(['listing1', 'listing3']);
      
      await listingIndexer.searchListings('site1', 'test', { featuredOnly: true });
      
      // Should get featured listings
      expect(redis.smembers).toHaveBeenCalledWith(
        searchKeys.featuredListings('site1')
      );
    });
    
    it('applies status filter correctly', async () => {
      (redis.smembers as jest.Mock)
        .mockResolvedValueOnce(['listing1', 'listing2', 'listing3'])
        .mockResolvedValueOnce(['listing1', 'listing2']);
      
      await listingIndexer.searchListings('site1', 'test', { status: 'published' });
      
      // Should get status listings
      expect(redis.smembers).toHaveBeenCalledWith(
        searchKeys.statusListings('site1', 'published')
      );
    });
    
    it('applies pagination correctly', async () => {
      // Create a larger result set
      const listings = Array.from({ length: 20 }, (_, i) => `listing${i + 1}`);
      (redis.smembers as jest.Mock).mockResolvedValue(listings);
      
      const results = await listingIndexer.searchListings('site1', 'test', {
        limit: 5,
        offset: 10
      });
      
      // Should return limited results starting from offset
      expect(results.length).toBeLessThanOrEqual(5);
    });
    
    it('sorts results by different criteria', async () => {
      // Mock listings with different created dates
      const oldListing = {
        ...mockListing,
        id: 'old',
        title: 'AAA Old Listing',
        createdAt: Date.now() - 10000
      };
      
      const newListing = {
        ...mockListing,
        id: 'new',
        title: 'ZZZ New Listing',
        createdAt: Date.now()
      };
      
      (redis.smembers as jest.Mock).mockResolvedValue(['old', 'new']);
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'listing:id:old') return Promise.resolve(oldListing);
        if (key === 'listing:id:new') return Promise.resolve(newListing);
        return Promise.resolve(null);
      });
      
      // Test newest first sorting
      const newestResults = await listingIndexer.searchListings('site1', '', {
        sortBy: 'newest'
      });
      
      expect(newestResults[0].id).toBe('new');
      
      // Test title sorting
      const titleResults = await listingIndexer.searchListings('site1', '', {
        sortBy: 'title_asc'
      });
      
      expect(titleResults[0].id).toBe('old');
    });
  });
  
  describe('countSearchResults', () => {
    it('counts results with filters', async () => {
      (redis.smembers as jest.Mock)
        .mockResolvedValueOnce(['listing1', 'listing2', 'listing3'])
        .mockResolvedValueOnce(['listing1', 'listing3']);
      
      const count = await listingIndexer.countSearchResults('site1', 'test', {
        categoryId: 'cat1',
        featuredOnly: true
      });
      
      expect(count).toBe(2);
      
      // Should get category listings
      expect(redis.smembers).toHaveBeenCalledWith(
        expect.stringContaining('category')
      );
      
      // Should get featured listings
      expect(redis.smembers).toHaveBeenCalledWith(
        expect.stringContaining('featured')
      );
    });
  });
});
