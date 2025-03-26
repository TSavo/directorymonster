import { getSiteByHostname, generateListingUrl, generateSiteBaseUrl, generateCategoryUrl, generateCategoryHref, generateListingHref } from '@/lib/site-utils';
import { SiteConfig } from '@/types';
import { kv, redis } from '@/lib/redis-client';
import { headers } from 'next/headers';

// Mock our Redis client
jest.mock('@/lib/redis-client', () => ({
  redis: {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
}));

// Mock Next.js headers
jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

describe('Site Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSiteByHostname', () => {
    it('should return site when domain matches', async () => {
      const mockSite: SiteConfig = {
        id: 'site_123',
        name: 'Test Site',
        slug: 'test-site',
        domain: 'test-site.com',
        primaryKeyword: 'test',
        metaDescription: 'A test site',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };
      
      (kv.get as jest.Mock).mockResolvedValue(mockSite);
      
      const result = await getSiteByHostname('test-site.com');
      
      expect(kv.get).toHaveBeenCalledWith('site:domain:test-site.com');
      expect(result).toEqual(mockSite);
    });
    
    it('should normalize hostname by removing port and protocol', async () => {
      const mockSite: SiteConfig = {
        id: 'site_123',
        name: 'Test Site',
        slug: 'test-site',
        domain: 'test-site.com',
        primaryKeyword: 'test',
        metaDescription: 'A test site',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };
      
      (kv.get as jest.Mock).mockResolvedValue(mockSite);
      
      // Test with protocol and port
      const result = await getSiteByHostname('http://test-site.com:3000');
      
      expect(kv.get).toHaveBeenCalledWith('site:domain:test-site.com');
      expect(result).toEqual(mockSite);
    });
    
    it('should check for subdomain when direct domain not found', async () => {
      const mockSite: SiteConfig = {
        id: 'site_123',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'A test site',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };
      
      // First call returns null (no direct domain match)
      // Second call returns the site (subdomain match)
      (kv.get as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockSite);
      
      const result = await getSiteByHostname('test-site.mydirectory.com');
      
      expect(kv.get).toHaveBeenNthCalledWith(1, 'site:domain:test-site.mydirectory.com');
      expect(kv.get).toHaveBeenNthCalledWith(2, 'site:slug:test-site');
      expect(result).toEqual(mockSite);
    });
    
    it('should fall back to direct slug lookup if previous methods fail', async () => {
      const mockSite: SiteConfig = {
        id: 'site_123',
        name: 'Test Site',
        slug: 'test-site',
        primaryKeyword: 'test',
        metaDescription: 'A test site',
        headerText: 'Test Site Header',
        defaultLinkAttributes: 'dofollow',
        createdAt: 1234567890,
        updatedAt: 1234567890,
      };
      
      // Clear previous mock implementations
      (kv.get as jest.Mock).mockReset();
      
      // Mock direct domain, subdomain, and slug lookup sequence
      (kv.get as jest.Mock).mockImplementation((key: string) => {
        if (key === 'site:domain:test-site') {
          return Promise.resolve(null);
        } else if (key === 'site:slug:test-site') {
          return Promise.resolve(mockSite);
        } else {
          return Promise.resolve(null);
        }
      });
      
      const result = await getSiteByHostname('test-site');
      
      expect(kv.get).toHaveBeenCalledWith('site:domain:test-site');
      expect(kv.get).toHaveBeenCalledWith('site:slug:test-site');
      expect(result).toEqual(mockSite);
    });
  });

  describe('URL generation utilities', () => {
    const siteWithDomain: SiteConfig = {
      id: 'site_123',
      name: 'Test Site',
      slug: 'test-site',
      domain: 'test-site.com',
      primaryKeyword: 'test',
      metaDescription: 'A test site',
      headerText: 'Test Site Header',
      defaultLinkAttributes: 'dofollow',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };
    
    const siteWithoutDomain: SiteConfig = {
      id: 'site_123',
      name: 'Test Site',
      slug: 'test-site',
      primaryKeyword: 'test',
      metaDescription: 'A test site',
      headerText: 'Test Site Header',
      defaultLinkAttributes: 'dofollow',
      createdAt: 1234567890,
      updatedAt: 1234567890,
    };

    describe('generateSiteBaseUrl', () => {
      it('should generate base URL with custom domain when available', () => {
        const url = generateSiteBaseUrl(siteWithDomain);
        expect(url).toBe('https://test-site.com');
      });
      
      it('should generate base URL with platform subdomain when no custom domain', () => {
        const url = generateSiteBaseUrl(siteWithoutDomain);
        expect(url).toBe('https://test-site.mydirectory.com');
      });
    });

    describe('generateCategoryUrl', () => {
      it('should generate category URL with custom domain when available', () => {
        const url = generateCategoryUrl(siteWithDomain, 'category-slug');
        expect(url).toBe('https://test-site.com/category-slug');
      });
      
      it('should generate category URL with platform subdomain when no custom domain', () => {
        const url = generateCategoryUrl(siteWithoutDomain, 'category-slug');
        expect(url).toBe('https://test-site.mydirectory.com/category-slug');
      });
    });

    describe('generateListingUrl', () => {
      it('should generate listing URL with custom domain when available', () => {
        const url = generateListingUrl(siteWithDomain, 'category-slug', 'listing-slug');
        expect(url).toBe('https://test-site.com/category-slug/listing-slug');
      });
      
      it('should generate listing URL with platform subdomain when no custom domain', () => {
        const url = generateListingUrl(siteWithoutDomain, 'category-slug', 'listing-slug');
        expect(url).toBe('https://test-site.mydirectory.com/category-slug/listing-slug');
      });
    });

    describe('generateCategoryHref', () => {
      it('should generate category href for use in Link components', () => {
        const href = generateCategoryHref('category-slug');
        expect(href).toBe('/category-slug');
      });
    });

    describe('generateListingHref', () => {
      it('should generate listing href for use in Link components', () => {
        const href = generateListingHref('category-slug', 'listing-slug');
        expect(href).toBe('/category-slug/listing-slug');
      });
    });
  });
});