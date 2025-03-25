import { redis } from '../../../lib/redis-client';
import { NextResponse } from 'next/server';

// Simple API endpoint for the extractor.py script
export async function GET(request) {
  console.log("GET /api/products - Received request");
  // Basic API key authentication
  const authHeader = request.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  
  if (apiKey !== 'dev-api-key') {
    console.log("GET /api/products - Invalid API key");
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  try {
    // Get all listings
    console.log("GET /api/products - Fetching listings from Redis");
    const keys = await redis.keys('listing:id:*');
    const listings = [];
    
    for (const key of keys) {
      const listingData = await redis.get(key);
      if (listingData) {
        const listing = JSON.parse(listingData);
        listings.push(listing);
      }
    }
    
    console.log(`GET /api/products - Found ${listings.length} listings`);
    return NextResponse.json({ listings });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  console.log("POST /api/products - Received request");
  
  // Basic API key authentication
  const authHeader = request.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  
  if (apiKey !== 'dev-api-key') {
    console.log("POST /api/products - Invalid API key");
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  try {
    // Parse request body
    const body = await request.json();
    console.log("POST /api/products - Request body:", JSON.stringify(body).substring(0, 200) + "...");
    
    const { 
      siteSlug, 
      categoryId, 
      title, 
      metaDescription, 
      content, 
      imageUrl, 
      backlinkUrl, 
      backlinkAnchorText,
      customFields
    } = body;
    
    if (!siteSlug || !categoryId || !title) {
      console.log("POST /api/products - Missing required fields");
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get site by slug
    console.log(`POST /api/products - Looking up site: ${siteSlug}`);
    const siteKey = `site:slug:${siteSlug}`;
    const siteData = await redis.get(siteKey);
    
    if (!siteData) {
      console.log(`POST /api/products - Site not found: ${siteSlug}`);
      return NextResponse.json({ error: 'Site not found' }, { status: 404 });
    }
    
    const site = JSON.parse(siteData);
    console.log(`POST /api/products - Found site: ${site.id}`);
    
    // Get category by ID
    console.log(`POST /api/products - Looking up category: ${categoryId}`);
    const categoryKey = `category:id:${categoryId}`;
    const categoryData = await redis.get(categoryKey);
    
    if (!categoryData) {
      console.log(`POST /api/products - Category not found: ${categoryId}`);
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    console.log(`POST /api/products - Found category: ${categoryId}`);
    
    // Create listing
    const timestamp = Date.now();
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const listing = {
      id: `listing_${timestamp}`,
      siteId: site.id,
      categoryId,
      title,
      slug,
      metaDescription: metaDescription || title,
      content: content || title,
      imageUrl: imageUrl || '',
      backlinkUrl: backlinkUrl || '',
      backlinkAnchorText: backlinkAnchorText || title,
      backlinkPosition: 'prominent',
      backlinkType: 'dofollow',
      customFields: customFields || {},
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    // Store listing in Redis
    console.log(`POST /api/products - Storing listing: ${listing.id}`);
    await redis.set(`listing:id:${listing.id}`, JSON.stringify(listing));
    await redis.set(`listing:site:${site.id}:${listing.slug}`, JSON.stringify(listing));
    await redis.set(`listing:category:${listing.categoryId}:${listing.slug}`, JSON.stringify(listing));
    
    console.log(`POST /api/products - Successfully created listing: ${listing.id}`);
    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}