/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/sites/[siteSlug]/domains/verify/route';
import dns from 'dns';

// Mock the dns module
jest.mock('dns', () => ({
  resolveCname: jest.fn(),
  resolve4: jest.fn()
}));

// Mock Redis client
jest.mock('../../../../src/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn()
  }
}));

describe('Domain Verification API', () => {
  const mockSiteSlug = 'test-site';
  const mockDomain = 'example.com';
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock Redis get to return a site
    const { kv } = require('../../../../src/lib/redis-client');
    kv.get.mockImplementation((key) => {
      if (key === `test:site:slug:${mockSiteSlug}`) {
        return {
          id: 'site1',
          name: 'Test Site',
          slug: mockSiteSlug,
          domains: [mockDomain]
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
    const { kv } = require('../../../../src/lib/redis-client');
    kv.get.mockResolvedValue(null);
    
    const request = new NextRequest('http://localhost:3000/api/sites/nonexistent-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: mockDomain })
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
    const { kv } = require('../../../../src/lib/redis-client');
    kv.get.mockImplementation((key) => {
      if (key === `test:site:slug:${mockSiteSlug}`) {
        return {
          id: 'site1',
          name: 'Test Site',
          slug: mockSiteSlug,
          domains: ['test.com', mockDomain]
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
    // Mock DNS resolution to return correct values
    (dns.resolve4 as jest.Mock).mockImplementation((domain, callback) => {
      callback(null, ['76.76.21.21']);
    });
    
    (dns.resolveCname as jest.Mock).mockImplementation((domain, callback) => {
      callback(null, [`${mockSiteSlug}.mydirectory.com`]);
    });
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: mockDomain })
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.verified).toBe(true);
    expect(data.message).toBe('Domain verified successfully');
  });
  
  it('fails verification with incorrect A record', async () => {
    // Mock DNS resolution to return incorrect A record
    (dns.resolve4 as jest.Mock).mockImplementation((domain, callback) => {
      callback(null, ['1.2.3.4']);
    });
    
    (dns.resolveCname as jest.Mock).mockImplementation((domain, callback) => {
      callback(null, [`${mockSiteSlug}.mydirectory.com`]);
    });
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: mockDomain })
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.verified).toBe(false);
    expect(data.errors).toContain('A record is not correctly configured');
  });
  
  it('fails verification with incorrect CNAME record', async () => {
    // Mock DNS resolution to return correct A record but incorrect CNAME
    (dns.resolve4 as jest.Mock).mockImplementation((domain, callback) => {
      callback(null, ['76.76.21.21']);
    });
    
    (dns.resolveCname as jest.Mock).mockImplementation((domain, callback) => {
      callback(null, ['wrong-site.example.com']);
    });
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: mockDomain })
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.verified).toBe(false);
    expect(data.errors).toContain('CNAME record for www subdomain is not correctly configured');
  });
  
  it('handles DNS resolution errors gracefully', async () => {
    // Mock DNS resolution to throw an error
    (dns.resolve4 as jest.Mock).mockImplementation((domain, callback) => {
      callback(new Error('DNS resolution failed'), null);
    });
    
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/domains/verify', {
      method: 'POST',
      body: JSON.stringify({ domain: mockDomain })
    });
    
    const response = await POST(request, { params: { siteSlug: mockSiteSlug } });
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(false);
    expect(data.verified).toBe(false);
    expect(data.errors).toContain('Could not verify domain DNS records');
  });
});
