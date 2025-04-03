import { NextRequest, NextResponse } from 'next/server';
import { ListingService } from '@/services/ListingService';
import { withCache } from '@/middleware/withCache';

// Import the actual services
import { SiteService } from '@/lib/site-service';
import { CategoryService } from '@/lib/category-service';

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
    // Default parameters
    let page = 1;
    let limit = 20;
    let name: string | undefined = undefined;
    let status: string | undefined = undefined;
    let featured: boolean | undefined = undefined;
    let sort = 'createdAt';
    let order: 'asc' | 'desc' = 'desc';

    // Parse query parameters if URL is available
    if (request.url) {
      try {
        const url = new URL(request.url);

        // Pagination parameters
        page = url.searchParams.get('page') ? parseInt(url.searchParams.get('page')!, 10) : 1;
        limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 20;

        // Validate pagination parameters
        if (isNaN(page) || page < 1 || isNaN(limit) || limit < 1 || limit > 100) {
          return NextResponse.json(
            { error: 'Invalid pagination parameters. Page must be >= 1 and limit must be between 1 and 100.' },
            { status: 400 }
          );
        }

        // Filtering parameters
        name = url.searchParams.get('name') || undefined;
        status = url.searchParams.get('status') || undefined;
        featured = url.searchParams.get('featured') === 'true' ? true : undefined;

        // Sorting parameters
        sort = url.searchParams.get('sort') || 'createdAt';
        order = url.searchParams.get('order') === 'asc' ? 'asc' : 'desc';
      } catch (urlError) {
        console.warn('Error parsing URL:', urlError);
        // Continue with default parameters
      }
    }

    // Get listings for this site and category
    const listingsResponse = await ListingService.getListingsBySiteAndCategory(
      site.id,
      category.id,
      {
        page,
        limit,
        name,
        status,
        sort,
        order,
        featured
      }
    );

    // Enhance the response with site and category information
    const enhancedResponse = {
      ...listingsResponse,
      site: {
        id: site.id,
        name: site.name,
        slug: site.slug
      },
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description
      }
    };

    // Return the listings with cache headers
    return NextResponse.json(enhancedResponse, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'Surrogate-Control': 'max-age=300'
      }
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
});


