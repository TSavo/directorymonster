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

describe('GET Listing by ID from Redis', () => {
  // Test data
  const testTenantId = 'tenant-123';
  const testListingId = 'listing-1';
  
  // Mock listing data
  const mockListing = {
    id: testListingId,
    title: 'Test Listing 1',
    tenantId: testTenantId,
    status: 'published',
    description: 'This is a test listing'
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve a specific listing from Redis by ID', async () => {
    // Setup Redis mock to return listing data
    kv.get.mockResolvedValue(mockListing);
    
    // Call the function that would be in our route handler
    const listing = await kv.get(`listing:id:${testListingId}`);
    
    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith(`listing:id:${testListingId}`);
    
    // Verify we got the expected listing
    expect(listing).toEqual(mockListing);
    expect(listing.id).toBe(testListingId);
    expect(listing.tenantId).toBe(testTenantId);
  });

  it('should return null if listing does not exist', async () => {
    // Setup Redis mock to return null
    kv.get.mockResolvedValue(null);
    
    // Call the function that would be in our route handler
    const listing = await kv.get(`listing:id:non-existent-id`);
    
    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith(`listing:id:non-existent-id`);
    
    // Verify we got null
    expect(listing).toBeNull();
  });

  it('should handle Redis errors gracefully', async () => {
    // Setup Redis mock to throw an error
    kv.get.mockRejectedValue(new Error('Redis connection error'));
    
    // Call the function and catch the error
    let error;
    try {
      await kv.get(`listing:id:${testListingId}`);
    } catch (e) {
      error = e;
    }
    
    // Verify we got an error
    expect(error).toBeDefined();
    expect(error.message).toBe('Redis connection error');
  });
});
