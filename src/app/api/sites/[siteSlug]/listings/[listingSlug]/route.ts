import { NextRequest, NextResponse } from 'next/server';
import { SiteService } from '../../../../../../../services/SiteService';
import { ListingService } from '@/services/ListingService';
import { withCache } from '@/middleware/withCache';
import { withRedis } from '@/middleware/withRedis';
import { searchIndexer } from '@/lib/search-indexer';

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

/**
 * DELETE handler for deleting a specific listing by slug
 *
 * @param request The incoming request
 * @param params The route parameters
 * @returns A NextResponse with success or an error
 */
export const DELETE = withRedis(async function DELETE(
  request: NextRequest,
  { params }: { params: { siteSlug: string, listingSlug: string } }
): Promise<NextResponse> {
  const { siteSlug, listingSlug } = params;

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  // Get site by slug
  const site = await SiteService.getSiteBySlug(siteSlug);

  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }

  try {
    // Get listing by slug to verify it exists and belongs to this site
    const listing = await ListingService.getListingBySlug(site.id, listingSlug);

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify the listing belongs to this site
    if (listing.siteId !== site.id) {
      return NextResponse.json(
        { error: 'Listing does not belong to this site' },
        { status: 403 }
      );
    }

    // Delete the listing using a transaction for atomicity
    const success = await ListingService.deleteListing(site.id, listing.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      );
    }

    // Remove from search index
    try {
      await searchIndexer.removeListing(listing.id);
    } catch (indexError) {
      console.error('Error removing listing from search index:', indexError);
      // Continue with the response even if indexing fails
    }

    // Return success response
    return NextResponse.json(
      { success: true, message: 'Listing deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
});
