/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/sites/[siteSlug]/search/route';

// Mock the searchIndexer
jest.mock('../../../src/lib/search', () => ({
  searchIndexer: {
    searchListings: jest.fn(),
    countSearchResults: jest.fn(),
  },
}));

// Mock withRedis middleware
jest.mock('../../../src/middleware/withRedis', () => ({
  withRedis: (handler: Function) => handler,
}));

// Mock Redis client
jest.mock('../../../src/lib/redis-client', () => ({
  kv: {
    get: jest.fn().mockImplementation((key) => {
      if (key.includes('site:slug:test-site')) {
        return {
          id: 'site1',
          slug: 'test-site',
          name: 'Test Site'
        };
      } else if (key.includes('site:slug:nonexistent-site')) {
        return null;
      }
      return null;
    }),
    set: jest.fn(),
    del: jest.fn(),
    keys: jest.fn()
  }
}));

describe('Site-Specific Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when site is not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/nonexistent-site/search?q=test');
    
    const response = await GET(request, { params: { siteSlug: 'nonexistent-site' } });
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Site not found' });
  });

  it('should return 400 when no search query or filters are provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search');
    
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Missing search query or filters' });
  });

  it('should return 400 when search query is too short', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search?q=a');
    
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data).toEqual({ error: 'Search query too short' });
  });

  it('should search listings with the correct site ID', async () => {
    const { searchIndexer } = require('../../../src/lib/search');
    
    searchIndexer.searchListings.mockResolvedValue([]);
    searchIndexer.countSearchResults.mockResolvedValue(0);
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search?q=test');
    
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    
    expect(response.status).toBe(200);
    
    // Verify that searchListings was called with the site ID from the site service
    expect(searchIndexer.searchListings).toHaveBeenCalledWith(
      'site1', // This comes from the mocked Redis client
      'test',
      expect.any(Object)
    );
  });

  it('should apply category filter correctly', async () => {
    const { searchIndexer } = require('../../../src/lib/search');
    
    searchIndexer.searchListings.mockResolvedValue([]);
    searchIndexer.countSearchResults.mockResolvedValue(0);
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search?q=test&categoryId=cat1');
    
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    
    expect(response.status).toBe(200);
    
    // Verify that searchListings was called with the category filter
    expect(searchIndexer.searchListings).toHaveBeenCalledWith(
      'site1',
      'test',
      expect.objectContaining({
        categoryId: 'cat1'
      })
    );
  });

  it('should apply featured filter correctly', async () => {
    const { searchIndexer } = require('../../../src/lib/search');
    
    searchIndexer.searchListings.mockResolvedValue([]);
    searchIndexer.countSearchResults.mockResolvedValue(0);
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search?q=test&featured=true');
    
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    
    expect(response.status).toBe(200);
    
    // Verify that searchListings was called with the featured filter
    expect(searchIndexer.searchListings).toHaveBeenCalledWith(
      'site1',
      'test',
      expect.objectContaining({
        featuredOnly: true
      })
    );
  });

  it('should apply pagination parameters correctly', async () => {
    const { searchIndexer } = require('../../../src/lib/search');
    
    searchIndexer.searchListings.mockResolvedValue([]);
    searchIndexer.countSearchResults.mockResolvedValue(30);
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search?q=test&page=2&perPage=10');
    
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    
    // Verify that searchListings was called with the pagination parameters
    expect(searchIndexer.searchListings).toHaveBeenCalledWith(
      'site1',
      'test',
      expect.objectContaining({
        offset: 10, // (page-1) * perPage
        limit: 10
      })
    );
    
    // Verify pagination info in response
    expect(data.pagination).toEqual({
      page: 2,
      perPage: 10,
      totalResults: 30,
      totalPages: 3
    });
  });

  it('should handle search errors gracefully', async () => {
    const { searchIndexer } = require('../../../src/lib/search');
    
    searchIndexer.searchListings.mockRejectedValue(new Error('Search failed'));
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search?q=test');
    
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();
    
    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Search failed' });
  });
});
