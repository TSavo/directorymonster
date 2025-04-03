import { NextRequest, NextResponse } from 'next/server';
import { redis, kv } from '@/lib/redis-client';
import { Listing, SiteConfig, Category } from '@/types';
import { withRedis } from '@/middleware/withRedis';
import { searchIndexer } from '@/lib/search-indexer';

export const GET = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string } }) => {
  // Parse query parameters
  const url = new URL(request.url);
  const categoryId = url.searchParams.get('categoryId');
  const siteSlug = params.siteSlug;

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  // Get site by slug
  console.log(`Looking for site with slug: ${siteSlug} using key: ${keyPrefix}site:slug:${siteSlug}`);
  let site = await kv.get<SiteConfig>(`${keyPrefix}site:slug:${siteSlug}`);

  // Parse the site if it's a string (sometimes Redis returns JSON strings)
  if (site && typeof site === 'string') {
    try {
      site = JSON.parse(site);
    } catch (e) {
      console.error('Error parsing site JSON:', e);
    }
  }

  console.log('Site found:', site);

  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }

  try {
    // Determine if we're in test mode
    const isTestMode = process.env.NODE_ENV === 'test';
    const keyPrefix = isTestMode ? 'test:' : '';

    // Get all listings for this site
    const siteId = site.id || (typeof site === 'object' && 'id' in site ? site.id : null);
    console.log(`Getting listings for site ID: ${siteId}`);
    const listingKeys = await kv.keys(`${keyPrefix}listing:site:${siteId}:*`);
    const listingsPromises = listingKeys.map(async (key) => await kv.get<Listing>(key));

    // Handle each promise individually to prevent one failure from breaking everything
    const listings: Listing[] = [];
    for (let i = 0; i < listingsPromises.length; i++) {
      try {
        let listing = await listingsPromises[i];

        // Parse the listing if it's a string
        if (listing && typeof listing === 'string') {
          try {
            listing = JSON.parse(listing);
          } catch (e) {
            console.error('Error parsing listing JSON:', e);
          }
        }

        if (listing) {
          // Ensure the listing has the site ID
          if (!listing.siteId && siteId) {
            listing.siteId = siteId;
          }

          listings.push(listing);
        }
      } catch (error) {
        console.error(`Error fetching listing at index ${i}:`, error);
        // Continue with other listings
      }
    }

    console.log('Retrieved listings:', listings);

    // Filter by category if categoryId is provided
    let filteredListings = listings;
    if (categoryId) {
      console.log(`Filtering listings by category ID: ${categoryId}`);
      filteredListings = listings.filter(listing => listing.categoryId === categoryId);
      console.log('Filtered listings:', filteredListings);
    }

    // Parse pagination parameters with validation
    let page = parseInt(url.searchParams.get('page') || '1', 10);
    let limit = parseInt(url.searchParams.get('limit') || '10', 10);

    // Validate pagination parameters
    if (isNaN(page) || page < 1) {
      page = 1; // Default to page 1 for invalid values
    }

    if (isNaN(limit) || limit < 1) {
      limit = 10; // Default to 10 items per page for invalid values
    } else if (limit > 100) {
      limit = 100; // Cap at 100 items per page
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedListings = filteredListings.slice(startIndex, endIndex);

    // Always return paginated results with pagination metadata
    return NextResponse.json({
      results: paginatedListings,
      pagination: {
        totalResults: filteredListings.length,
        totalPages: Math.ceil(filteredListings.length / limit),
        currentPage: page,
        limit,
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

export const POST = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string } }) => {
  const siteSlug = params.siteSlug;

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  // Get site by slug
  console.log(`[POST] Looking for site with slug: ${siteSlug} using key: ${keyPrefix}site:slug:${siteSlug}`);
  let site = await kv.get<SiteConfig>(`${keyPrefix}site:slug:${siteSlug}`);

  // Parse the site if it's a string (sometimes Redis returns JSON strings)
  if (site && typeof site === 'string') {
    try {
      site = JSON.parse(site);
    } catch (e) {
      console.error('Error parsing site JSON:', e);
    }
  }

  console.log('[POST] Site found:', site);

  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }

  try {
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.categoryId || !data.metaDescription || !data.content || !data.backlinkUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await kv.get<Category>(`${keyPrefix}category:id:${data.categoryId}`);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Generate a slug from the title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingListing = await kv.get(`${keyPrefix}listing:site:${site.id}:${slug}`);
    if (existingListing) {
      return NextResponse.json(
        { error: 'A listing with a similar title already exists' },
        { status: 409 }
      );
    }

    // Create new listing
    const timestamp = Date.now();
    const siteId = site.id || (typeof site === 'object' && 'id' in site ? site.id : null);
    console.log(`Creating listing with site ID: ${siteId}`);
    const listing: Listing = {
      id: `listing_${timestamp}`,
      siteId: siteId,
      categoryId: data.categoryId,
      title: data.title,
      slug,
      metaDescription: data.metaDescription,
      content: data.content,
      imageUrl: data.imageUrl,
      backlinkUrl: data.backlinkUrl,
      backlinkAnchorText: data.backlinkAnchorText || data.title,
      backlinkPosition: data.backlinkPosition || 'prominent',
      backlinkType: data.backlinkType || 'dofollow',
      customFields: data.customFields || {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    console.log('Created listing:', listing);

    // We already checked for existing listings above, so we can proceed

    // Use a transaction for atomicity
    const transaction = kv.multi();

    // Store the listing in multiple indices for efficient retrieval
    transaction.set(`${keyPrefix}listing:id:${listing.id}`, listing);
    transaction.set(`${keyPrefix}listing:site:${site.id}:${listing.slug}`, listing);
    transaction.set(`${keyPrefix}listing:category:${listing.categoryId}:${listing.slug}`, listing);

    try {
      // Execute the transaction
      await transaction.exec();
    } catch (error) {
      console.error('Transaction error:', error);
      return NextResponse.json(
        { error: 'Failed to save listing data' },
        { status: 500 }
      );
    }

    // Index the listing for search (this is isolated from the transaction with error handling)
    try {
      await searchIndexer.indexListing(listing);
    } catch (error) {
      // Log but don't fail the request if indexing fails
      console.error('Error indexing listing:', error);
    }

    // Return the listing with URLs
    const baseUrl = site.domain
      ? `https://${site.domain}`
      : `http://localhost:3000`; // For local testing

    // Get the category slug for the URL
    let categorySlug = '';
    try {
      if (category && typeof category === 'object' && 'slug' in category) {
        categorySlug = category.slug;
      } else if (typeof category === 'string') {
        const parsedCategory = JSON.parse(category);
        categorySlug = parsedCategory.slug;
      }
    } catch (e) {
      console.error('Error parsing category:', e);
    }

    const responseData = {
      ...listing,
      url: `${baseUrl}/${categorySlug}/${listing.slug}`,
    };

    console.log('Returning response data:', responseData);

    return NextResponse.json(responseData, { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Failed to save listing data' },
      { status: 500 }
    );
  }
});