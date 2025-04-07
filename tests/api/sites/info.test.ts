/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/sites/[siteSlug]/info/route';

// Mock Redis client
jest.mock('../../../src/lib/redis-client', () => ({
  kv: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'site:slug:test-site' || key === 'test:site:slug:test-site') {
        return {
          id: 'site1',
          name: 'Test Site',
          slug: 'test-site',
          domain: 'test-site.com',
          settings: { theme: 'light' },
          createdAt: 1625097600000,
          updatedAt: 1625097600000
        };
      } else if (key === 'site:slug:nonexistent-site' || key === 'test:site:slug:nonexistent-site') {
        return null;
      }
      return null;
    }),
    keys: jest.fn().mockResolvedValue(['site:slug:test-site', 'site:slug:another-site']),
  }
}));

// Mock withRedis middleware
jest.mock('../../../src/middleware/withRedis', () => ({
  withRedis: (handler: Function) => handler,
}));

describe('Site-Specific Info API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when site is not found', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/nonexistent-site/info');

    const response = await GET(request, { params: { siteSlug: 'nonexistent-site' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: 'Site not found' });
  });

  it('should return site information when site exists', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/info');

    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.site).toEqual({
      id: 'site1',
      name: 'Test Site',
      slug: 'test-site',
      domain: 'test-site.com',
      settings: { theme: 'light' },
      createdAt: 1625097600000,
      updatedAt: 1625097600000
    });
    expect(data.availableSites).toBeDefined();
    expect(Array.isArray(data.availableSites)).toBe(true);
  });

  it('should handle errors gracefully', async () => {
    // Mock Redis to throw an error
    const { kv } = require('../../../src/lib/redis-client');
    kv.get.mockRejectedValueOnce(new Error('Redis connection error'));

    const request = new NextRequest('http://localhost:3000/api/sites/test-site/info');

    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Failed to fetch site information' });
  });
});
