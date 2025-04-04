/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/sites/[siteSlug]/categories/route';

// Mock the Redis client
jest.mock('../../../src/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
    smembers: jest.fn(),
    sadd: jest.fn(),
    srem: jest.fn(),
    sismember: jest.fn(),
  },
  redis: {
    multi: jest.fn(() => ({
      set: jest.fn().mockReturnThis(),
      sadd: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([[null, 'OK'], [null, 'OK']]),
    })),
    ping: jest.fn(),
  },
}));

// Mock withRedis middleware to pass through the handler
jest.mock('../../../src/middleware/withRedis', () => ({
  withRedis: (handler: Function) => handler,
}));

describe('Categories API - GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when site is not found', async () => {
    // Mock the Redis client to return null for site
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/non-existent/categories');

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
    expect(kv.get).toHaveBeenCalledWith('test:site:slug:non-existent');
  });

  it('should return categories for a valid site', async () => {
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

    // Mock categories
    const mockCategories = [
      {
        id: 'cat1',
        siteId: 'site1',
        name: 'Test Category 1',
        slug: 'test-category-1',
        metaDescription: 'Test description 1',
        order: 1,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'cat2',
        siteId: 'site1',
        name: 'Test Category 2',
        slug: 'test-category-2',
        metaDescription: 'Test description 2',
        order: 2,
        createdAt: 2000,
        updatedAt: 2000,
      },
    ];

    // Mock the Redis client
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation((key) => {
      if (key === 'test:site:slug:test-site') {
        return Promise.resolve(mockSite);
      }
      if (key === 'test:category:id:cat1') {
        return Promise.resolve(mockCategories[0]);
      }
      if (key === 'test:category:id:cat2') {
        return Promise.resolve(mockCategories[1]);
      }
      return Promise.resolve(null);
    });
    (kv.keys as jest.Mock).mockResolvedValue([
      'test:category:site:site1:test-category-1',
      'test:category:site:site1:test-category-2',
    ]);
    (kv.smembers as jest.Mock).mockResolvedValue(['cat1', 'cat2']);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/categories');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });

    // Parse the response
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual(mockCategories);

    // Verify the Redis client was called correctly
    expect(kv.get).toHaveBeenCalledWith('test:site:slug:test-site');
    expect(kv.smembers).toHaveBeenCalledWith('test:site:site1:categories');
  });

  it('should handle Redis keys error gracefully', async () => {
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
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation((key) => {
      if (key === 'test:site:slug:test-site') {
        return Promise.resolve(mockSite);
      }
      return Promise.resolve(null);
    });
    (kv.keys as jest.Mock).mockRejectedValue(new Error('Redis error'));

    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/categories');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });

    // Parse the response
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to fetch categories',
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error fetching categories:',
      expect.any(Error)
    );
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
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation((key) => {
      if (key === 'test:site:slug:test-site') {
        return Promise.resolve(mockSite);
      }
      return Promise.resolve(null);
    });

    // Force an error by making smembers throw an exception
    (kv.smembers as jest.Mock).mockRejectedValue(new Error('Redis connection error'));

    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/categories');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });

    // Parse the response
    const data = await response.json();

    // Verify the response status is 500 for server error
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error');

    // Verify error was logged
    expect(console.error).toHaveBeenCalled();
  });
});
