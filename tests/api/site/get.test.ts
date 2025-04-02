/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../../../src/app/api/sites/[siteSlug]/route';

// Mock the Redis client
jest.mock('../../../src/lib/redis-client', () => ({
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

// Mock withRedis middleware to pass through the handler
jest.mock('../../../src/middleware/withRedis', () => ({
  withRedis: (handler: Function) => handler,
}));

describe('Site API - GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when site is not found', async () => {
    // Mock the Redis client to return null for site
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/non-existent');

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

  it('should return site configuration for a valid site', async () => {
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

    // Mock the Redis client
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockResolvedValue(mockSite);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/test-site');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });

    // Parse the response
    const data = await response.json();

    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toEqual(mockSite);

    // Verify the Redis client was called correctly
    expect(kv.get).toHaveBeenCalledWith('test:site:slug:test-site');
  });
});
