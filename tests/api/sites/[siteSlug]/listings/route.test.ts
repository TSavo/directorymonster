import { NextRequest, NextResponse } from 'next/server';
import { GET } from '@/app/api/sites/[siteSlug]/listings/route';
import { ListingService } from '@/services/ListingService';
import { SiteService } from '@/services/SiteService';
import { Listing } from '@/types';

// Mock the services
jest.mock('@/services/ListingService');
jest.mock('@/services/SiteService');

describe('GET /api/sites/[siteSlug]/listings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when site is not found', async () => {
    // Mock SiteService to return null (site not found)
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(null);

    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/non-existent/listings');

    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'non-existent' } });

    // Verify the response
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'Site not found' });

    // Verify SiteService was called correctly
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith('non-existent');
    expect(ListingService.getListingsBySiteId).not.toHaveBeenCalled();
  });

  it('should return listings when site is found', async () => {
    // Mock site
    const mockSite = { id: 'site-1', name: 'Test Site', slug: 'test-site' };
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(mockSite);
    
    // Mock listings
    const mockListings = { 
      results: [{ id: 'listing-1', name: 'Test Listing' }],
      pagination: { total: 1, totalPages: 1, page: 1, limit: 10 }
    };
    (ListingService.getListingsBySiteId as jest.Mock).mockResolvedValue(mockListings);
    
    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings');
    
    // Execute the route handler
    const response = await GET(request, { params: { siteSlug: 'test-site' } });
    
    // Verify response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockListings);
    
    // Verify service calls
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith('test-site');
    expect(ListingService.getListingsBySiteId).toHaveBeenCalledWith('site-1', expect.any(Object));
  });

  it('should pass filter parameters to ListingService', async () => {
    // Mock site and service responses
    const mockSite = { id: 'site-1', name: 'Test Site', slug: 'test-site' };
    (SiteService.getSiteBySlug as jest.Mock).mockResolvedValue(mockSite);
    (ListingService.getListingsBySiteId as jest.Mock).mockResolvedValue({ results: [] });
    
    // Create request with query parameters
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/listings?name=test&status=active&categoryId=cat-1&page=2&limit=20&sort=name&order=desc');
    
    // Execute the route handler
    await GET(request, { params: { siteSlug: 'test-site' } });
    
    // Verify filter parameters were passed correctly
    expect(ListingService.getListingsBySiteId).toHaveBeenCalledWith('site-1', {
      name: 'test',
      status: 'active',
      categoryId: 'cat-1',
      page: 2,
      limit: 20,
      sort: 'name',
      order: 'desc'
    });
  });
});
