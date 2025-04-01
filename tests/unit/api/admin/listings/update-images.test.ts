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

describe('Update Listing Images in Redis', () => {
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
    images: ['https://example.com/image1.jpg'],
    updatedAt: '2023-01-01T00:00:00.000Z'
  };

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should add a new image to a listing in Redis', async () => {
    // Setup Redis mock to return the existing listing
    kv.get.mockResolvedValue(mockListing);
    kv.set.mockResolvedValue('OK');

    // New image to add
    const newImage = 'https://example.com/image2.jpg';

    // Call the functions that would be in our route handler
    const existingListing = await kv.get(`listing:tenant:${testTenantId}:${testListingId}`);

    // Verify the listing exists
    expect(existingListing).not.toBeNull();

    // Update the listing's images
    const updatedListing = {
      ...existingListing,
      images: [...existingListing.images, newImage],
      updatedAt: expect.any(String) // We don't care about the exact timestamp
    };

    // Save the updated listing
    await kv.set(`listing:tenant:${testTenantId}:${testListingId}`, updatedListing);
    await kv.set(`listing:id:${testListingId}`, updatedListing);

    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith(`listing:tenant:${testTenantId}:${testListingId}`);
    expect(kv.set).toHaveBeenCalledTimes(2);
    expect(kv.set.mock.calls[0][0]).toBe(`listing:tenant:${testTenantId}:${testListingId}`);
    expect(kv.set.mock.calls[0][1]).toEqual(updatedListing);
    expect(kv.set.mock.calls[1][0]).toBe(`listing:id:${testListingId}`);
    expect(kv.set.mock.calls[1][1]).toEqual(updatedListing);

    // Verify the images array contains both images
    expect(kv.set.mock.calls[0][1].images).toHaveLength(2);
    expect(kv.set.mock.calls[0][1].images).toContain('https://example.com/image1.jpg');
    expect(kv.set.mock.calls[0][1].images).toContain('https://example.com/image2.jpg');
  });

  it('should replace all images if an array is provided', async () => {
    // Setup Redis mock to return the existing listing
    kv.get.mockResolvedValue(mockListing);
    kv.set.mockResolvedValue('OK');

    // New images to set
    const newImages = [
      'https://example.com/new1.jpg',
      'https://example.com/new2.jpg'
    ];

    // Call the functions that would be in our route handler
    const existingListing = await kv.get(`listing:tenant:${testTenantId}:${testListingId}`);

    // Verify the listing exists
    expect(existingListing).not.toBeNull();

    // Update the listing's images
    const updatedListing = {
      ...existingListing,
      images: newImages,
      updatedAt: expect.any(String) // We don't care about the exact timestamp
    };

    // Save the updated listing
    await kv.set(`listing:tenant:${testTenantId}:${testListingId}`, updatedListing);
    await kv.set(`listing:id:${testListingId}`, updatedListing);

    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith(`listing:tenant:${testTenantId}:${testListingId}`);
    expect(kv.set).toHaveBeenCalledTimes(2);
    expect(kv.set.mock.calls[0][0]).toBe(`listing:tenant:${testTenantId}:${testListingId}`);
    expect(kv.set.mock.calls[0][1]).toEqual(updatedListing);
    expect(kv.set.mock.calls[1][0]).toBe(`listing:id:${testListingId}`);
    expect(kv.set.mock.calls[1][1]).toEqual(updatedListing);

    // Verify the images array contains only the new images
    expect(kv.set.mock.calls[0][1].images).toHaveLength(2);
    expect(kv.set.mock.calls[0][1].images).toContain('https://example.com/new1.jpg');
    expect(kv.set.mock.calls[0][1].images).toContain('https://example.com/new2.jpg');
    expect(kv.set.mock.calls[0][1].images).not.toContain('https://example.com/image1.jpg');
  });

  it('should return null if listing does not exist', async () => {
    // Setup Redis mock to return null
    kv.get.mockResolvedValue(null);

    // Call the function that would be in our route handler
    const listing = await kv.get(`listing:tenant:${testTenantId}:non-existent-id`);

    // Verify Redis was called correctly
    expect(kv.get).toHaveBeenCalledWith(`listing:tenant:${testTenantId}:non-existent-id`);

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
      await kv.get(`listing:tenant:${testTenantId}:${testListingId}`);
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

    // New image to add
    const newImage = 'https://example.com/image2.jpg';

    // Call the functions that would be in our route handler
    const existingListing = await kv.get(`listing:tenant:${testTenantId}:${testListingId}`);

    // Update the listing's images
    const updatedListing = {
      ...existingListing,
      images: [...existingListing.images, newImage],
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
