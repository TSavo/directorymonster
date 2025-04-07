/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../src/middleware';

// Mock NextResponse
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      next: jest.fn().mockImplementation(() => {
        return {
          headers: new Map(),
          status: 200
        };
      }),
      rewrite: jest.fn().mockImplementation((url) => {
        return {
          headers: new Map(),
          status: 200,
          url: url.toString()
        };
      }),
      json: jest.fn().mockImplementation((body, options) => {
        return {
          headers: new Map(),
          status: options?.status || 200,
          body: JSON.stringify(body)
        };
      })
    }
  };
});

describe('Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should skip static assets', async () => {
    const request = new NextRequest(new Request('http://example.com/_next/static/file.js'));
    await middleware(request);
    expect(NextResponse.next).toHaveBeenCalled();
    expect(NextResponse.rewrite).not.toHaveBeenCalled();
  });

  it('should rewrite API paths to include site slug', async () => {
    // Create a request to a non-site-specific API endpoint
    const request = new NextRequest(new Request('http://hiking-gear.mydirectory.com/api/search?q=test'));

    // Call the middleware
    const response = await middleware(request);

    // Verify the URL was rewritten to include the site slug
    expect(NextResponse.rewrite).toHaveBeenCalled();
    expect(response.url).toContain('api/sites/hiking-gear/search');

    // Verify the original query parameters are preserved
    expect(response.url).toContain('q=test');

    // Verify the site slug was added to the headers
    expect(response.headers.get('x-site-slug')).toBe('hiking-gear');
  });

  it('should not rewrite already site-specific API paths', async () => {
    // Create a request to an already site-specific API endpoint
    const request = new NextRequest(new Request('http://example.com/api/sites/hiking-gear/search?q=test'));

    // Call the middleware
    await middleware(request);

    // Verify the URL was not rewritten
    expect(NextResponse.rewrite).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('should not rewrite admin API paths', async () => {
    // Create a request to an admin API endpoint
    const request = new NextRequest(new Request('http://example.com/api/admin/users'));

    // Call the middleware
    await middleware(request);

    // Verify the URL was not rewritten
    expect(NextResponse.rewrite).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('should not rewrite non-site-specific API paths', async () => {
    // Create a request to a non-site-specific API endpoint
    const request = new NextRequest(new Request('http://example.com/api/auth/login'));

    // Call the middleware
    await middleware(request);

    // Verify the URL was not rewritten
    expect(NextResponse.rewrite).not.toHaveBeenCalled();
    expect(NextResponse.next).toHaveBeenCalled();
  });

  it('should handle custom domains', async () => {
    // Create a request to a custom domain
    const request = new NextRequest(new Request('http://custom-domain.com/api/search?q=test'));

    // Call the middleware
    const response = await middleware(request);

    // Verify the URL was rewritten to include the site slug
    expect(NextResponse.rewrite).toHaveBeenCalled();

    // For custom domains, the slug is derived from the hostname
    expect(response.url).toContain('api/sites/custom-domain-com/search');

    // Verify the site slug was added to the headers
    expect(response.headers.get('x-site-slug')).toBe('custom-domain-com');
  });

  it('should handle debug site slug parameter', async () => {
    // Create a request with a debug site slug parameter
    const request = new NextRequest(new Request('http://example.com/api/search?q=test&siteSlug=debug-site'));

    // Call the middleware
    const response = await middleware(request);

    // Verify the URL was rewritten to include the debug site slug
    expect(NextResponse.rewrite).toHaveBeenCalled();
    expect(response.url).toContain('api/sites/debug-site/search');

    // Verify the site slug was added to the headers
    expect(response.headers.get('x-site-slug')).toBe('debug-site');
  });
});
