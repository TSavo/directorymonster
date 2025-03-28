import { NextRequest, NextResponse } from 'next/server';
import { redis, kv } from '@/lib/redis-client';
import { Listing, SiteConfig, Category } from '@/types';
import { withRedis } from '@/middleware/withRedis';
import { searchIndexer } from '@/lib/search-indexer';

export const GET = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string } }) => {
  const siteSlug = params.siteSlug;
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    // Get all listings for this site
    const listingKeys = await kv.keys(`listing:site:${site.id}:*`);
    const listingsPromises = listingKeys.map(async (key) => await kv.get<Listing>(key));
    
    // Handle each promise individually to prevent one failure from breaking everything
    const listings: Listing[] = [];
    for (let i = 0; i < listingsPromises.length; i++) {
      try {
        const listing = await listingsPromises[i];
        if (listing) {
          listings.push(listing);
        }
      } catch (error) {
        console.error(`Error fetching listing at index ${i}:`, error);
        // Continue with other listings
      }
    }
    
    return NextResponse.json(listings);
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
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  
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
    const category = await kv.get<Category>(`category:id:${data.categoryId}`);
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
    const existingListing = await kv.get(`listing:site:${site.id}:${slug}`);
    if (existingListing) {
      return NextResponse.json(
        { error: 'A listing with a similar title already exists' },
        { status: 409 }
      );
    }
    
    // Create new listing
    const timestamp = Date.now();
    const listing: Listing = {
      id: `listing_${timestamp}`,
      siteId: site.id,
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
    
    // Use a Redis transaction for atomicity
    const multi = redis.multi();
    
    multi.set(`listing:id:${listing.id}`, JSON.stringify(listing));
    multi.set(`listing:site:${site.id}:${listing.slug}`, JSON.stringify(listing));
    multi.set(`listing:category:${listing.categoryId}:${listing.slug}`, JSON.stringify(listing));
    
    try {
      // Execute all commands as a transaction
      const results = await multi.exec();
      
      // Check for errors in the transaction
      const errors = results.filter(([err]) => err !== null);
      if (errors.length > 0) {
        console.error('Transaction errors:', errors);
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
        
      return NextResponse.json({
        ...listing,
        url: `${baseUrl}/${category.slug}/${listing.slug}`,
      }, { status: 201 });
    } catch (error) {
      console.error('Error executing Redis transaction:', error);
      return NextResponse.json(
        { error: 'Failed to save listing data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});