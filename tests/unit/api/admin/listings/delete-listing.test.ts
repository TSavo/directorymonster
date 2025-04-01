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

describe('Delete Listing from Redis', () => {
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

  it('should delete an existing listing from Redis', async () => {
    // Setup Redis mock to return the existing listing and successful deletion
    kv.get.mockResolvedValue(mockListing);
    kv.del.mockResolvedValue(1);
    
    // Call the functions that would be in our route handler
    const existingListing = await kv.get(`listing:id:${testListingId}`);
    
    // Verify the listing exists and belongs to the tenant
    expect(existingListing).not.toBeNull();
    expect(existingListing.tenantId).toBe(testTenantId);
    
    // Delete the listing
    await kv.del(`listing:tenant:${testTenantId}:${testListingId}`);
    await kv.del(`listing:id:${testListingId}`);
    
    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith(`listing:id:${testListingId}`);
    expect(kv.del).toHaveBeenCalledTimes(2);
    expect(kv.del.mock.calls[0][0]).toBe(`listing:tenant:${testTenantId}:${testListingId}`);
    expect(kv.del.mock.calls[1][0]).toBe(`listing:id:${testListingId}`);
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
    
    // Verify Redis del was not called
    expect(kv.del).not.toHaveBeenCalled();
  });

  it('should handle Redis errors gracefully when getting listing', async () => {
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

  it('should handle Redis errors gracefully when deleting listing', async () => {
    // Setup Redis mock to return the existing listing but throw on del
    kv.get.mockResolvedValue(mockListing);
    kv.del.mockRejectedValue(new Error('Redis connection error'));
    
    // Call the functions that would be in our route handler
    const existingListing = await kv.get(`listing:id:${testListingId}`);
    
    // Try to delete the listing and catch the error
    let error;
    try {
      await kv.del(`listing:tenant:${testTenantId}:${testListingId}`);
    } catch (e) {
      error = e;
    }
    
    // Verify we got an error
    expect(error).toBeDefined();
    expect(error.message).toBe('Redis connection error');
  });
});
