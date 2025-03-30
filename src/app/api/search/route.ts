import { NextRequest, NextResponse } from 'next/server';
import { searchIndexer } from '@/lib/search';
import { withRedis } from '@/middleware/withRedis';
import { SearchResponse } from '@/lib/search/types';

export const GET = withRedis(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q') || '';
  const siteId = searchParams.get('siteId');
  
  // Get filter parameters
  const categoryId = searchParams.get('categoryId');
  const featuredOnly = searchParams.get('featured') === 'true';
  const status = searchParams.get('status');
  
  // Get pagination parameters
  const page = parseInt(searchParams.get('page') || '1', 10);
  const perPage = parseInt(searchParams.get('perPage') || '20', 10);
  
  // Get sorting parameter
  const sortBy = searchParams.get('sortBy') || 'relevance';
  
  // Validate required parameters
  if (!siteId) {
    return NextResponse.json(
      { error: 'Missing site ID' },
      { status: 400 }
    );
  }
  
  // If no query and no filters, return error
  if (!query && !categoryId && !featuredOnly && !status) {
    return NextResponse.json(
      { error: 'Missing search query or filters' },
      { status: 400 }
    );
  }
  
  // If there's a query, validate it
  if (query && query.trim().length > 0) {
    // Split query into terms
    const terms = query.split(/\s+/).filter(term => term.length > 2);
    
    if (terms.length === 0) {
      return NextResponse.json(
        { error: 'Search query too short' },
        { status: 400 }
      );
    }
  }
  
  try {
    // Calculate pagination offsets
    const offset = (page - 1) * perPage;
    const limit = perPage;
    
    // Search for listings with all filters
    const searchResults = await searchIndexer.searchListings(
      siteId,
      query,
      {
        categoryId: categoryId || undefined,
        limit,
        offset,
        featuredOnly,
        status: status || undefined,
        sortBy
      }
    );
    
    // Get total result count (without pagination) for accurate pagination info
    const totalCount = await searchIndexer.countSearchResults(
      siteId,
      query,
      {
        categoryId: categoryId || undefined,
        featuredOnly,
        status: status || undefined
      }
    );
    
    const response: SearchResponse = {
      results: searchResults,
      pagination: {
        page,
        perPage,
        totalResults: totalCount,
        totalPages: Math.ceil(totalCount / perPage)
      },
      query: query || undefined,
      filters: {
        categoryId: categoryId || undefined,
        featured: featuredOnly || undefined,
        status: status || undefined
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
});