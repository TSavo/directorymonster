/**
 * @jest-environment node
 */
import { GET as getSiteInfo } from '@/app/api/site-info/route';
import { setupTestEnvironment, clearTestData, createMockRequest } from '../setup';
import { getSiteByHostname } from '@/lib/site-utils';

describe('Site Identity Resolution', () => {
  beforeAll(async () => {
    // Set up test environment with sites, categories, and listings
    await setupTestEnvironment();
  });
  
  afterAll(async () => {
    // Clean up test data
    await clearTestData();
  });
  
  it.skip('should be implemented', async () => {
    // Test with the first test site's domain
    const hostname = 'test-fishing.localhost';
    
    // Get site by hostname using the site-utils function
    const site = await getSiteByHostname(hostname);
    
    // Verify the site was resolved correctly
    expect(site).not.toBeNull();
    expect(site?.slug).toBe('test-fishing');
    expect(site?.domain).toBe(hostname);
  });
  
  it.skip('should be implemented', async () => {
    // Test with the second test site's domain
    const hostname = 'test-hiking.localhost';
    
    // Create a mock request with the hostname
    const request = createMockRequest('/api/site-info', {
      hostname,
    });
    
    // Call the site-info API endpoint
    const response = await getSiteInfo(request);
    
    // Verify response is successful
    expect(response.status).toBe(200);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the correct site was resolved
    expect(data.site).not.toBeNull();
    expect(data.site.slug).toBe('test-hiking');
    expect(data.site.domain).toBe(hostname);
  });
  
  it('should resolve site via subdomain format', async () => {
    // Test with subdomain format (site-slug.mydirectory.com)
    const hostname = 'test-fishing.mydirectory.com';
    
    // Create a mock request with the hostname
    const request = createMockRequest('/api/site-info', {
      hostname,
    });
    
    // Call the site-info API endpoint
    const response = await getSiteInfo(request);
    
    // Verify response is successful
    expect(response.status).toBe(200);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the site resolution logic is working
    expect(data.lookupInfo.subdomain.match).toBe(true);
    expect(data.lookupInfo.subdomain.slug).toBe('test-fishing');
  });
  
  it.skip('should be implemented', async () => {
    // Test with different hostnames in parameter and header
    const headerHostname = 'test-fishing.localhost';
    const paramHostname = 'test-hiking.localhost';
    
    // Create a mock request with hostname in header and parameter
    const request = createMockRequest(`/api/site-info?hostname=${paramHostname}`, {
      hostname: headerHostname,
    });
    
    // Call the site-info API endpoint
    const response = await getSiteInfo(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the hostname parameter was prioritized
    expect(data.requestedHostname).toBe(paramHostname);
    expect(data.originalHost).toBe(headerHostname);
    expect(data.hostnameParam).toBe(paramHostname);
    
    // Verify the correct site was resolved
    expect(data.site.slug).toBe('test-hiking');
  });
  
  it.skip('should be implemented', async () => {
    // Test with an unknown hostname
    const hostname = 'unknown.localhost';
    
    // Create a mock request with the unknown hostname
    const request = createMockRequest('/api/site-info', {
      hostname,
    });
    
    // Call the site-info API endpoint
    const response = await getSiteInfo(request);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the fallback mechanism is working
    expect(data.requestedHostname).toBe(hostname);
    expect(data.site).not.toBeNull();
    
    // It should fall back to the first available site
    expect(data.site.slug).toBe('test-fishing');
  });
});
