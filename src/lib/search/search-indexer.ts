/**
 * Main search indexer class combining category and listing indexing
 */
import { Category, Listing } from '@/types';
import { CategoryIndexer } from './category-indexer';
import { ListingIndexer } from './listing-indexer';
import { CountOptions, ListingSearchOptions } from './types';

/**
 * Search indexer for categories and listings
 * Provides better search capabilities and data organization
 */
class SearchIndexer {
  private categoryIndexer: CategoryIndexer;
  private listingIndexer: ListingIndexer;
  
  constructor() {
    this.categoryIndexer = new CategoryIndexer();
    this.listingIndexer = new ListingIndexer();
  }
  
  /**
   * Index a category for search
   */
  async indexCategory(category: Category): Promise<void> {
    return this.categoryIndexer.indexCategory(category);
  }
  
  /**
   * Update a category in the search index
   */
  async updateCategory(category: Category): Promise<void> {
    return this.categoryIndexer.updateCategory(category);
  }
  
  /**
   * Remove a category from the search index
   */
  async removeCategory(categoryId: string, siteId: string): Promise<void> {
    return this.categoryIndexer.removeCategory(categoryId, siteId);
  }
  
  /**
   * Search for categories
   */
  async searchCategories(siteId: string, query: string): Promise<Category[]> {
    return this.categoryIndexer.searchCategories(siteId, query);
  }
  
  /**
   * Index a listing for search
   */
  async indexListing(listing: Listing): Promise<void> {
    return this.listingIndexer.indexListing(listing);
  }
  
  /**
   * Update a listing in the search index
   */
  async updateListing(listing: Listing): Promise<void> {
    return this.listingIndexer.updateListing(listing);
  }
  
  /**
   * Remove a listing from the search index
   */
  async removeListing(listingId: string, siteId?: string): Promise<void> {
    return this.listingIndexer.removeListing(listingId, siteId);
  }
  
  /**
   * Search for listings with advanced filtering
   */
  async searchListings(
    siteId: string, 
    query: string, 
    options: ListingSearchOptions = {}
  ): Promise<Listing[]> {
    return this.listingIndexer.searchListings(siteId, query, options);
  }
  
  /**
   * Count search results for pagination
   */
  async countSearchResults(
    siteId: string, 
    query: string, 
    options: CountOptions = {}
  ): Promise<number> {
    return this.listingIndexer.countSearchResults(siteId, query, options);
  }
  
  /**
   * Search for all (categories and listings)
   * Useful for global search functionality
   */
  async searchAll(
    terms: string[],
    siteId?: string
  ): Promise<string[]> {
    try {
      if (!siteId || terms.length === 0) {
        return [];
      }
      
      // Get listing IDs for each term
      const listingIdSets: string[][] = [];
      
      for (const term of terms) {
        const termKey = searchKeys.listingTermIndex(siteId, term);
        const matches = await redis.smembers(termKey);
        if (matches.length > 0) {
          listingIdSets.push(matches);
        }
      }
      
      // Find intersection of all term matches
      if (listingIdSets.length === 0) {
        return [];
      }
      
      // Find listings that match all terms (AND logic)
      let listingIds = getIntersection(listingIdSets);
      
      // Return matching listing IDs
      return listingIds;
    } catch (error) {
      console.error('Error in searchAll:', error);
      return [];
    }
  }
}

// Export singleton instance
export const searchIndexer = new SearchIndexer();
