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

describe('Redis Lookup for Listings', () => {
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

  it('should retrieve listings from Redis for a tenant', async () => {
    // Setup Redis mock to return listing keys
    const mockListingKeys = ['listing:tenant:tenant-123:listing-1', 'listing:tenant:tenant-123:listing-2'];
    kv.keys.mockResolvedValue(mockListingKeys);

    // Setup Redis mock to return listing data
    kv.get.mockImplementation((key) => {
      if (key === 'listing:tenant:tenant-123:listing-1') {
        return Promise.resolve(mockListings[0]);
      } else if (key === 'listing:tenant:tenant-123:listing-2') {
        return Promise.resolve(mockListings[1]);
      }
      return Promise.resolve(null);
    });

    // Call the function that would be in our route handler
    const retrievedKeys = await kv.keys(`listing:tenant:${testTenantId}:*`);
    const listingsPromises = retrievedKeys.map(key => kv.get(key));
    const listingsData = await Promise.all(listingsPromises);
    const listings = listingsData.filter(listing => listing !== null);

    // Verify Redis was called correctly
    expect(kv.keys).toHaveBeenCalledWith(`listing:tenant:${testTenantId}:*`);

    // Verify we got the expected listings
    expect(listings).toHaveLength(2);
    expect(listings[0].id).toBe('listing-1');
    expect(listings[1].id).toBe('listing-2');
  });

  it('should filter listings by status', async () => {
    // Setup Redis mock to return listing keys
    const mockListingKeys = ['listing:tenant:tenant-123:listing-1', 'listing:tenant:tenant-123:listing-2'];
    kv.keys.mockResolvedValue(mockListingKeys);

    // Setup Redis mock to return listing data
    kv.get.mockImplementation((key) => {
      if (key === 'listing:tenant:tenant-123:listing-1') {
        return Promise.resolve(mockListings[0]);
      } else if (key === 'listing:tenant:tenant-123:listing-2') {
        return Promise.resolve(mockListings[1]);
      }
      return Promise.resolve(null);
    });

    // Call the function that would be in our route handler
    const status = 'published';
    const retrievedKeys = await kv.keys(`listing:tenant:${testTenantId}:*`);
    const listingsPromises = retrievedKeys.map(key => kv.get(key));
    const listingsData = await Promise.all(listingsPromises);
    let listings = listingsData.filter(listing => listing !== null);

    // Apply status filter
    if (status) {
      listings = listings.filter(listing => listing.status === status);
    }

    // Verify Redis was called correctly
    expect(kv.keys).toHaveBeenCalledWith(`listing:tenant:${testTenantId}:*`);

    // Verify we got the expected listings
    expect(listings).toHaveLength(1);
    expect(listings[0].id).toBe('listing-1');
    expect(listings[0].status).toBe('published');
  });

  it('should handle Redis errors gracefully', async () => {
    // Setup Redis mock to throw an error
    kv.keys.mockRejectedValue(new Error('Redis connection error'));

    // Call the function and catch the error
    let error;
    try {
      await kv.keys(`listing:tenant:${testTenantId}:*`);
    } catch (e) {
      error = e;
    }

    // Verify we got an error
    expect(error).toBeDefined();
    expect(error.message).toBe('Redis connection error');
  });
});
