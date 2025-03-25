import { getSiteByHostname, getSiteIdentity } from '@/lib/site-utils';
import { SiteConfig } from '@/types';
import { kv } from '@/lib/redis-client';
import fetch from 'node-fetch';
import { NextRequest } from 'next/server';

// Mock our Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn()
  }
}));

// Mock Next.js request - simplify to avoid requireActual issues
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation(() => ({
    headers: {
      get: jest.fn()
    }
  }))
}));

describe('Multitenancy Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up standard site configs
    const mockFishingSite: SiteConfig = {
      id: 'site_fishing',
      name: 'Fishing Gear Reviews',
      slug: 'fishing-gear',
      domain: 'fishinggearreviews.com',
      primaryKeyword: 'fishing gear',
      metaDescription: 'Reviews of the best fishing gear',
      headerText: 'Fishing Gear Reviews',
      defaultLinkAttributes: 'dofollow',
      createdAt: 1234567890,
      updatedAt: 1234567890
    };
    
    const mockHikingSite: SiteConfig = {
      id: 'site_hiking',
      name: 'Hiking Gear Directory',
      slug: 'hiking-gear',
      domain: 'hikinggearreviews.com',
      primaryKeyword: 'hiking gear',
      metaDescription: 'Directory of the best hiking gear',
      headerText: 'Hiking Gear Directory',
      defaultLinkAttributes: 'dofollow',
      createdAt: 1234567890,
      updatedAt: 1234567890
    };
    
    // Mock KV get for different key patterns
    (kv.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'site:domain:fishinggearreviews.com') {
        return Promise.resolve(mockFishingSite);
      } else if (key === 'site:domain:hikinggearreviews.com') {
        return Promise.resolve(mockHikingSite);
      } else if (key === 'site:slug:fishing-gear') {
        return Promise.resolve(mockFishingSite);
      } else if (key === 'site:slug:hiking-gear') {
        return Promise.resolve(mockHikingSite);
      } else {
        return Promise.resolve(null);
      }
    });
  });
  
  describe('getSiteByHostname with realistic hostnames', () => {
    it('should correctly resolve domain with port', async () => {
      const result = await getSiteByHostname('fishinggearreviews.com:3000');
      expect(result?.slug).toBe('fishing-gear');
      expect(kv.get).toHaveBeenCalledWith('site:domain:fishinggearreviews.com');
    });
    
    it('should correctly resolve domain with protocol', async () => {
      const result = await getSiteByHostname('http://fishinggearreviews.com');
      expect(result?.slug).toBe('fishing-gear');
      expect(kv.get).toHaveBeenCalledWith('site:domain:fishinggearreviews.com');
    });
    
    it('should correctly resolve domain with protocol and port', async () => {
      const result = await getSiteByHostname('https://fishinggearreviews.com:3000');
      expect(result?.slug).toBe('fishing-gear');
      expect(kv.get).toHaveBeenCalledWith('site:domain:fishinggearreviews.com');
    });
    
    it('should correctly resolve subdomain format', async () => {
      const result = await getSiteByHostname('fishing-gear.mydirectory.com');
      expect(result?.slug).toBe('fishing-gear');
      expect(kv.get).toHaveBeenNthCalledWith(1, 'site:domain:fishing-gear.mydirectory.com');
      expect(kv.get).toHaveBeenNthCalledWith(2, 'site:slug:fishing-gear');
    });
  });
  
  describe('getSiteIdentity with simulated requests', () => {
    it('should handle direct domain requests', async () => {
      const identity = await getSiteIdentity('fishinggearreviews.com', false, false);
      expect(identity.siteConfig?.slug).toBe('fishing-gear');
      expect(identity.isAdmin).toBe(false);
      expect(identity.isApiRequest).toBe(false);
    });
    
    it('should handle subdomain requests', async () => {
      const identity = await getSiteIdentity('hiking-gear.mydirectory.com', false, false);
      expect(identity.siteConfig?.slug).toBe('hiking-gear');
      expect(identity.isAdmin).toBe(false);
      expect(identity.isApiRequest).toBe(false);
    });
    
    it('should handle admin requests', async () => {
      const identity = await getSiteIdentity('any-domain.com', true, false);
      expect(identity.siteConfig).toBe(null);
      expect(identity.isAdmin).toBe(true);
      expect(identity.isApiRequest).toBe(false);
    });
    
    it('should handle API requests', async () => {
      const identity = await getSiteIdentity('api.fishing-gear.mydirectory.com', false, true);
      // This should match the site API pattern and return a site config
      expect(identity.siteConfig?.slug).toBe('fishing-gear');
      expect(identity.isAdmin).toBe(false);
      expect(identity.isApiRequest).toBe(true);
    });
  });
  
  describe('Simulated middleware environment with Headers', () => {
    it('should properly extract and normalize Host header', async () => {
      // Create a mock request with a Host header
      const headers = new Map();
      headers.set('host', 'fishinggearreviews.com:3000');
      
      (NextRequest as jest.Mock).mockImplementation(() => ({
        headers: {
          get: (name: string) => headers.get(name.toLowerCase())
        }
      }));
      
      const request = new NextRequest();
      const hostname = request.headers.get('host') || '';
      
      const result = await getSiteByHostname(hostname);
      expect(result?.slug).toBe('fishing-gear');
    });
    
    it('should properly handle subdomain Host header', async () => {
      // Create a mock request with a subdomain Host header
      const headers = new Map();
      headers.set('host', 'hiking-gear.mydirectory.com');
      
      (NextRequest as jest.Mock).mockImplementation(() => ({
        headers: {
          get: (name: string) => headers.get(name.toLowerCase())
        }
      }));
      
      const request = new NextRequest();
      const hostname = request.headers.get('host') || '';
      
      const result = await getSiteByHostname(hostname);
      expect(result?.slug).toBe('hiking-gear');
    });
  });
});