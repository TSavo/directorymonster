import { NextRequest, NextResponse } from 'next/server';
import { searchIndexer } from '@/lib/search-indexer';
import { kv } from '@/lib/redis-client';
import { Listing } from '@/types';
import { withRedis } from '@/middleware/withRedis';

export const GET = withRedis(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const siteId = searchParams.get('siteId');
  
  if (!query) {
    return NextResponse.json(
      { error: 'Missing search query' },
      { status: 400 }
    );
  }
  
  // Split query into terms
  const terms = query.split(/\s+/).filter(term => term.length > 2);
  
  if (terms.length === 0) {
    return NextResponse.json(
      { error: 'Search query too short' },
      { status: 400 }
    );
  }
  
  try {
    // Search for listings by terms
    const listingIds = await searchIndexer.searchAll(terms, siteId || undefined);
    
    // Get listing details
    const listings = await Promise.all(
      listingIds.map(async id => await kv.get<Listing>(`listing:id:${id}`))
    );
    
    // Filter out any null results and limit to 20 results
    const validListings = listings.filter(Boolean).slice(0, 20);
    
    return NextResponse.json({
      results: validListings,
      totalResults: validListings.length,
      query,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
});