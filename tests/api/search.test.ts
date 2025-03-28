/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../../src/app/api/search/route';

// Mock the searchIndexer
jest.mock('../../src/lib/search-indexer', () => ({
  searchIndexer: {
    searchAll: jest.fn(),
  },
}));

// Mock Redis client
jest.mock('../../src/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
  },
}));

// Mock withRedis middleware to pass through the handler
jest.mock('../../src/middleware/withRedis', () => ({
  withRedis: (handler: Function) => handler,
}));

describe('Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return an error when query is missing', async () => {
    // Create request without a query parameter
    const request = new NextRequest('http://localhost:3000/api/search');
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Missing search query',
    });
  });

  it('should return an error when query is too short', async () => {
    // Create request with a short query
    const request = new NextRequest('http://localhost:3000/api/search?q=ab');
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Search query too short',
    });
  });

  it('should return search results for a valid query', async () => {
    // Mock the search indexer
    const { searchIndexer } = require('../../src/lib/search-indexer');
    (searchIndexer.searchAll as jest.Mock).mockResolvedValue(['listing1', 'listing2']);
    
    // Mock the Redis client
    const { kv } = require('../../src/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation((key) => {
      if (key === 'listing:id:listing1') {
        return Promise.resolve({
          id: 'listing1',
          title: 'Test Listing 1',
          slug: 'test-listing-1',
          categoryId: 'cat1',
          siteId: 'site1',
          metaDescription: 'Test description 1',
          content: 'Test content 1',
          backlinkUrl: 'https://example.com/1',
          backlinkAnchorText: 'Example 1',
          backlinkPosition: 'prominent',
          backlinkType: 'dofollow',
          customFields: {},
          createdAt: 1000,
          updatedAt: 1000,
        });
      }
      if (key === 'listing:id:listing2') {
        return Promise.resolve({
          id: 'listing2',
          title: 'Test Listing 2',
          slug: 'test-listing-2',
          categoryId: 'cat1',
          siteId: 'site1',
          metaDescription: 'Test description 2',
          content: 'Test content 2',
          backlinkUrl: 'https://example.com/2',
          backlinkAnchorText: 'Example 2',
          backlinkPosition: 'prominent',
          backlinkType: 'dofollow',
          customFields: {},
          createdAt: 2000,
          updatedAt: 2000,
        });
      }
      return Promise.resolve(null);
    });
    
    // Create request with a valid query
    const request = new NextRequest('http://localhost:3000/api/search?q=test query');
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual({
      results: [
        {
          id: 'listing1',
          title: 'Test Listing 1',
          slug: 'test-listing-1',
          categoryId: 'cat1',
          siteId: 'site1',
          metaDescription: 'Test description 1',
          content: 'Test content 1',
          backlinkUrl: 'https://example.com/1',
          backlinkAnchorText: 'Example 1',
          backlinkPosition: 'prominent',
          backlinkType: 'dofollow',
          customFields: {},
          createdAt: 1000,
          updatedAt: 1000,
        },
        {
          id: 'listing2',
          title: 'Test Listing 2',
          slug: 'test-listing-2',
          categoryId: 'cat1',
          siteId: 'site1',
          metaDescription: 'Test description 2',
          content: 'Test content 2',
          backlinkUrl: 'https://example.com/2',
          backlinkAnchorText: 'Example 2',
          backlinkPosition: 'prominent',
          backlinkType: 'dofollow',
          customFields: {},
          createdAt: 2000,
          updatedAt: 2000,
        },
      ],
      totalResults: 2,
      query: 'test query',
    });
    
    // Verify the searchIndexer was called correctly
    expect(searchIndexer.searchAll).toHaveBeenCalledWith(['test', 'query'], undefined);
  });

  it('should filter out null listing results', async () => {
    // Mock the search indexer
    const { searchIndexer } = require('../../src/lib/search-indexer');
    (searchIndexer.searchAll as jest.Mock).mockResolvedValue(['listing1', 'non-existent']);
    
    // Mock the Redis client
    const { kv } = require('../../src/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation((key) => {
      if (key === 'listing:id:listing1') {
        return Promise.resolve({
          id: 'listing1',
          title: 'Test Listing 1',
          slug: 'test-listing-1',
          categoryId: 'cat1',
          siteId: 'site1',
          metaDescription: 'Test description 1',
          content: 'Test content 1',
          backlinkUrl: 'https://example.com/1',
          backlinkAnchorText: 'Example 1',
          backlinkPosition: 'prominent',
          backlinkType: 'dofollow',
          customFields: {},
          createdAt: 1000,
          updatedAt: 1000,
        });
      }
      return Promise.resolve(null);
    });
    
    // Create request with a valid query
    const request = new NextRequest('http://localhost:3000/api/search?q=test query');
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify that only valid listings are returned
    expect(response.status).toBe(200);
    expect(data.results.length).toBe(1);
    expect(data.totalResults).toBe(1);
    expect(data.results[0].id).toBe('listing1');
  });

  it('should support site-specific search', async () => {
    // Mock the search indexer
    const { searchIndexer } = require('../../src/lib/search-indexer');
    (searchIndexer.searchAll as jest.Mock).mockResolvedValue(['listing1']);
    
    // Mock the Redis client
    const { kv } = require('../../src/lib/redis-client');
    (kv.get as jest.Mock).mockResolvedValue({
      id: 'listing1',
      title: 'Test Listing 1',
      slug: 'test-listing-1',
      categoryId: 'cat1',
      siteId: 'site1',
      metaDescription: 'Test description 1',
      content: 'Test content 1',
      backlinkUrl: 'https://example.com/1',
      backlinkAnchorText: 'Example 1',
      backlinkPosition: 'prominent',
      backlinkType: 'dofollow',
      customFields: {},
      createdAt: 1000,
      updatedAt: 1000,
    });
    
    // Create request with a valid query and siteId
    const request = new NextRequest('http://localhost:3000/api/search?q=test query&siteId=site1');
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(200);
    
    // Verify the searchIndexer was called with the site ID
    expect(searchIndexer.searchAll).toHaveBeenCalledWith(['test', 'query'], 'site1');
  });

  it('should handle search errors', async () => {
    // Mock the search indexer to throw an error
    const { searchIndexer } = require('../../src/lib/search-indexer');
    (searchIndexer.searchAll as jest.Mock).mockRejectedValue(new Error('Search failed'));
    
    // Create request with a valid query
    const request = new NextRequest('http://localhost:3000/api/search?q=test query');
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Search failed',
    });
  });

  it('should limit results to 20 items', async () => {
    // Create an array of 25 listing IDs
    const listingIds = Array.from({ length: 25 }, (_, i) => `listing${i + 1}`);
    
    // Mock the search indexer
    const { searchIndexer } = require('../../src/lib/search-indexer');
    (searchIndexer.searchAll as jest.Mock).mockResolvedValue(listingIds);
    
    // Mock the Redis client to return a listing for each ID
    const { kv } = require('../../src/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation((key) => {
      const listingId = key.replace('listing:id:', '');
      if (listingIds.includes(listingId)) {
        return Promise.resolve({
          id: listingId,
          title: `Test Listing ${listingId}`,
          slug: `test-listing-${listingId}`,
          categoryId: 'cat1',
          siteId: 'site1',
          metaDescription: `Test description ${listingId}`,
          content: `Test content ${listingId}`,
          backlinkUrl: `https://example.com/${listingId}`,
          backlinkAnchorText: `Example ${listingId}`,
          backlinkPosition: 'prominent',
          backlinkType: 'dofollow',
          customFields: {},
          createdAt: 1000,
          updatedAt: 1000,
        });
      }
      return Promise.resolve(null);
    });
    
    // Create request with a valid query
    const request = new NextRequest('http://localhost:3000/api/search?q=test query');
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response is limited to 20 results
    expect(response.status).toBe(200);
    expect(data.results.length).toBe(20);
    expect(data.totalResults).toBe(20);
  });
});
