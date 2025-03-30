/**
 * Types for search functionality
 */

/**
 * Search options for listings
 */
export interface ListingSearchOptions {
  categoryId?: string;
  limit?: number;
  offset?: number;
  featuredOnly?: boolean;
  status?: string;
  sortBy?: string;
}

/**
 * Count options for search results
 */
export interface CountOptions {
  categoryId?: string;
  featuredOnly?: boolean;
  status?: string;
}

/**
 * Search result type for listings
 */
export interface SearchResult {
  id: string;
  score: number;
}

/**
 * Search pagination info
 */
export interface SearchPagination {
  page: number;
  perPage: number;
  totalResults: number;
  totalPages: number;
}

/**
 * Search response structure
 */
export interface SearchResponse {
  results: any[];
  pagination: SearchPagination;
  query?: string;
  filters?: {
    categoryId?: string;
    featured?: boolean;
    status?: string;
  };
}
