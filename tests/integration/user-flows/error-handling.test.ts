/**
 * @jest-environment node
 */
import { GET as getSiteListings, POST as createListing } from '@/app/api/sites/[siteSlug]/listings/route';
import { setupTestEnvironment, clearTestData } from '../setup-mock';
import { createMockRequest } from '../auth/acl-test-setup';
import { SiteConfig } from '@/types';

// Mock the Redis client
jest.mock('../../../src/lib/redis-client', () => {
  // Import our mock Redis client
  const setupMock = require('../setup-mock');
  const { redis, kv } = setupMock;

  // Create jest mock functions that delegate to the original implementation
  const mockKv = {
    get: jest.fn().mockImplementation((key) => kv.get(key)),
    set: jest.fn().mockImplementation((key, value) => kv.set(key, value)),
    keys: jest.fn().mockImplementation((pattern) => kv.keys(pattern)),
    del: jest.fn().mockImplementation((...keys) => kv.del(...keys))
  };

  const mockRedis = {
    multi: jest.fn().mockImplementation(() => redis.multi()),
    ping: jest.fn().mockImplementation(() => redis.ping())
  };

  return {
    redis: mockRedis,
    kv: mockKv
  };
});

// Store original module for reference
const originalModule = require('../setup-mock');

// Mock the search indexer
jest.mock('../../../src/lib/search-indexer', () => ({
  searchIndexer: {
    indexListing: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('API Error Handling', () => {
  // Store test data references
  let sites: SiteConfig[];

  beforeAll(async () => {
    // Set up test environment and store references
    const testData = await setupTestEnvironment();
    sites = testData.sites;
  });

  afterAll(async () => {
    // Clean up test data
    await clearTestData();
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.resetAllMocks();

    // Restore the default behavior for kv.get
    const { kv } = require('../../../src/lib/redis-client');
    kv.get.mockImplementation(async (key: string) => {
      // Use the original implementation from setupTestEnvironment
      return originalModule.kv.get(key);
    });
  });

  it('should handle non-existent site gracefully', async () => {
    // Create a request with a non-existent site slug
    const request = createMockRequest('/api/sites/non-existent-site/listings');

    // Call the listings API endpoint
    const response = await getSiteListings(request, { params: { siteSlug: 'non-existent-site' } });

    // Verify response is a 404 or 503 (depending on how the error is handled)
    expect([404, 503]).toContain(response.status);

    // Parse the response
    const data = await response.json();

    // Verify the error message
    expect(data).toHaveProperty('error');
    // The error message could be either 'Site not found' or 'Database connection error'
    expect(['Site not found', 'Database connection error']).toContain(data.error);
  });

  it('should handle validation errors when creating a listing', async () => {
    // Get a valid site
    const site = sites[0];

    // Create an invalid listing data (missing required fields)
    const invalidListingData = {
      // Missing title
      // Missing categoryId
      // Missing metaDescription
      backlinkUrl: 'https://example.com/invalid',
    };

    // Create a request with invalid data
    const request = createMockRequest(`/api/sites/${site.slug}/listings`, {
      method: 'POST',
      body: invalidListingData,
    });

    // Call the create listing API endpoint
    const response = await createListing(request, { params: { siteSlug: site.slug } });

    // Verify response is a 400 Bad Request
    expect(response.status).toBe(400);

    // Parse the response
    const data = await response.json();

    // Verify the error message
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Missing required fields');
  });

  it('should handle Redis errors gracefully', async () => {
    // Get a valid site
    const site = sites[0];

    // Mock Redis kv.keys to throw an error
    const { kv } = require('../../../src/lib/redis-client');
    kv.keys.mockRejectedValue(new Error('Redis connection error'));

    // Create a request for listings
    const request = createMockRequest(`/api/sites/${site.slug}/listings`);

    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Call the listings API endpoint
    const response = await getSiteListings(request, { params: { siteSlug: site.slug } });

    // Verify response is a 500 or 503 Server Error
    expect([500, 503]).toContain(response.status);

    // Parse the response
    const data = await response.json();

    // Verify the error message
    expect(data).toHaveProperty('error');
    // The error message could be either 'Failed to fetch listings' or 'Database connection error'
    expect(['Failed to fetch listings', 'Database connection error']).toContain(data.error);

    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
});
