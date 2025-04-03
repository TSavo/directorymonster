import { NextRequest, NextResponse } from 'next/server';
import { SiteService } from '@/services/SiteService';
import { ListingService } from '@/services/ListingService';
import { withCache } from '@/middleware/withCache';

/**
 * GET handler for retrieving a specific listing by slug
 * 
 * @param request The incoming request
 * @param params The route parameters
 * @returns A NextResponse with the listing or an error
 */
export const GET = withCache(async function GET(
  request: NextRequest,
  { params }: { params: { siteSlug: string, listingSlug: string } }
): Promise<NextResponse> {
  const { siteSlug, listingSlug } = params;
  
  // Get site by slug
  const site = await SiteService.getSiteBySlug(siteSlug);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    // Get listing by slug
    const listing = await ListingService.getListingBySlug(site.id, listingSlug);
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Return the listing
    return NextResponse.json(listing);
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
});
