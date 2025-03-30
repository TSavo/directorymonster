/**
 * Search indexer for categories and listings
 * Provides better search capabilities and data organization
 */
import { redis, kv } from './redis-client';
import { Category, Listing } from '@/types';
import { searchKeys } from './tenant';

/**
 * Simple search indexer for the application
 * This could be replaced with a more advanced search solution in production
 */
class SearchIndexer {
  /**
   * Index a category for search
   */
  async indexCategory(category: Category): Promise<void> {
    try {
      // Create search index for categories if it doesn't exist
      const indexKey = searchKeys.categoryIndex(category.siteId);
      
      // Basic search data includes name, slug, and description
      const searchData = {
        id: category.id,
        name: category.name.toLowerCase(),
        slug: category.slug.toLowerCase(),
        description: category.metaDescription.toLowerCase(),
        parentId: category.parentId || null,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      };
      
      // Add to search index 
      await redis.hset(indexKey, category.id, JSON.stringify(searchData));
      
      console.log(`Indexed category: ${category.name}`);
    } catch (error) {
      console.error('Error indexing category:', error);
      throw error;
    }
  }
  
  /**
   * Update a category in the search index
   */
  async updateCategory(category: Category): Promise<void> {
    // Simply re-index the category
    await this.indexCategory(category);
  }
  
  /**
   * Remove a category from the search index
   */
  async removeCategory(categoryId: string, siteId: string): Promise<void> {
    try {
      // Remove from search index
      const indexKey = searchKeys.categoryIndex(siteId);
      await redis.hdel(indexKey, categoryId);
      
      console.log(`Removed category ${categoryId} from search index`);
    } catch (error) {
      console.error('Error removing category from index:', error);
      throw error;
    }
  }
  
  /**
   * Search for categories
   */
  async searchCategories(siteId: string, query: string): Promise<Category[]> {
    try {
      if (!query) {
        return [];
      }
      
      const indexKey = searchKeys.categoryIndex(siteId);
      const allCategoryData = await redis.hgetall(indexKey);
      
      if (!allCategoryData) {
        return [];
      }
      
      // Search through all categories in the index
      const searchResults: Category[] = [];
      const lowerQuery = query.toLowerCase();
      
      for (const [, value] of Object.entries(allCategoryData)) {
        const indexData = JSON.parse(value);
        
        // Match against name, slug, or description
        if (
          indexData.name.includes(lowerQuery) ||
          indexData.slug.includes(lowerQuery) ||
          indexData.description.includes(lowerQuery)
        ) {
          // Get full category data
          const category = await kv.get<Category>(`category:id:${indexData.id}`);
          if (category) {
            searchResults.push(category);
          }
        }
      }
      
      // Sort by relevance (name match is highest priority)
      searchResults.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(lowerQuery) ? 1 : 0;
        const bNameMatch = b.name.toLowerCase().includes(lowerQuery) ? 1 : 0;
        
        return bNameMatch - aNameMatch;
      });
      
      return searchResults;
    } catch (error) {
      console.error('Error searching categories:', error);
      return [];
    }
  }
  
  /**
   * Index a listing for search
   */
  async indexListing(listing: Listing): Promise<void> {
    try {
      // Create search index for listings if it doesn't exist
      const indexKey = searchKeys.listingIndex(listing.siteId);
      
      // Basic search data includes title, slug, and description
      const searchData = {
        id: listing.id,
        title: listing.title.toLowerCase(),
        slug: listing.slug.toLowerCase(),
        description: listing.metaDescription.toLowerCase(),
        content: listing.content.substring(0, 1000).toLowerCase(), // Index first 1000 chars of content
        categoryId: listing.categoryId,
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt
      };
      
      // Add to search index
      await redis.hset(indexKey, listing.id, JSON.stringify(searchData));
      
      console.log(`Indexed listing: ${listing.title}`);
    } catch (error) {
      console.error('Error indexing listing:', error);
      throw error;
    }
  }
  
  /**
   * Update a listing in the search index
   */
  async updateListing(listing: Listing): Promise<void> {
    // Simply re-index the listing
    await this.indexListing(listing);
  }
  
  /**
   * Remove a listing from the search index
   */
  async removeListing(listingId: string, siteId?: string): Promise<void> {
    try {
      // If siteId is provided, use it directly
      if (siteId) {
        const indexKey = searchKeys.listingIndex(siteId);
        await redis.hdel(indexKey, listingId);
        
        console.log(`Removed listing ${listingId} from search index`);
        return;
      }
      
      // Otherwise, look up the listing first to get the siteId
      const listing = await kv.get<Listing>(`listing:id:${listingId}`);
      
      if (listing) {
        const indexKey = searchKeys.listingIndex(listing.siteId);
        await redis.hdel(indexKey, listingId);
        
        console.log(`Removed listing ${listingId} from search index`);
      } else {
        console.warn(`Listing ${listingId} not found, cannot remove from index`);
      }
    } catch (error) {
      console.error('Error removing listing from index:', error);
      throw error;
    }
  }
  
  /**
   * Search for listings
   */
  async searchListings(
    siteId: string, 
    query: string, 
    options: { 
      categoryId?: string,
      limit?: number,
      offset?: number
    } = {}
  ): Promise<Listing[]> {
    try {
      if (!query && !options.categoryId) {
        return [];
      }
      
      const { categoryId, limit = 10, offset = 0 } = options;
      const indexKey = searchKeys.listingIndex(siteId);
      const allListingData = await redis.hgetall(indexKey);
      
      if (!allListingData) {
        return [];
      }
      
      // Search through all listings in the index
      const searchResults: Listing[] = [];
      const lowerQuery = query ? query.toLowerCase() : '';
      
      for (const [, value] of Object.entries(allListingData)) {
        const indexData = JSON.parse(value);
        
        // Filter by category if specified
        if (categoryId && indexData.categoryId !== categoryId) {
          continue;
        }
        
        // Skip processing if no query and we're just filtering by category
        if (!lowerQuery) {
          // Get full listing data
          const listing = await kv.get<Listing>(`listing:id:${indexData.id}`);
          if (listing) {
            searchResults.push(listing);
          }
          continue;
        }
        
        // Match against title, slug, description, or content
        if (
          indexData.title.includes(lowerQuery) ||
          indexData.slug.includes(lowerQuery) ||
          indexData.description.includes(lowerQuery) ||
          indexData.content.includes(lowerQuery)
        ) {
          // Get full listing data
          const listing = await kv.get<Listing>(`listing:id:${indexData.id}`);
          if (listing) {
            searchResults.push(listing);
          }
        }
      }
      
      // Sort by relevance (title match is highest priority)
      if (lowerQuery) {
        searchResults.sort((a, b) => {
          const aTitleMatch = a.title.toLowerCase().includes(lowerQuery) ? 1 : 0;
          const bTitleMatch = b.title.toLowerCase().includes(lowerQuery) ? 1 : 0;
          
          return bTitleMatch - aTitleMatch;
        });
      } else {
        // Sort by created date if just filtering by category
        searchResults.sort((a, b) => b.createdAt - a.createdAt);
      }
      
      // Apply pagination
      return searchResults.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error searching listings:', error);
      return [];
    }
  }
}

// Export singleton instance
export const searchIndexer = new SearchIndexer();
