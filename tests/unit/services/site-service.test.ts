import { v4 as uuidv4 } from 'uuid';
import { SiteConfig } from '@/types';

// Mock Redis client
jest.mock('@/lib/redis-client', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    smembers: jest.fn().mockResolvedValue([]),
    multi: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  return {
    redis: mockRedis,
    kv: {
      get: jest.fn(),
      set: jest.fn(),
      keys: jest.fn(),
      smembers: jest.fn(),
    },
  };
});

describe('SiteService', () => {
  const testSiteId = 'site_' + uuidv4();
  const testSiteSlug = 'test-site';
  const mockSite: SiteConfig = {
    id: testSiteId,
    name: 'Test Site',
    slug: testSiteSlug,
    primaryKeyword: 'test',
    metaDescription: 'Test site for API testing',
    headerText: 'Test Site Header',
    defaultLinkAttributes: 'dofollow',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should have a getSiteBySlug method', async () => {
    // Import the service
    const { SiteService } = require('@/services/site-service');

    // Verify the method exists
    expect(typeof SiteService.getSiteBySlug).toBe('function');
  });

  it('should return a site when found by slug', async () => {
    // Mock Redis to return the site
    const { redis } = require('@/lib/redis-client');
    redis.get.mockResolvedValue(JSON.stringify(mockSite));

    // Import the service
    const { SiteService } = require('@/services/site-service');

    // Call the method
    const site = await SiteService.getSiteBySlug(testSiteSlug);

    // Verify redis.get was called with the correct key
    expect(redis.get).toHaveBeenCalledWith(`test:site:slug:${testSiteSlug}`);

    // Verify the result
    expect(site).toEqual(mockSite);
  });

  it('should return null when site is not found', async () => {
    // Mock Redis to return null
    const { redis } = require('@/lib/redis-client');
    redis.get.mockResolvedValue(null);

    // Import the service
    const { SiteService } = require('@/services/site-service');

    // Call the method
    const site = await SiteService.getSiteBySlug('non-existent-slug');

    // Verify redis.get was called
    expect(redis.get).toHaveBeenCalled();

    // Verify the result
    expect(site).toBeNull();
  });
});
