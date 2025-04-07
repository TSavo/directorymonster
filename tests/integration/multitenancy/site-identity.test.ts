/**
 * @jest-environment node
 */
import { GET as getSiteInfo } from '@/app/api/sites/[siteSlug]/info/route';
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

  it('should resolve site by hostname', async () => {
    // Test with the first test site's domain
    const hostname = 'test-fishing.localhost';

    // Get site by hostname using the site-utils function
    const site = await getSiteByHostname(hostname);

    // Verify the site was resolved correctly
    expect(site).not.toBeNull();
    expect(site?.slug).toBe('test-fishing');
    expect(site?.domain).toBe(hostname);
  });

  it('should resolve site via site-info API endpoint', async () => {
    // Test with the second test site's domain
    const hostname = 'test-hiking.localhost';

    // Get the site by hostname first to determine the slug
    const site = await getSiteByHostname(hostname);
    expect(site).not.toBeNull();

    // Create a mock request for the site-specific info API
    const request = createMockRequest(`/api/sites/${site!.slug}/info`);

    // Call the site-specific info API endpoint
    const response = await getSiteInfo(request, { params: { siteSlug: site!.slug } });

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

    // Get the site by hostname first to determine the slug
    const site = await getSiteByHostname(hostname);
    expect(site).not.toBeNull();

    // Create a mock request for the site-specific info API
    const request = createMockRequest(`/api/sites/${site!.slug}/info`);

    // Call the site-specific info API endpoint
    const response = await getSiteInfo(request, { params: { siteSlug: site!.slug } });

    // Verify response is successful
    expect(response.status).toBe(200);

    // Parse the response
    const data = await response.json();

    // Verify the site info is correct
    expect(data.site.slug).toBe(site!.slug);
    expect(data.site.name).toBe(site!.name);
  });

  it('should use site-specific API instead of hostname parameter', async () => {
    // With the new site-specific API, we don't need to use hostname parameters
    // Instead, we directly use the site slug in the URL
    const siteSlug = 'test-hiking';

    // Get the site by slug
    const site = await getSiteByHostname(siteSlug);
    expect(site).not.toBeNull();

    // Create a mock request for the site-specific info API
    const request = createMockRequest(`/api/sites/${siteSlug}/info`);

    // Call the site-specific info API endpoint
    const response = await getSiteInfo(request, { params: { siteSlug } });

    // Parse the response
    const data = await response.json();

    // Verify we got the correct site
    expect(data.site.slug).toBe(siteSlug);
  });

  it('should return 404 when site slug is not recognized', async () => {
    // Test with an unknown site slug
    const siteSlug = 'unknown-site';

    // Create a mock request for the site-specific info API
    const request = createMockRequest(`/api/sites/${siteSlug}/info`);

    // Call the site-specific info API endpoint
    const response = await getSiteInfo(request, { params: { siteSlug } });

    // Verify we get a 404 response
    expect(response.status).toBe(404);

    // Parse the response
    const data = await response.json();

    // Verify the error message
    expect(data.error).toBe('Site not found');
  });
});
