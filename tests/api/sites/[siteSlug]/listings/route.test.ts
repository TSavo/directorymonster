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
});
