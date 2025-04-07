/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as getOldSiteInfo } from '@/app/api/site-info/route';
import { GET as getNewSiteInfo } from '@/app/api/sites/[siteSlug]/info/route';

// Mock the Redis client
jest.mock('../../../src/lib/redis-client', () => ({
  kv: {
    get: jest.fn().mockImplementation((key) => {
      if (key === 'site:slug:test-site' || key === 'test:site:slug:test-site') {
        return {
          id: 'site1',
          name: 'Test Site',
          slug: 'test-site',
          domain: 'testsite.com',
          settings: { theme: 'light' },
          createdAt: 1625097600000,
          updatedAt: 1625097600000
        };
      } else if (key === 'site:domain:testsite.com') {
        return 'site1';
      }
      return null;
    }),
    keys: jest.fn().mockResolvedValue(['site:slug:test-site']),
  }
}));

// Mock the site-utils module
jest.mock('../../../src/lib/site-utils', () => ({
  getSiteByHostname: jest.fn().mockImplementation(async (hostname) => {
    if (hostname === 'testsite.com') {
      return {
        id: 'site1',
        name: 'Test Site',
        slug: 'test-site',
        domain: 'testsite.com',
        settings: { theme: 'light' },
        createdAt: 1625097600000,
        updatedAt: 1625097600000
      };
    }
    return null;
  }),
}));

// Mock withRedis middleware
jest.mock('../../../src/middleware/withRedis', () => ({
  withRedis: (handler: Function) => handler,
}));

describe('Site Info API Compatibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should provide compatible data between old and new APIs', async () => {
    // Create requests for both APIs
    const oldRequest = new NextRequest('http://localhost:3000/api/site-info', {
      headers: {
        host: 'testsite.com',
      },
    });
    
    const newRequest = new NextRequest('http://localhost:3000/api/sites/test-site/info');
    
    // Get responses from both APIs
    const oldResponse = await getOldSiteInfo(oldRequest);
    const newResponse = await getNewSiteInfo(newRequest, { params: { siteSlug: 'test-site' } });
    
    // Parse the responses
    const oldData = await oldResponse.json();
    const newData = await newResponse.json();
    
    // Verify both responses have status 200
    expect(oldResponse.status).toBe(200);
    expect(newResponse.status).toBe(200);
    
    // Verify both responses contain site information
    expect(oldData.site).toBeDefined();
    expect(newData.site).toBeDefined();
    
    // Verify the site information is compatible
    expect(oldData.site.id).toBe(newData.site.id);
    expect(oldData.site.name).toBe(newData.site.name);
    expect(oldData.site.slug).toBe(newData.site.slug);
    expect(oldData.site.domain).toBe(newData.site.domain);
    
    // Verify both responses contain available sites
    expect(oldData.availableSites).toBeDefined();
    expect(newData.availableSites).toBeDefined();
    expect(Array.isArray(oldData.availableSites)).toBe(true);
    expect(Array.isArray(newData.availableSites)).toBe(true);
  });
});
