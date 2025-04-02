/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/site-info/route';

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

// Mock the site-utils module
jest.mock('../../../src/lib/site-utils', () => ({
  getSiteByHostname: jest.fn(),
}));

describe('Site Info API - GET', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return site info based on hostname in the request headers', async () => {
    // Setup mock site data
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
    
    // Mock getSiteByHostname to return the mock site
    const { getSiteByHostname } = require('../../../src/lib/site-utils');
    (getSiteByHostname as jest.Mock).mockResolvedValue(mockSite);
    
    // Mock site keys and sites data
    const { kv } = require('../../../src/lib/redis-client');
    (kv.keys as jest.Mock).mockResolvedValue(['site:slug:test-site']);
    (kv.get as jest.Mock).mockResolvedValue(mockSite);
    
    // Create request with host header
    const request = new NextRequest('http://localhost:3000/api/site-info', {
      headers: {
        host: 'testsite.com',
      },
    });
    
    // Spy on console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('site');
    expect(data.site).toEqual({
      id: 'site1',
      name: 'Test Site',
      slug: 'test-site',
      domain: 'testsite.com',
    });
    expect(data.requestedHostname).toBe('testsite.com');
    
    // Verify the site utils function was called correctly
    expect(getSiteByHostname).toHaveBeenCalledWith('testsite.com');
  });

  it('should prioritize hostname from query parameter over host header', async () => {
    // Setup mock site data
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
    
    // Mock getSiteByHostname to return the mock site
    const { getSiteByHostname } = require('../../../src/lib/site-utils');
    (getSiteByHostname as jest.Mock).mockResolvedValue(mockSite);
    
    // Mock site keys and sites data
    const { kv } = require('../../../src/lib/redis-client');
    (kv.keys as jest.Mock).mockResolvedValue(['site:slug:test-site']);
    (kv.get as jest.Mock).mockResolvedValue(mockSite);
    
    // Create request with both host header and hostname query parameter
    const request = new NextRequest('http://localhost:3000/api/site-info?hostname=testsite.com', {
      headers: {
        host: 'different.com',
      },
    });
    
    // Spy on console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('site');
    expect(data.requestedHostname).toBe('testsite.com'); // Should use the query param
    expect(data.originalHost).toBe('different.com'); // Original host header
    expect(data.hostnameParam).toBe('testsite.com'); // Query parameter
    
    // Verify the site utils function was called correctly
    expect(getSiteByHostname).toHaveBeenCalledWith('testsite.com');
  });

  it('should handle when no site is found for hostname', async () => {
    // Mock getSiteByHostname to return null
    const { getSiteByHostname } = require('../../../src/lib/site-utils');
    (getSiteByHostname as jest.Mock).mockResolvedValue(null);
    
    // Mock site keys and sites data for fallback
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
    
    const { kv } = require('../../../src/lib/redis-client');
    (kv.keys as jest.Mock).mockResolvedValue(['site:slug:test-site']);
    (kv.get as jest.Mock).mockResolvedValue(mockSite);
    
    // Create request with nonexistent hostname
    const request = new NextRequest('http://localhost:3000/api/site-info', {
      headers: {
        host: 'nonexistent.com',
      },
    });
    
    // Spy on console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('site');
    expect(data.site).toEqual({
      id: 'site1',
      name: 'Test Site',
      slug: 'test-site',
      domain: 'testsite.com',
    });
    expect(data.requestedHostname).toBe('nonexistent.com');
    
    // Verify the site utils function was called correctly
    expect(getSiteByHostname).toHaveBeenCalledWith('nonexistent.com');
  });

  it('should handle subdomain matching', async () => {
    // Setup mock site data
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
    
    // Mock getSiteByHostname to return the mock site
    const { getSiteByHostname } = require('../../../src/lib/site-utils');
    (getSiteByHostname as jest.Mock).mockResolvedValue(mockSite);
    
    // Mock site keys and sites data
    const { kv } = require('../../../src/lib/redis-client');
    (kv.keys as jest.Mock).mockResolvedValue(['site:slug:test-site']);
    (kv.get as jest.Mock).mockResolvedValue(mockSite);
    
    // Create request with subdomain hostname
    const request = new NextRequest('http://localhost:3000/api/site-info', {
      headers: {
        host: 'test-site.mydirectory.com',
      },
    });
    
    // Spy on console.log
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('site');
    expect(data.lookupInfo.subdomain.match).toBe(true);
    expect(data.lookupInfo.subdomain.slug).toBe('test-site');
    
    // Verify the site utils function was called correctly
    expect(getSiteByHostname).toHaveBeenCalledWith('test-site.mydirectory.com');
  });

  it('should handle Redis errors gracefully', async () => {
    // Mock getSiteByHostname to throw an error
    const { getSiteByHostname } = require('../../../src/lib/site-utils');
    (getSiteByHostname as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
    
    // Mock the keys call to also throw an error
    const { kv } = require('../../../src/lib/redis-client');
    (kv.keys as jest.Mock).mockRejectedValue(new Error('Redis connection error'));
    
    // Create request
    const request = new NextRequest('http://localhost:3000/api/site-info', {
      headers: {
        host: 'testsite.com',
      },
    });
    
    // Spy on console.log and console.error
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Execute the route handler
    const response = await GET(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response - should still return a response with null site
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('site');
    expect(data.site).toBeNull();
    expect(data.requestedHostname).toBe('testsite.com');
    expect(data.availableSites).toEqual([]);
  });
});
