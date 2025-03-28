/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '../../src/app/api/sites/[siteSlug]/listings/route';

// Mock the Redis client
jest.mock('../../src/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
  redis: {
    multi: jest.fn(),
    ping: jest.fn(),
  },
}));

// Mock the search indexer
jest.mock('../../src/lib/search-indexer', () => ({
  searchIndexer: {
    indexListing: jest.fn(),
  },
}));

// Mock withRedis middleware to pass through the handler
jest.mock('../../src/middleware/withRedis', () => ({
  withRedis: (handler: Function) => handler,
}));

describe('Listings API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/sites/[siteSlug]/listings', () => {
    it('should return 404 when site is not found', async () => {
      // Mock the Redis client to return null for site
      const { kv } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockResolvedValue(null);
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/sites/non-existent/listings');
      
      // Execute the route handler
      const response = await GET(request, { params: { siteSlug: 'non-existent' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Site not found',
      });
      
      // Verify the Redis client was called correctly
      expect(kv.get).toHaveBeenCalledWith('site:slug:non-existent');
    });

    it('should return listings for a valid site', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock listings
      const mockListings = [
        {
          id: 'listing1',
          siteId: 'site1',
          categoryId: 'cat1',
          title: 'Test Listing 1',
          slug: 'test-listing-1',
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
          siteId: 'site1',
          categoryId: 'cat1',
          title: 'Test Listing 2',
          slug: 'test-listing-2',
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
      ];
      
      // Mock the Redis client
      const { kv } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'site:slug:test-site') {
          return Promise.resolve(mockSite);
        }
        if (key === 'listing:site:site1:test-listing-1') {
          return Promise.resolve(mockListings[0]);
        }
        if (key === 'listing:site:site1:test-listing-2') {
          return Promise.resolve(mockListings[1]);
        }
        return Promise.resolve(null);
      });
      (kv.keys as jest.Mock).mockResolvedValue([
        'listing:site:site1:test-listing-1',
        'listing:site:site1:test-listing-2',
      ]);
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings');
      
      // Execute the route handler
      const response = await GET(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(200);
      expect(data).toEqual(mockListings);
      
      // Verify the Redis client was called correctly
      expect(kv.get).toHaveBeenCalledWith('site:slug:test-site');
      expect(kv.keys).toHaveBeenCalledWith('listing:site:site1:*');
    });

    it('should handle Redis errors gracefully', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock the Redis client
      const { kv } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'site:slug:test-site') {
          return Promise.resolve(mockSite);
        }
        return Promise.resolve(null);
      });
      (kv.keys as jest.Mock).mockRejectedValue(new Error('Redis error'));
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings');
      
      // Execute the route handler
      const response = await GET(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to fetch listings',
      });
    });

    it('should handle individual listing fetch errors', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock listing
      const mockListing = {
        id: 'listing1',
        siteId: 'site1',
        categoryId: 'cat1',
        title: 'Test Listing 1',
        slug: 'test-listing-1',
        metaDescription: 'Test description 1',
        content: 'Test content 1',
        backlinkUrl: 'https://example.com/1',
        backlinkAnchorText: 'Example 1',
        backlinkPosition: 'prominent',
        backlinkType: 'dofollow',
        customFields: {},
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock the Redis client
      const { kv } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'site:slug:test-site') {
          return Promise.resolve(mockSite);
        }
        if (key === 'listing:site:site1:test-listing-1') {
          return Promise.resolve(mockListing);
        }
        if (key === 'listing:site:site1:test-listing-2') {
          // This will trigger the error handler in the loop
          return Promise.reject(new Error('Failed to fetch listing'));
        }
        return Promise.resolve(null);
      });
      (kv.keys as jest.Mock).mockResolvedValue([
        'listing:site:site1:test-listing-1',
        'listing:site:site1:test-listing-2',
      ]);
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings');
      
      // Spy on console.error to verify it's called
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Execute the route handler
      const response = await GET(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response - should still get the successful listing
      expect(response.status).toBe(200);
      expect(data).toEqual([mockListing]);
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Error fetching listing at index 1:',
        expect.any(Error)
      );
    });
  });

  describe('POST /api/sites/[siteSlug]/listings', () => {
    it('should return 404 when site is not found', async () => {
      // Mock the Redis client to return null for site
      const { kv } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockResolvedValue(null);
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/sites/non-existent/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      // Execute the route handler
      const response = await POST(request, { params: { siteSlug: 'non-existent' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Site not found',
      });
    });

    it('should return 400 when required fields are missing', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock the Redis client
      const { kv } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockResolvedValue(mockSite);
      
      // Create request with missing fields
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
          title: 'Test Listing',
          // Missing categoryId
          // Missing metaDescription
          // Missing content
          // Missing backlinkUrl
        }),
      });
      
      // Execute the route handler
      const response = await POST(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Missing required fields',
      });
    });

    it('should return 404 when category is not found', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock the Redis client
      const { kv } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'site:slug:test-site') {
          return Promise.resolve(mockSite);
        }
        if (key === 'category:id:non-existent-category') {
          return Promise.resolve(null);
        }
        return Promise.resolve(null);
      });
      
      // Create request with non-existent category
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Listing',
          categoryId: 'non-existent-category',
          metaDescription: 'Test description',
          content: 'Test content',
          backlinkUrl: 'https://example.com',
        }),
      });
      
      // Execute the route handler
      const response = await POST(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'Category not found',
      });
    });

    it('should return 409 when listing slug already exists', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock category data
      const mockCategory = {
        id: 'cat1',
        siteId: 'site1',
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock the Redis client
      const { kv } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'site:slug:test-site') {
          return Promise.resolve(mockSite);
        }
        if (key === 'category:id:cat1') {
          return Promise.resolve(mockCategory);
        }
        if (key === 'listing:site:site1:test-listing') {
          // Slug already exists
          return Promise.resolve({
            id: 'existing-listing',
            siteId: 'site1',
            categoryId: 'cat1',
            title: 'Test Listing',
            slug: 'test-listing',
            metaDescription: 'Existing description',
            content: 'Existing content',
            backlinkUrl: 'https://example.com/existing',
            backlinkAnchorText: 'Existing Example',
            backlinkPosition: 'prominent',
            backlinkType: 'dofollow',
            customFields: {},
            createdAt: 1000,
            updatedAt: 1000,
          });
        }
        return Promise.resolve(null);
      });
      
      // Create request with a title that generates an existing slug
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Listing', // This will generate 'test-listing' as the slug
          categoryId: 'cat1',
          metaDescription: 'Test description',
          content: 'Test content',
          backlinkUrl: 'https://example.com',
        }),
      });
      
      // Execute the route handler
      const response = await POST(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(409);
      expect(data).toEqual({
        error: 'A listing with a similar title already exists',
      });
    });

    it('should create a new listing successfully', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        domain: 'testsite.com',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock category data
      const mockCategory = {
        id: 'cat1',
        siteId: 'site1',
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock the Redis client
      const { kv, redis } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'site:slug:test-site') {
          return Promise.resolve(mockSite);
        }
        if (key === 'category:id:cat1') {
          return Promise.resolve(mockCategory);
        }
        // Slug doesn't exist yet
        return Promise.resolve(null);
      });
      
      // Mock the multi transaction
      const mockMulti = {
        set: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'OK'], // First set operation result
          [null, 'OK'], // Second set operation result
          [null, 'OK'], // Third set operation result
        ]),
      };
      (redis.multi as jest.Mock).mockReturnValue(mockMulti);
      
      // Mock Date.now for consistent timestamps
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890);
      
      // Create request with valid data
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Test Listing',
          categoryId: 'cat1',
          metaDescription: 'New test description',
          content: 'New test content',
          backlinkUrl: 'https://example.com/new',
          backlinkAnchorText: 'New Example',
          backlinkPosition: 'prominent',
          backlinkType: 'dofollow',
          customFields: {
            rating: '4.5',
            price: '99.99',
          },
          imageUrl: 'https://example.com/image.jpg',
        }),
      });
      
      // Execute the route handler
      const response = await POST(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(201);
      expect(data).toEqual({
        id: 'listing_1234567890',
        siteId: 'site1',
        categoryId: 'cat1',
        title: 'New Test Listing',
        slug: 'new-test-listing',
        metaDescription: 'New test description',
        content: 'New test content',
        backlinkUrl: 'https://example.com/new',
        backlinkAnchorText: 'New Example',
        backlinkPosition: 'prominent',
        backlinkType: 'dofollow',
        customFields: {
          rating: '4.5',
          price: '99.99',
        },
        imageUrl: 'https://example.com/image.jpg',
        createdAt: 1234567890,
        updatedAt: 1234567890,
        url: 'https://testsite.com/test-category/new-test-listing',
      });
      
      // Verify the Redis client was called correctly
      expect(redis.multi).toHaveBeenCalled();
      expect(mockMulti.set).toHaveBeenCalledTimes(3);
      expect(mockMulti.set).toHaveBeenCalledWith(
        'listing:id:listing_1234567890',
        expect.any(String)
      );
      expect(mockMulti.set).toHaveBeenCalledWith(
        'listing:site:site1:new-test-listing',
        expect.any(String)
      );
      expect(mockMulti.set).toHaveBeenCalledWith(
        'listing:category:cat1:new-test-listing',
        expect.any(String)
      );
      expect(mockMulti.exec).toHaveBeenCalled();
      
      // Verify the search indexer was called
      const { searchIndexer } = require('../../src/lib/search-indexer');
      expect(searchIndexer.indexListing).toHaveBeenCalledWith(expect.objectContaining({
        id: 'listing_1234567890',
        title: 'New Test Listing',
      }));
      
      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should handle errors in Redis transaction', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock category data
      const mockCategory = {
        id: 'cat1',
        siteId: 'site1',
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock the Redis client
      const { kv, redis } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'site:slug:test-site') {
          return Promise.resolve(mockSite);
        }
        if (key === 'category:id:cat1') {
          return Promise.resolve(mockCategory);
        }
        return Promise.resolve(null);
      });
      
      // Mock the multi transaction with an error
      const mockMulti = {
        set: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'OK'], // First set operation result
          [new Error('Transaction error'), null], // Error in second operation
          [null, 'OK'], // Third set operation result
        ]),
      };
      (redis.multi as jest.Mock).mockReturnValue(mockMulti);
      
      // Create request with valid data
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Test Listing',
          categoryId: 'cat1',
          metaDescription: 'New test description',
          content: 'New test content',
          backlinkUrl: 'https://example.com/new',
        }),
      });
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Execute the route handler
      const response = await POST(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to save listing data',
      });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Transaction errors:',
        expect.anything()
      );
    });

    it('should handle search indexing errors gracefully', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        domain: 'testsite.com',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock category data
      const mockCategory = {
        id: 'cat1',
        siteId: 'site1',
        name: 'Test Category',
        slug: 'test-category',
        metaDescription: 'Test category description',
        order: 1,
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock the Redis client
      const { kv, redis } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockImplementation((key) => {
        if (key === 'site:slug:test-site') {
          return Promise.resolve(mockSite);
        }
        if (key === 'category:id:cat1') {
          return Promise.resolve(mockCategory);
        }
        return Promise.resolve(null);
      });
      
      // Mock the multi transaction
      const mockMulti = {
        set: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          [null, 'OK'], // First set operation result
          [null, 'OK'], // Second set operation result
          [null, 'OK'], // Third set operation result
        ]),
      };
      (redis.multi as jest.Mock).mockReturnValue(mockMulti);
      
      // Mock Date.now for consistent timestamps
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 1234567890);
      
      // Mock the search indexer to throw an error
      const { searchIndexer } = require('../../src/lib/search-indexer');
      (searchIndexer.indexListing as jest.Mock).mockRejectedValue(new Error('Indexing error'));
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Create request with valid data
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Test Listing',
          categoryId: 'cat1',
          metaDescription: 'New test description',
          content: 'New test content',
          backlinkUrl: 'https://example.com/new',
        }),
      });
      
      // Execute the route handler
      const response = await POST(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response - should still be successful
      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id', 'listing_1234567890');
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Error indexing listing:',
        expect.any(Error)
      );
      
      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should handle JSON parsing errors', async () => {
      // Mock site data
      const mockSite = {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'Test site description',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1000,
        updatedAt: 1000,
      };
      
      // Mock the Redis client
      const { kv } = require('../../src/lib/redis-client');
      (kv.get as jest.Mock).mockResolvedValue(mockSite);
      
      // Create a mock request that will throw during JSON parsing
      const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      // Mock request.json to throw an error
      request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));
      
      // Spy on console.error
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Execute the route handler
      const response = await POST(request, { params: { siteSlug: 'test-site' } });
      
      // Parse the response
      const data = await response.json();
      
      // Verify the response
      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Internal server error',
      });
      
      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith(
        'Error creating listing:',
        expect.any(Error)
      );
    });
  });
});
