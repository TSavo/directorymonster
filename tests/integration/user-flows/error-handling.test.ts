/**
 * @jest-environment node
 */
import { GET as getSiteListings, POST as createListing } from '@/app/api/sites/[siteSlug]/listings/route';
import { setupTestEnvironment, clearTestData, createMockRequest } from '../setup';
import { SiteConfig } from '@/types';

// Mock the Redis client
jest.mock('../../../src/lib/redis-client', () => {
  // Store the original module to restore when needed
  const originalModule = jest.requireActual('../../../src/lib/redis-client');
  
  return {
    ...originalModule,
    kv: {
      ...originalModule.kv,
      get: jest.fn(originalModule.kv.get),
      set: jest.fn(originalModule.kv.set),
      keys: jest.fn(originalModule.kv.keys),
      del: jest.fn(originalModule.kv.del),
    },
    redis: {
      ...originalModule.redis,
      multi: jest.fn(originalModule.redis.multi),
      ping: jest.fn(originalModule.redis.ping),
    },
  };
});

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
    (kv.get as jest.Mock).mockImplementation(async (key: string) => {
      // Use the original implementation from setupTestEnvironment
      return originalModule.kv.get(key);
    });
  });
  
  it('should handle non-existent site gracefully', async () => {
    // Create a request with a non-existent site slug
    const request = createMockRequest('/api/sites/non-existent-site/listings');
    
    // Call the listings API endpoint
    const response = await getSiteListings(request, { params: { siteSlug: 'non-existent-site' } });
    
    // Verify response is a 404
    expect(response.status).toBe(404);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the error message
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Site not found');
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
    (kv.keys as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
    
    // Create a request for listings
    const request = createMockRequest(`/api/sites/${site.slug}/listings`);
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Call the listings API endpoint
    const response = await getSiteListings(request, { params: { siteSlug: site.slug } });
    
    // Verify response is a 500 Server Error
    expect(response.status).toBe(500);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the error message
    expect(data).toHaveProperty('error');
    expect(data.error).toBe('Failed to fetch listings');
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
});
