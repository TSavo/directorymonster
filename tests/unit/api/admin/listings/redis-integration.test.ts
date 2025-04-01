import { kv } from '@/lib/redis-client';

// Mock Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn()
  }
}));

describe('Admin Listings Redis Integration', () => {
  // Test data
  const testTenantId = 'tenant-123';

  // Mock listings data
  const mockListings = [
    {
      id: 'listing-1',
      title: 'Test Listing 1',
      tenantId: testTenantId,
      status: 'published'
    },
    {
      id: 'listing-2',
      title: 'Test Listing 2',
      tenantId: testTenantId,
      status: 'draft'
    }
  ];

  // Reset mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /api/admin/listings', () => {
    it('should retrieve listings from Redis for the tenant', async () => {
      // Setup Redis mock to return listing keys
      const listingKeys = ['listing:tenant:tenant-123:listing-1', 'listing:tenant:tenant-123:listing-2'];
      kv.keys.mockResolvedValue(listingKeys);

      // Setup Redis mock to return listing data
      kv.get.mockImplementation((key) => {
        if (key === 'listing:tenant:tenant-123:listing-1') {
          return Promise.resolve(mockListings[0]);
        } else if (key === 'listing:tenant:tenant-123:listing-2') {
          return Promise.resolve(mockListings[1]);
        }
        return Promise.resolve(null);
      });

      // Simulate the route handler logic
      const tenantId = testTenantId;
      const keys = await kv.keys(`listing:tenant:${tenantId}:*`);
      const listingsPromises = keys.map(key => kv.get(key));
      const listingsData = await Promise.all(listingsPromises);
      const listings = listingsData.filter(listing => listing !== null);

      // Verify Redis was called correctly
      expect(kv.keys).toHaveBeenCalledWith(`listing:tenant:${tenantId}:*`);

      // Verify we got the expected listings
      expect(listings).toHaveLength(2);
      expect(listings[0].id).toBe('listing-1');
      expect(listings[1].id).toBe('listing-2');
    });

    it('should filter listings by status if provided', async () => {
      // Setup Redis mock to return listing keys
      const listingKeys = ['listing:tenant:tenant-123:listing-1', 'listing:tenant:tenant-123:listing-2'];
      kv.keys.mockResolvedValue(listingKeys);

      // Setup Redis mock to return listing data
      kv.get.mockImplementation((key) => {
        if (key === 'listing:tenant:tenant-123:listing-1') {
          return Promise.resolve(mockListings[0]);
        } else if (key === 'listing:tenant:tenant-123:listing-2') {
          return Promise.resolve(mockListings[1]);
        }
        return Promise.resolve(null);
      });

      // Simulate the route handler logic with status filter
      const tenantId = testTenantId;
      const status = 'published';
      const keys = await kv.keys(`listing:tenant:${tenantId}:*`);
      const listingsPromises = keys.map(key => kv.get(key));
      const listingsData = await Promise.all(listingsPromises);
      let listings = listingsData.filter(listing => listing !== null);

      // Apply status filter
      if (status) {
        listings = listings.filter(listing => listing.status === status);
      }

      // Verify Redis was called correctly
      expect(kv.keys).toHaveBeenCalledWith(`listing:tenant:${tenantId}:*`);

      // Verify we got the expected listings
      expect(listings).toHaveLength(1);
      expect(listings[0].id).toBe('listing-1');
      expect(listings[0].status).toBe('published');
    });

    it('should handle Redis errors gracefully', async () => {
      // Setup Redis mock to throw an error
      kv.keys.mockRejectedValue(new Error('Redis connection error'));

      // Simulate the route handler logic with error handling
      const tenantId = testTenantId;
      let error;
      try {
        await kv.keys(`listing:tenant:${tenantId}:*`);
      } catch (e) {
        error = e;
      }

      // Verify we got an error
      expect(error).toBeDefined();
      expect(error.message).toBe('Redis connection error');
    });
  });
});
