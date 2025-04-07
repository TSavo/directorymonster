/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { POST } from '@/app/api/sites/[siteSlug]/domains/verify/route';
import dns from 'dns';
import { promisify } from 'util';

// Mock the dns module
jest.mock('dns', () => ({
  resolveCname: jest.fn(),
  resolve4: jest.fn()
}));

// Mock the promisify function
jest.mock('util', () => ({
  ...jest.requireActual('util'),
  promisify: jest.fn((fn) => {
    if (fn === dns.resolveCname) {
      return jest.fn().mockImplementation(async (domain) => {
        if (domain === 'www.example.com') {
          return ['test-site.mydirectory.com'];
        } else if (domain === 'www.invalid.com') {
          return ['wrong-site.example.com'];
        } else if (domain === 'www.error.com') {
          throw new Error('DNS resolution failed');
        }
        return [];
      });
    } else if (fn === dns.resolve4) {
      return jest.fn().mockImplementation(async (domain) => {
        if (domain === 'example.com') {
          return ['76.76.21.21'];
        } else if (domain === 'invalid.com') {
          return ['1.2.3.4'];
        } else if (domain === 'error.com') {
          throw new Error('DNS resolution failed');
        }
        return [];
      });
    }
    return fn;
  })
}));

// Mock Redis client
jest.mock('@/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn()
  }
}));

describe('Domain Verification API', () => {
  const mockSiteSlug = 'test-site';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redis get to return a site
    const { kv } = require('@/lib/redis-client');
    kv.get.mockImplementation((key) => {
      if (key === `test:site:slug:${mockSiteSlug}`) {
        return {
          id: 'site1',
          name: 'Test Site',
          slug: mockSiteSlug,
          domains: ['example.com', 'invalid.com', 'error.com']
        };
      }
      return null;
    });
    
    // Mock Redis set to return true
    kv.set.mockResolvedValue(true);
    
    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';
  });
  
  it('returns 400 if domain is not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({})
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Domain is required');
  });
  
  it('returns 404 if site is not found', async () => {
    const { kv } = require('@/lib/redis-client');
    kv.get.mockResolvedValue(null);
    
    const request = new NextRequest('http://localhost:3000/api/sites/nonexistent-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: 'example.com' })
    });
    
    const response = await POST(request, { params: { siteSlug: 'nonexistent-site' } });
    const data = await response.json();
    
    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Site not found');
  });
  
  it('returns 400 if domain is not associated with the site', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: 'unassociated-domain.com' })
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Domain is not associated with this site');
  });
  
  it('automatically verifies test domains', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: 'test.com' })
    });
    
    // Update the mock site to include the test domain
    const { kv } = require('@/lib/redis-client');
    kv.get.mockImplementation((key) => {
      if (key === `test:site:slug:${mockSiteSlug}`) {
        return {
          id: 'site1',
          name: 'Test Site',
          slug: mockSiteSlug,
          domains: ['test.com', 'example.com']
        };
      }
      return null;
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.verified).toBe(true);
    expect(data.message).toBe('Domain verified successfully');
    
    // Verify that the site was updated with the verified domain
    expect(kv.set).toHaveBeenCalled();
  });
  
  it('verifies domain with correct DNS records', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: 'example.com' })
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.verified).toBe(true);
    expect(data.message).toBe('Domain verified successfully');
    
    // Verify that the site was updated with the verified domain
    expect(kv.set).toHaveBeenCalled();
  });
  
  it('fails verification with incorrect A record', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: 'invalid.com' })
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.verified).toBe(false);
    expect(data.errors).toContain('A record is not correctly configured');
  });
  
  it('handles DNS resolution errors gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: 'error.com' })
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.verified).toBe(false);
    expect(data.errors).toContain('Could not verify domain DNS records');
  });
  
  it('updates domain verification status in site configuration', async () => {
    const { kv } = require('@/lib/redis-client');
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: 'example.com' })
    });
    
    await POST(request, { params: { siteSlug: mockSiteSlug } });
    
    // Verify that the site was updated with the verified domain
    expect(kv.set).toHaveBeenCalledWith(`test:site:slug:${mockSiteSlug}`, expect.objectContaining({
      domains: expect.arrayContaining([
        expect.objectContaining({
          name: 'example.com',
          verified: true
        })
      ])
    }));
  });
  
  it('handles domains that are already objects with verification status', async () => {
    const { kv } = require('@/lib/redis-client');
    
    // Mock site with domain objects instead of strings
    kv.get.mockImplementation((key) => {
      if (key === `test:site:slug:${mockSiteSlug}`) {
        return {
          id: 'site1',
          name: 'Test Site',
          slug: mockSiteSlug,
          domains: [
            { name: 'example.com', verified: false },
            { name: 'invalid.com', verified: false }
          ]
        };
      }
      return null;
    });
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: 'example.com' })
    });
    
    await POST(request, { params: { siteSlug: mockSiteSlug } });
    
    // Verify that the site was updated with the verified domain
    expect(kv.set).toHaveBeenCalledWith(`test:site:slug:${mockSiteSlug}`, expect.objectContaining({
      domains: expect.arrayContaining([
        expect.objectContaining({
          name: 'example.com',
          verified: true
        })
      ])
    }));
  });
});
