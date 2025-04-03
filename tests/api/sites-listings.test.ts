import { NextRequest } from 'next/server';
import { GET } from '@/app/api/sites/[siteSlug]/listings/route';
import { kv } from '@/lib/redis-client';
import { Listing, SiteConfig } from '@/types';

// Mock Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    keys: jest.fn(),
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
});
