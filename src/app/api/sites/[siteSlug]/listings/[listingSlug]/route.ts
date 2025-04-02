import { NextRequest, NextResponse } from 'next/server';
import { kv, redis } from '@/lib/redis-client';
import { Listing } from '@/types';
import { withRedis } from '@/middleware/withRedis';
import { searchIndexer } from '@/lib/search-indexer';

export const GET = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string, listingSlug: string } }) => {
  const { siteSlug, listingSlug } = params;

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  // Get site by slug
  console.log(`Looking for site with slug: ${siteSlug} using key: ${keyPrefix}site:slug:${siteSlug}`);
  let site = await kv.get(`${keyPrefix}site:slug:${siteSlug}`);

  // Parse the site if it's a string
  if (site && typeof site === 'string') {
    try {
      site = JSON.parse(site);
    } catch (e) {
      console.error('Error parsing site JSON:', e);
    }
  }

  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }

  // Get listing by site ID and slug
  console.log(`Looking for listing with slug: ${listingSlug} in site: ${site.id}`);
  let listing = await kv.get(`${keyPrefix}listing:site:${site.id}:${listingSlug}`);

  // Parse the listing if it's a string
  if (listing && typeof listing === 'string') {
    try {
      listing = JSON.parse(listing);
    } catch (e) {
      console.error('Error parsing listing JSON:', e);
    }
  }

  if (!listing) {
    return NextResponse.json(
      { error: 'Listing not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(listing);
});

export const PUT = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string, listingSlug: string } }) => {
  const { siteSlug, listingSlug } = params;

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  try {
    // Get site by slug
    let site = await kv.get(`${keyPrefix}site:slug:${siteSlug}`);

    // Parse the site if it's a string
    if (site && typeof site === 'string') {
      try {
        site = JSON.parse(site);
      } catch (e) {
        console.error('Error parsing site JSON:', e);
      }
    }

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Get existing listing
    let existingListing = await kv.get(`${keyPrefix}listing:site:${site.id}:${listingSlug}`);

    // Parse the listing if it's a string
    if (existingListing && typeof existingListing === 'string') {
      try {
        existingListing = JSON.parse(existingListing);
      } catch (e) {
        console.error('Error parsing listing JSON:', e);
      }
    }

    if (!existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const data = await request.json();

    // Validate required fields
    if (!data.title || !data.categoryId || !data.metaDescription || !data.content || !data.backlinkUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await kv.get(`${keyPrefix}category:id:${data.categoryId}`);
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update listing
    const updatedListing: Listing = {
      ...existingListing,
      title: data.title,
      categoryId: data.categoryId,
      metaDescription: data.metaDescription,
      content: data.content,
      imageUrl: data.imageUrl,
      backlinkUrl: data.backlinkUrl,
      backlinkAnchorText: data.backlinkAnchorText || data.title,
      backlinkPosition: data.backlinkPosition || existingListing.backlinkPosition,
      backlinkType: data.backlinkType || existingListing.backlinkType,
      customFields: data.customFields || existingListing.customFields,
      updatedAt: Date.now(),
    };

    // Use a Redis transaction for atomicity
    const multi = redis.multi();

    // Update listing in all locations
    multi.set(`${keyPrefix}listing:id:${existingListing.id}`, JSON.stringify(updatedListing));
    multi.set(`${keyPrefix}listing:site:${site.id}:${listingSlug}`, JSON.stringify(updatedListing));
    multi.set(`${keyPrefix}listing:category:${updatedListing.categoryId}:${listingSlug}`, JSON.stringify(updatedListing));

    // If category changed, update category indexes
    if (existingListing.categoryId !== updatedListing.categoryId) {
      multi.srem(`${keyPrefix}category:${existingListing.categoryId}:listings`, existingListing.id);
      multi.sadd(`${keyPrefix}category:${updatedListing.categoryId}:listings`, existingListing.id);
    }

    // Execute transaction
    const results = await multi.exec();

    // Check for errors in the transaction
    const errors = results.filter(([err]) => err !== null);
    if (errors.length > 0) {
      console.error('Transaction errors:', errors);
      return NextResponse.json(
        { error: 'Failed to update listing data' },
        { status: 500 }
      );
    }

    // Update search index
    try {
      await searchIndexer.indexListing(updatedListing);
    } catch (error) {
      // Log but don't fail the request if indexing fails
      console.error('Error indexing listing:', error);
    }

    return NextResponse.json(updatedListing);
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string, listingSlug: string } }) => {
  const { siteSlug, listingSlug } = params;

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  try {
    // Get site by slug
    let site = await kv.get(`${keyPrefix}site:slug:${siteSlug}`);

    // Parse the site if it's a string
    if (site && typeof site === 'string') {
      try {
        site = JSON.parse(site);
      } catch (e) {
        console.error('Error parsing site JSON:', e);
      }
    }

    if (!site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    // Get existing listing
    let existingListing = await kv.get(`${keyPrefix}listing:site:${site.id}:${listingSlug}`);

    // Parse the listing if it's a string
    if (existingListing && typeof existingListing === 'string') {
      try {
        existingListing = JSON.parse(existingListing);
      } catch (e) {
        console.error('Error parsing listing JSON:', e);
      }
    }

    if (!existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Use a Redis transaction for atomicity
    const multi = redis.multi();

    // Remove listing from all locations
    multi.del(`${keyPrefix}listing:id:${existingListing.id}`);
    multi.del(`${keyPrefix}listing:site:${site.id}:${listingSlug}`);
    multi.del(`${keyPrefix}listing:category:${existingListing.categoryId}:${listingSlug}`);

    // Remove from indexes
    multi.srem(`${keyPrefix}site:${site.id}:listings`, existingListing.id);
    multi.srem(`${keyPrefix}category:${existingListing.categoryId}:listings`, existingListing.id);

    // Execute transaction
    const results = await multi.exec();

    // Check for errors in the transaction
    const errors = results.filter(([err]) => err !== null);
    if (errors.length > 0) {
      console.error('Transaction errors:', errors);
      return NextResponse.json(
        { error: 'Failed to delete listing data' },
        { status: 500 }
      );
    }

    // Remove from search index
    try {
      await searchIndexer.removeListing(existingListing.id);
    } catch (error) {
      // Log but don't fail the request if indexing fails
      console.error('Error removing listing from index:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
