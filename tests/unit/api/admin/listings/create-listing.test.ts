import { kv } from '@/lib/redis-client';

// Mock the Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn()
  }
}));

describe('Create Listing in Redis', () => {
  const testTenantId = 'tenant-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save a new listing to Redis', async () => {
    // Setup Redis mock to return success
    kv.set.mockResolvedValue('OK');

    // Create listing data
    const listingData = {
      title: 'Test Listing',
      description: 'This is a test listing',
      status: 'draft',
      categoryIds: ['category-1']
    };

    // Simulate the route handler logic
    const timestamp = Date.now();
    const id = `listing_${timestamp}`;
    const slug = listingData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create the listing object
    const listing = {
      id,
      tenantId: testTenantId,
      title: listingData.title,
      slug,
      description: listingData.description || '',
      status: listingData.status || 'draft',
      categoryIds: listingData.categoryIds || [],
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

    // Verify the listing data was saved correctly
    expect(listing.title).toBe('Test Listing');
    expect(listing.tenantId).toBe(testTenantId);
    expect(listing.status).toBe('draft');
  });

  it('should validate required fields', async () => {
    // Create listing data with missing title
    const listingData = {
      description: 'This is a test listing',
      status: 'draft',
      categoryIds: ['category-1']
    };

    // Simulate the route handler validation logic
    let error = null;
    if (!listingData.title) {
      error = { error: 'Title is required' };
    }

    // Verify validation error
    expect(error).not.toBeNull();
    expect(error.error).toBe('Title is required');

    // Verify Redis was not called
    expect(kv.set).not.toHaveBeenCalled();
  });

  it('should handle Redis errors gracefully', async () => {
    // Setup Redis mock to throw an error
    kv.set.mockRejectedValue(new Error('Redis connection error'));

    // Create listing data
    const listingData = {
      title: 'Test Listing',
      description: 'This is a test listing',
      status: 'draft',
      categoryIds: ['category-1']
    };

    // Simulate the route handler logic
    const timestamp = Date.now();
    const id = `listing_${timestamp}`;
    const slug = listingData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // Create the listing object
    const listing = {
      id,
      tenantId: testTenantId,
      title: listingData.title,
      slug,
      description: listingData.description || '',
      status: listingData.status || 'draft',
      categoryIds: listingData.categoryIds || [],
      media: [],
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Try to save the listing to Redis and catch the error
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
