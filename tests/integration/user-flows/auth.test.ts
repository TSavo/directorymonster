/**
 * @jest-environment node
 */
import { POST as createListing } from '../../../src/app/api/sites/[siteSlug]/listings/route';
import { setupTestEnvironment, clearTestData, createMockRequest } from '../setup';
import { SiteConfig, Category, ApiKey } from '../../../src/types';

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

describe('Authentication and Authorization', () => {
  // Store test data references
  let sites: SiteConfig[];
  let categories: Category[];
  
  // Test API keys
  const validApiKey: ApiKey = {
    id: 'test-api-key-valid',
    siteId: '', // Will be set in beforeAll
    key: 'valid-api-key-12345',
    name: 'Test API Key',
    permissions: ['create_listing', 'create_category'],
    createdAt: Date.now(),
  };
  
  const readOnlyApiKey: ApiKey = {
    id: 'test-api-key-readonly',
    siteId: '', // Will be set in beforeAll
    key: 'readonly-api-key-67890',
    name: 'Read-only Test API Key',
    permissions: ['read_listing', 'read_category'],
    createdAt: Date.now(),
  };
  
  beforeAll(async () => {
    // Set up test environment and store references
    const testData = await setupTestEnvironment();
    sites = testData.sites;
    categories = testData.categories;
    
    // Set the siteId for our test API keys
    validApiKey.siteId = sites[0].id;
    readOnlyApiKey.siteId = sites[0].id;
    
    // Store API keys in Redis
    const { kv } = require('../../../src/lib/redis-client');
    await kv.set(`test:apikey:${validApiKey.id}`, JSON.stringify(validApiKey));
    await kv.set(`test:apikey:key:${validApiKey.key}`, JSON.stringify(validApiKey));
    await kv.set(`test:apikey:${readOnlyApiKey.id}`, JSON.stringify(readOnlyApiKey));
    await kv.set(`test:apikey:key:${readOnlyApiKey.key}`, JSON.stringify(readOnlyApiKey));
    
    // Mock kv.get to return our API keys
    (kv.get as jest.Mock).mockImplementation(async (key: string) => {
      if (key === `apikey:key:${validApiKey.key}`) {
        return validApiKey;
      }
      if (key === `apikey:key:${readOnlyApiKey.key}`) {
        return readOnlyApiKey;
      }
      // For other keys, use the original implementation
      return originalModule.kv.get(key);
    });
  });
  
  afterAll(async () => {
    // Clean up test data
    await clearTestData();
  });
  
  it('should reject requests without API key', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Get a category for this site
    const category = categories.find(c => c.siteId === site.id);
    
    // Create listing data
    const listingData = {
      title: 'Test Auth Listing',
      categoryId: category!.id,
      metaDescription: 'Test auth listing description',
      content: 'This is a test listing for auth testing.',
      backlinkUrl: 'https://example.com/auth-test',
      backlinkAnchorText: 'Auth Test Link',
      backlinkPosition: 'prominent',
      backlinkType: 'dofollow',
    };
    
    // Create request without API key
    const request = createMockRequest(`/api/sites/${site.slug}/listings`, {
      method: 'POST',
      body: listingData,
    });
    
    // Call the create listing API endpoint
    const response = await createListing(request, { params: { siteSlug: site.slug } });
    
    // Verify response is unauthorized
    expect(response.status).toBe(401);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the error message
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Unauthorized');
  });
  
  it('should accept requests with valid API key', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Get a category for this site
    const category = categories.find(c => c.siteId === site.id);
    
    // Create listing data
    const listingData = {
      title: 'Test Auth Valid Listing',
      categoryId: category!.id,
      metaDescription: 'Test auth listing with valid key',
      content: 'This is a test listing for auth testing with valid key.',
      backlinkUrl: 'https://example.com/auth-valid-test',
      backlinkAnchorText: 'Auth Valid Test Link',
      backlinkPosition: 'prominent',
      backlinkType: 'dofollow',
    };
    
    // Create request with valid API key
    const request = createMockRequest(`/api/sites/${site.slug}/listings`, {
      method: 'POST',
      headers: {
        'X-API-Key': validApiKey.key,
      },
      body: listingData,
    });
    
    // Call the create listing API endpoint
    const response = await createListing(request, { params: { siteSlug: site.slug } });
    
    // Verify response is successful
    expect(response.status).toBe(201);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the listing was created
    expect(data).toHaveProperty('id');
    expect(data.title).toBe(listingData.title);
  });
  
  it('should reject requests with insufficient permissions', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Get a category for this site
    const category = categories.find(c => c.siteId === site.id);
    
    // Create listing data
    const listingData = {
      title: 'Test Auth Permission Listing',
      categoryId: category!.id,
      metaDescription: 'Test auth listing with insufficient permissions',
      content: 'This is a test listing for auth testing with insufficient permissions.',
      backlinkUrl: 'https://example.com/auth-permission-test',
      backlinkAnchorText: 'Auth Permission Test Link',
      backlinkPosition: 'prominent',
      backlinkType: 'dofollow',
    };
    
    // Create request with read-only API key
    const request = createMockRequest(`/api/sites/${site.slug}/listings`, {
      method: 'POST',
      headers: {
        'X-API-Key': readOnlyApiKey.key,
      },
      body: listingData,
    });
    
    // Call the create listing API endpoint
    const response = await createListing(request, { params: { siteSlug: site.slug } });
    
    // Verify response is forbidden
    expect(response.status).toBe(403);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the error message
    expect(data).toHaveProperty('error');
    expect(data.error).toContain('Forbidden');
    expect(data.error).toContain('create_listing');
  });
});
