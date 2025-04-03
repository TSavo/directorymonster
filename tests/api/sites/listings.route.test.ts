import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/sites/[siteSlug]/listings/route';
import { kv } from '@/lib/redis-client';
import { Listing, SiteConfig } from '@/types';

// Mock Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    keys: jest.fn(),
    set: jest.fn(),
  },
  redis: {
    multi: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  },
}));

// Mock withRedis middleware
jest.mock('@/middleware/withRedis', () => ({
  withRedis: (handler) => handler,
}));

// Mock search indexer
jest.mock('@/lib/search-indexer', () => ({
  searchIndexer: {
    indexListing: jest.fn(),
  },
}));

describe('GET /api/sites/[siteSlug]/listings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when site is not found', async () => {
    // Mock Redis client to return null for site
    (kv.get as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/non-existent/listings');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'non-existent' } });

    // Verify the response
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'Site not found' });

    // Verify Redis client was called correctly
    expect(kv.get).toHaveBeenCalledWith('test:site:slug:non-existent');
  });

  it('should return listings for a site', async () => {
    // Mock site data
    const mockSite: SiteConfig = {
      id: 'site_1',
      name: 'Test Site',
      slug: 'test-site',
      domain: 'test.com',
      tenantId: 'tenant_1',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };

    // Mock listings data
    const mockListings: Listing[] = [
      {
        id: 'listing_1',
        siteId: 'site_1',
        title: 'Test Listing 1',
        slug: 'test-listing-1',
        categoryId: 'category_1',
        metaDescription: 'Test description 1',
        content: 'Test content 1',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      },
      {
        id: 'listing_2',
        siteId: 'site_1',
        title: 'Test Listing 2',
        slug: 'test-listing-2',
        categoryId: 'category_2',
        metaDescription: 'Test description 2',
        content: 'Test content 2',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      },
    ];

    // Mock Redis client responses
    (kv.get as jest.Mock).mockResolvedValue(mockSite);
    (kv.keys as jest.Mock).mockResolvedValue(['test:listing:site:site_1:1', 'test:listing:site:site_1:2']);
    (kv.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'test:site:slug:test-site') return Promise.resolve(mockSite);
      if (key === 'test:listing:site:site_1:1') return Promise.resolve(mockListings[0]);
      if (key === 'test:listing:site:site_1:2') return Promise.resolve(mockListings[1]);
      return Promise.resolve(null);
    });

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });

    // Verify the response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results).toHaveLength(2);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.totalResults).toBe(2);

    // Verify Redis client was called correctly
    expect(kv.get).toHaveBeenCalledWith('test:site:slug:test-site');
    expect(kv.keys).toHaveBeenCalledWith('test:listing:site:site_1:*');
  });
});
