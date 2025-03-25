import { redis } from './redis-client';
import { Listing } from '@/types';

/**
 * Search indexing utility for Redis
 * Uses Redis Sets to store search terms for basic site search functionality
 */
export const searchIndexer = {
  /**
   * Index a listing for search
   */
  async indexListing(listing: Listing): Promise<void> {
    const multi = redis.multi();
    
    // Extract search terms
    const searchTerms = extractSearchTerms(listing);
    
    // Add listing ID to each search term set
    for (const term of searchTerms) {
      // Store site-specific search term
      multi.sadd(`search:${listing.siteId}:term:${term.toLowerCase()}`, listing.id);
      
      // Store global search term
      multi.sadd(`search:global:term:${term.toLowerCase()}`, listing.id);
    }
    
    // Store a list of all search terms for this listing (for removal later)
    multi.sadd(`search:listing:${listing.id}:terms`, ...searchTerms.map(t => t.toLowerCase()));
    
    // Execute all commands
    await multi.exec();
  },
  
  /**
   * Remove a listing from search index
   */
  async removeListing(listingId: string, siteId: string): Promise<void> {
    // Get all search terms for this listing
    const terms = await redis.smembers(`search:listing:${listingId}:terms`);
    
    const multi = redis.multi();
    
    // Remove listing ID from each search term set
    for (const term of terms) {
      multi.srem(`search:${siteId}:term:${term}`, listingId);
      multi.srem(`search:global:term:${term}`, listingId);
    }
    
    // Remove the listing's terms set
    multi.del(`search:listing:${listingId}:terms`);
    
    // Execute all commands
    await multi.exec();
  },
  
  /**
   * Search for listings by term
   */
  async search(term: string, siteId?: string): Promise<string[]> {
    const searchKey = siteId 
      ? `search:${siteId}:term:${term.toLowerCase()}`
      : `search:global:term:${term.toLowerCase()}`;
    
    return await redis.smembers(searchKey);
  },
  
  /**
   * Search for listings by multiple terms (AND operation)
   */
  async searchAll(terms: string[], siteId?: string): Promise<string[]> {
    if (terms.length === 0) return [];
    
    const searchKeys = terms.map(term => {
      return siteId 
        ? `search:${siteId}:term:${term.toLowerCase()}`
        : `search:global:term:${term.toLowerCase()}`;
    });
    
    // Use SINTER to find listings that match ALL terms
    return await redis.sinter(...searchKeys);
  },
};

/**
 * Extract search terms from a listing
 */
function extractSearchTerms(listing: Listing): string[] {
  const terms = new Set<string>();
  
  // Add title words
  listing.title.split(/\s+/).forEach(word => {
    if (word.length > 2) terms.add(word);
  });
  
  // Add meta description words
  listing.metaDescription.split(/\s+/).forEach(word => {
    if (word.length > 2) terms.add(word);
  });
  
  // Add custom fields
  if (listing.customFields) {
    for (const [key, value] of Object.entries(listing.customFields)) {
      if (typeof value === 'string' && value.length > 2) {
        terms.add(value);
      }
    }
  }
  
  return Array.from(terms);
}