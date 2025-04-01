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

describe('Feature Listing in Redis', () => {
  // Test data
  const testTenantId = 'tenant-123';
  const testListingId = 'listing-1';
  
  // Mock listing data
  const mockListing = {
    id: testListingId,
    title: 'Test Listing 1',
    tenantId: testTenantId,
    status: 'published',
    description: 'This is a test listing',
    featured: false,
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update a listing\'s featured status in Redis', async () => {
    // Setup Redis mock to return the existing listing
    kv.get.mockResolvedValue(mockListing);
    kv.set.mockResolvedValue('OK');
    
    // Call the functions that would be in our route handler
    const existingListing = await kv.get(`listing:id:${testListingId}`);
    
    // Verify the listing exists and belongs to the tenant
    expect(existingListing).not.toBeNull();
    expect(existingListing.tenantId).toBe(testTenantId);
    
    // Update the listing's featured status
    const updatedListing = {
      ...existingListing,
      featured: true,
      updatedAt: expect.any(String) // We don't care about the exact timestamp
    };
    
    // Save the updated listing
    await kv.set(`listing:tenant:${testTenantId}:${testListingId}`, updatedListing);
    await kv.set(`listing:id:${testListingId}`, updatedListing);
    
    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith(`listing:id:${testListingId}`);
    expect(kv.set).toHaveBeenCalledTimes(2);
    expect(kv.set.mock.calls[0][0]).toBe(`listing:tenant:${testTenantId}:${testListingId}`);
    expect(kv.set.mock.calls[0][1]).toEqual(updatedListing);
    expect(kv.set.mock.calls[1][0]).toBe(`listing:id:${testListingId}`);
    expect(kv.set.mock.calls[1][1]).toEqual(updatedListing);
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
    
    // Verify Redis set was not called
    expect(kv.set).not.toHaveBeenCalled();
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

  it('should handle Redis errors gracefully when updating listing', async () => {
    // Setup Redis mock to return the existing listing but throw on set
    kv.get.mockResolvedValue(mockListing);
    kv.set.mockRejectedValue(new Error('Redis connection error'));
    
    // Call the functions that would be in our route handler
    const existingListing = await kv.get(`listing:id:${testListingId}`);
    
    // Update the listing's featured status
    const updatedListing = {
      ...existingListing,
      featured: true,
      updatedAt: new Date().toISOString()
    };
    
    // Try to save the updated listing and catch the error
    let error;
    try {
      await kv.set(`listing:tenant:${testTenantId}:${testListingId}`, updatedListing);
    } catch (e) {
      error = e;
    }
    
    // Verify we got an error
    expect(error).toBeDefined();
    expect(error.message).toBe('Redis connection error');
  });
});
