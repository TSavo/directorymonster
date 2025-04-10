/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../../../../src/app/api/sites/[siteSlug]/search/route';

// Mock the searchIndexer
jest.mock('../../../../src/lib/search', () => ({
  searchIndexer: {
    searchListings: jest.fn(),
    countSearchResults: jest.fn(),
  },
}));

// Mock the Redis client
jest.mock('../../../../src/lib/redis-client', () => ({
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

// Mock withRedis middleware
jest.mock('../../../../src/middleware/withRedis', () => ({
  withRedis: (handler) => handler,
}));

describe('Site-Specific Search API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets site ID from the site slug parameter', async () => {
    const { searchIndexer } = require('../../../../src/lib/search');

    searchIndexer.searchListings.mockResolvedValue([]);
    searchIndexer.countSearchResults.mockResolvedValue(0);

    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search?q=test');

    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verify that searchListings was called with the site ID from the site service
    expect(searchIndexer.searchListings).toHaveBeenCalledWith(
      'site1',
      'test',
      expect.any(Object)
    );
  });

  it('returns 404 when site is not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/nonexistent-site/search?q=test');

    const response = await GET(request, { params: { siteSlug: 'nonexistent-site' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Site not found' });
  });

  it('returns error when no search criteria provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search');
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Missing search query or filters',
    });
  });

  it('returns error when search query is too short', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/search?q=a');
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Search query too short',
    });
  });

  it('handles query with category filter correctly', async () => {
    const { searchIndexer } = require('../../../../src/lib/search');

    // Mock implementation of searchListings and countSearchResults
    searchIndexer.searchListings.mockResolvedValue([
      { id: 'listing1', title: 'Test Listing 1' },
      { id: 'listing2', title: 'Test Listing 2' }
    ]);

    searchIndexer.countSearchResults.mockResolvedValue(2);

    const request = new NextRequest(
      'http://localhost:3000/api/sites/test-site/search?q=test&categoryId=cat1'
    );

    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(2);
    expect(data.filters.categoryId).toBe('cat1');

    // Verify searchListings was called with the right parameters
    expect(searchIndexer.searchListings).toHaveBeenCalledWith(
      'site1',
      'test',
      expect.objectContaining({
        categoryId: 'cat1'
      })
    );
  });

  it('handles featured filter correctly', async () => {
    const { searchIndexer } = require('../../../../src/lib/search');

    searchIndexer.searchListings.mockResolvedValue([
      { id: 'listing1', title: 'Featured Listing', featured: true }
    ]);

    searchIndexer.countSearchResults.mockResolvedValue(1);

    const request = new NextRequest(
      'http://localhost:3000/api/sites/test-site/search?featured=true'
    );

    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();

    expect(response.status).toBe(200);

    expect(searchIndexer.searchListings).toHaveBeenCalledWith(
      'site1',
      '',
      expect.objectContaining({
        featuredOnly: true
      })
    );

    expect(data.filters.featured).toBe(true);
  });

  it('handles pagination parameters correctly', async () => {
    const { searchIndexer } = require('../../../../src/lib/search');

    searchIndexer.searchListings.mockResolvedValue([
      { id: 'listing21', title: 'Listing 21' },
      { id: 'listing22', title: 'Listing 22' }
    ]);

    searchIndexer.countSearchResults.mockResolvedValue(30);

    const request = new NextRequest(
      'http://localhost:3000/api/sites/test-site/search?q=test&page=3&perPage=10'
    );

    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verify pagination parameters
    expect(searchIndexer.searchListings).toHaveBeenCalledWith(
      'site1',
      'test',
      expect.objectContaining({
        limit: 10,
        offset: 20 // (page-1) * perPage
      })
    );

    // Verify pagination response
    expect(data.pagination).toEqual({
      page: 3,
      perPage: 10,
      totalResults: 30,
      totalPages: 3
    });
  });

  it('handles search errors gracefully', async () => {
    const { searchIndexer } = require('../../../../src/lib/search');

    searchIndexer.searchListings.mockRejectedValue(new Error('Search failed'));

    const request = new NextRequest(
      'http://localhost:3000/api/sites/test-site/search?q=test'
    );

    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Search failed',
    });
  });
});
