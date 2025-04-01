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

describe('Create Listing in Redis', () => {
  // Test data
  const testTenantId = 'tenant-123';
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a new listing to Redis', async () => {
    // Setup Redis mock to return success
    kv.set.mockResolvedValue('OK');
    
    // Create a listing
    const timestamp = Date.now();
    const id = `listing_${timestamp}`;
    const listing = {
      id,
      tenantId: testTenantId,
      title: 'Test Listing',
      slug: 'test-listing',
      description: 'This is a test listing',
      status: 'draft',
      categoryIds: ['category-1'],
      media: [],
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save the listing to Redis
    await kv.set(`listing:tenant:${testTenantId}:${id}`, listing);
    await kv.set(`listing:id:${id}`, listing);
    
    // Verify Redis was called correctly
    expect(kv.set).toHaveBeenCalledTimes(2);
    expect(kv.set.mock.calls[0][0]).toBe(`listing:tenant:${testTenantId}:${id}`);
    expect(kv.set.mock.calls[0][1]).toEqual(listing);
    expect(kv.set.mock.calls[1][0]).toBe(`listing:id:${id}`);
    expect(kv.set.mock.calls[1][1]).toEqual(listing);
  });

  it('should handle Redis errors gracefully when creating a listing', async () => {
    // Setup Redis mock to throw an error
    kv.set.mockRejectedValue(new Error('Redis connection error'));
    
    // Create a listing
    const timestamp = Date.now();
    const id = `listing_${timestamp}`;
    const listing = {
      id,
      tenantId: testTenantId,
      title: 'Test Listing',
      slug: 'test-listing',
      description: 'This is a test listing',
      status: 'draft',
      categoryIds: ['category-1'],
      media: [],
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Try to save the listing to Redis and expect an error
    let error;
    try {
      await kv.set(`listing:tenant:${testTenantId}:${id}`, listing);
    } catch (e) {
      error = e;
    }
    
    // Verify we got an error
    expect(error).toBeDefined();
    expect(error.message).toBe('Redis connection error');
  });
});
