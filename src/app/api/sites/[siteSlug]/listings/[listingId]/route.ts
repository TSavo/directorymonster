import { NextRequest, NextResponse } from 'next/server';
import { redis, kv } from '@/lib/redis-client';
import { Listing, SiteConfig, Category } from '@/types';
import { withRedis } from '@/middleware/withRedis';
import { searchIndexer } from '@/lib/search-indexer';

/**
 * GET handler for retrieving a single listing by ID
 */
export const GET = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string, listingId: string } }) => {
  const { siteSlug, listingId } = params;
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    // Get listing by ID
    const listing = await kv.get<Listing>(`listing:id:${listingId}`);
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Ensure the listing belongs to the site
    if (listing.siteId !== site.id) {
      return NextResponse.json(
        { error: 'Listing not found in this site' },
        { status: 404 }
      );
    }
    
    // Get category information for the listing
    const category = await kv.get<Category>(`category:id:${listing.categoryId}`);
    
    // Return the listing with category information and URLs
    const baseUrl = site.domain
      ? `https://${site.domain}`
      : `http://localhost:3000`; // For local testing
    
    return NextResponse.json({
      ...listing,
      category: category ? {
        id: category.id,
        name: category.name,
        slug: category.slug
      } : null,
      url: category ? `${baseUrl}/${category.slug}/${listing.slug}` : null,
    });
  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
});

/**
 * PUT handler for updating a listing
 */
export const PUT = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string, listingId: string } }) => {
  const { siteSlug, listingId } = params;
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    // Get existing listing
    const existingListing = await kv.get<Listing>(`listing:id:${listingId}`);
    
    if (!existingListing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Ensure the listing belongs to the site
    if (existingListing.siteId !== site.id) {
      return NextResponse.json(
        { error: 'Listing not found in this site' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.metaDescription || !data.content || !data.backlinkUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify category exists if changing category
    let categoryId = existingListing.categoryId;
    let categorySlug = existingListing.categorySlug;
    
    if (data.categoryId && data.categoryId !== existingListing.categoryId) {
      const category = await kv.get<Category>(`category:id:${data.categoryId}`);
      if (!category) {
        return NextResponse.json(
          { error: 'Category not found' },
          { status: 404 }
        );
      }
      
      // Ensure the category belongs to the site
      if (category.siteId !== site.id) {
        return NextResponse.json(
          { error: 'Category not found in this site' },
          { status: 404 }
        );
      }
      
      categoryId = data.categoryId;
      categorySlug = category.slug;
    }
    
    // Generate a new slug if title has changed
    let slug = existingListing.slug;
    if (data.title !== existingListing.title && !data.slug) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    } else if (data.slug) {
      slug = data.slug;
    }
    
    // Check if new slug conflicts with another listing
    if (slug !== existingListing.slug) {
      const existingListingWithSlug = await kv.get(`listing:site:${site.id}:${slug}`);
      if (existingListingWithSlug) {
        return NextResponse.json(
          { error: 'A listing with a similar title or slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Update listing
    const updatedListing: Listing = {
      ...existingListing,
      title: data.title,
      slug,
      categoryId,
      categorySlug,
      metaDescription: data.metaDescription,
      content: data.content,
      imageUrl: data.imageUrl !== undefined ? data.imageUrl : existingListing.imageUrl,
      backlinkUrl: data.backlinkUrl,
      backlinkAnchorText: data.backlinkAnchorText || data.title,
      backlinkPosition: data.backlinkPosition || existingListing.backlinkPosition,
      backlinkType: data.backlinkType || existingListing.backlinkType,
      backlinkVerifiedAt: data.backlinkVerifiedAt !== undefined ? data.backlinkVerifiedAt : existingListing.backlinkVerifiedAt,
      customFields: data.customFields || existingListing.customFields,
      updatedAt: Date.now()
    };
    
    // Use a Redis transaction for atomicity
    const multi = redis.multi();
    
    // Update the listing
    multi.set(`listing:id:${listingId}`, JSON.stringify(updatedListing));
    
    // Handle slug change
    if (slug !== existingListing.slug) {
      // Delete old slug reference
      multi.del(`listing:site:${site.id}:${existingListing.slug}`);
      // Create new slug reference
      multi.set(`listing:site:${site.id}:${slug}`, JSON.stringify(updatedListing));
    } else {
      // Update existing slug reference
      multi.set(`listing:site:${site.id}:${slug}`, JSON.stringify(updatedListing));
    }
    
    // Handle category change
    if (categoryId !== existingListing.categoryId) {
      // Delete old category reference
      multi.del(`listing:category:${existingListing.categoryId}:${existingListing.slug}`);
      // Create new category reference
      multi.set(`listing:category:${categoryId}:${slug}`, JSON.stringify(updatedListing));
    } else if (slug !== existingListing.slug) {
      // Delete old category-slug reference
      multi.del(`listing:category:${categoryId}:${existingListing.slug}`);
      // Create new category-slug reference
      multi.set(`listing:category:${categoryId}:${slug}`, JSON.stringify(updatedListing));
    } else {
      // Update existing category reference
      multi.set(`listing:category:${categoryId}:${slug}`, JSON.stringify(updatedListing));
    }
    
    try {
      // Execute all commands as a transaction
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
      
      // Update search index (this is isolated from the transaction with error handling)
      try {
        await searchIndexer.updateListing(updatedListing);
      } catch (error) {
        // Log but don't fail the request if indexing fails
        console.error('Error updating listing index:', error);
      }
      
      // Get category for response
      const category = await kv.get<Category>(`category:id:${categoryId}`);
      
      // Return the listing with URLs
      const baseUrl = site.domain
        ? `https://${site.domain}`
        : `http://localhost:3000`; // For local testing
      
      return NextResponse.json({
        ...updatedListing,
        category: category ? {
          id: category.id,
          name: category.name,
          slug: category.slug
        } : null,
        url: category ? `${baseUrl}/${category.slug}/${updatedListing.slug}` : null,
      });
    } catch (error) {
      console.error('Error executing Redis transaction:', error);
      return NextResponse.json(
        { error: 'Failed to update listing data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE handler for removing a listing
 */
export const DELETE = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string, listingId: string } }) => {
  const { siteSlug, listingId } = params;
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    // Get listing by ID
    const listing = await kv.get<Listing>(`listing:id:${listingId}`);
    
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }
    
    // Ensure the listing belongs to the site
    if (listing.siteId !== site.id) {
      return NextResponse.json(
        { error: 'Listing not found in this site' },
        { status: 404 }
      );
    }
    
    // Use a Redis transaction for atomicity
    const multi = redis.multi();
    
    // Delete listing references
    multi.del(`listing:id:${listingId}`);
    multi.del(`listing:site:${site.id}:${listing.slug}`);
    multi.del(`listing:category:${listing.categoryId}:${listing.slug}`);
    
    try {
      // Execute all commands as a transaction
      const results = await multi.exec();
      
      // Check for errors in the transaction
      const errors = results.filter(([err]) => err !== null);
      if (errors.length > 0) {
        console.error('Transaction errors:', errors);
        return NextResponse.json(
          { error: 'Failed to delete listing' },
          { status: 500 }
        );
      }
      
      // Remove from search index (this is isolated from the transaction with error handling)
      try {
        await searchIndexer.removeListing(listingId);
      } catch (error) {
        // Log but don't fail the request if indexing fails
        console.error('Error removing listing from index:', error);
      }
      
      return NextResponse.json({ success: true, message: 'Listing deleted successfully' });
    } catch (error) {
      console.error('Error executing Redis transaction:', error);
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});