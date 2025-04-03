import { NextRequest, NextResponse } from 'next/server';
import { resolveSiteMiddleware } from '@/middleware/site-resolver';
import * as siteUtils from '@/lib/site-utils';

describe('Site Resolver Middleware', () => {
  let mockRequest: NextRequest;
  let mockResponse: NextResponse;

  beforeEach(() => {
    mockResponse = {
      headers: new Headers(),
    } as unknown as NextResponse;

    // Mock NextResponse.next
    jest.spyOn(NextResponse, 'next').mockImplementation(() => mockResponse);

    // Mock NextResponse.rewrite
    jest.spyOn(NextResponse, 'rewrite').mockImplementation((url) => {
      mockResponse.headers.set('x-middleware-rewrite', url.toString());
      return mockResponse;
    });

    // Mock getSiteByHostname
    jest.spyOn(siteUtils, 'getSiteByHostname').mockImplementation(async (hostname) => {
      if (hostname.includes('test-site')) {
        return {
          id: 'site_1',
          name: 'Test Site',
          slug: 'test-site',
          domain: 'test-site.example.com',
          tenantId: 'tenant_1',
          createdAt: 1234567890,
          updatedAt: 1234567890,
        };
      }
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should resolve site from domain and rewrite URL', async () => {
    // Create a request with a custom domain
    mockRequest = new NextRequest(
      new URL('http://test-site.example.com/categories/test-category/listings'),
      { headers: new Headers({ 'host': 'test-site.example.com' }) }
    );

    // Call the middleware
    const response = await resolveSiteMiddleware(mockRequest);

    // Verify the URL was rewritten with the site slug from the domain
    expect(response.headers.get('x-middleware-rewrite'))
      .toBe('http://test-site.example.com/api/sites/test-site/categories/test-category/listings');
  });

  it('should resolve site from query parameter and rewrite URL', async () => {
    // Create a request with a site query parameter
    mockRequest = new NextRequest(
      new URL('http://localhost:3000/categories/test-category/listings?site=test-site')
    );

    // Call the middleware
    const response = await resolveSiteMiddleware(mockRequest);

    // Verify the URL was rewritten with the site slug from the query parameter
    expect(response.headers.get('x-middleware-rewrite'))
      .toBe('http://localhost:3000/api/sites/test-site/categories/test-category/listings');
  });

  it('should resolve site from subdomain and rewrite URL', async () => {
    // Create a request with a subdomain
    mockRequest = new NextRequest(
      new URL('http://test-site.localhost:3000/categories/test-category/listings'),
      { headers: new Headers({ 'host': 'test-site.localhost:3000' }) }
    );

    // Call the middleware
    const response = await resolveSiteMiddleware(mockRequest);

    // Verify the URL was rewritten with the site slug from the subdomain
    expect(response.headers.get('x-middleware-rewrite'))
      .toBe('http://test-site.localhost:3000/api/sites/test-site/categories/test-category/listings');
  });

  it('should resolve site from path and rewrite URL', async () => {
    // Create a request with site in the path
    mockRequest = new NextRequest(
      new URL('http://localhost:3000/site/test-site/categories/test-category/listings')
    );

    // Call the middleware
    const response = await resolveSiteMiddleware(mockRequest);

    // Verify the URL was rewritten with the site slug from the path
    expect(response.headers.get('x-middleware-rewrite'))
      .toBe('http://localhost:3000/api/sites/test-site/categories/test-category/listings');
  });

  it('should not rewrite non-listings URLs', async () => {
    // Create a request with a different URL pattern
    mockRequest = new NextRequest(new URL('http://localhost:3000/api/other-endpoint'));

    // Call the middleware
    const response = await resolveSiteMiddleware(mockRequest);

    // Verify the URL was not rewritten
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });
});
