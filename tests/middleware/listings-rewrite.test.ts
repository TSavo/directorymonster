import { NextRequest, NextResponse } from 'next/server';
import { rewriteListingsUrl } from '@/middleware/listings-rewrite';

describe('Listings URL Rewriting Middleware', () => {
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
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should rewrite /site/[siteSlug]/listings to /api/sites/[siteSlug]/categories/all/listings', () => {
    // Create a request with the old URL pattern
    mockRequest = new NextRequest(new URL('http://localhost:3000/site/test-site/listings'));
    
    // Call the middleware
    const response = rewriteListingsUrl(mockRequest);
    
    // Verify the URL was rewritten correctly
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/api/sites/test-site/categories/all/listings');
  });
  
  it('should rewrite /site/[siteSlug]/listings/[listingSlug] to /api/sites/[siteSlug]/listings/[listingSlug]', () => {
    // Create a request with the old URL pattern
    mockRequest = new NextRequest(new URL('http://localhost:3000/site/test-site/listings/test-listing'));
    
    // Call the middleware
    const response = rewriteListingsUrl(mockRequest);
    
    // Verify the URL was rewritten correctly
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/api/sites/test-site/listings/test-listing');
  });
  
  it('should rewrite /site/[siteSlug]/category/[categorySlug]/listings to /api/sites/[siteSlug]/categories/[categorySlug]/listings', () => {
    // Create a request with the old URL pattern
    mockRequest = new NextRequest(new URL('http://localhost:3000/site/test-site/category/test-category/listings'));
    
    // Call the middleware
    const response = rewriteListingsUrl(mockRequest);
    
    // Verify the URL was rewritten correctly
    expect(response.headers.get('x-middleware-rewrite')).toBe('http://localhost:3000/api/sites/test-site/categories/test-category/listings');
  });
  
  it('should not rewrite non-listings URLs', () => {
    // Create a request with a different URL pattern
    mockRequest = new NextRequest(new URL('http://localhost:3000/api/other-endpoint'));
    
    // Call the middleware
    const response = rewriteListingsUrl(mockRequest);
    
    // Verify the URL was not rewritten
    expect(response.headers.get('x-middleware-rewrite')).toBeNull();
  });
});
