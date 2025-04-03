import { NextRequest, NextResponse } from 'next/server';
import { SiteService } from '@/services/SiteService';
import { CategoryService } from '@/services/CategoryService';
import { ListingService } from '@/services/ListingService';
import { withCache } from '@/middleware/withCache';

/**
 * GET handler for retrieving listings for a specific category within a site
 *
 * @param request The incoming request
 * @param params The route parameters
 * @returns A NextResponse with the listings or an error
 */
export const GET = withCache(async function GET(
  request: NextRequest,
  { params }: { params: { siteSlug: string, categorySlug: string } }
): Promise<NextResponse> {
  const { siteSlug, categorySlug } = params;

  // Get site by slug
  const site = await SiteService.getSiteBySlug(siteSlug);

  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }

  // Get category by slug
  const category = await CategoryService.getCategoryBySlug(site.id, categorySlug);

  if (!category) {
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    );
  }

  try {
    // Parse query parameters
    const url = new URL(request.url);
    const page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : undefined;
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : undefined;
    const name = url.searchParams.get('name') || undefined;
    const status = url.searchParams.get('status') || undefined;
    const sort = url.searchParams.get('sort') || undefined;
    let order: 'asc' | 'desc' | undefined = undefined;
    if (url.searchParams.get('order') === 'asc' || url.searchParams.get('order') === 'desc') {
      order = url.searchParams.get('order') as 'asc' | 'desc';
    }

    // Get listings for this site and category
    const listings = await ListingService.getListingsBySiteAndCategory(
      site.id,
      category.id,
      { page, limit, name, status, sort, order }
    );

    // Return the listings
    return NextResponse.json(listings);
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
});


