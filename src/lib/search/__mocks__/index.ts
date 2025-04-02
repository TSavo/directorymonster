// Mock search indexer for tests
import { Listing, Category } from '@/types';
import { CountOptions, ListingSearchOptions } from '../types';
import { kv } from '@/lib/redis-client';

class MockSearchIndexer {
  async indexCategory(category: Category): Promise<void> {
    // No-op for tests
    return Promise.resolve();
  }

  async updateCategory(category: Category): Promise<void> {
    // No-op for tests
    return Promise.resolve();
  }

  async removeCategory(categoryId: string, siteId: string): Promise<void> {
    // No-op for tests
    return Promise.resolve();
  }

  async searchCategories(siteId: string, query: string): Promise<Category[]> {
    // Get all categories for the site
    const isTestMode = process.env.NODE_ENV === 'test';
    const keyPrefix = isTestMode ? 'test:' : '';
    
    const categoryKeys = await kv.keys(`${keyPrefix}category:site:${siteId}:*`);
    const categoriesPromises = categoryKeys.map(async (key) => await kv.get<Category>(key));
    
    // Handle each promise individually
    const categories: Category[] = [];
    for (let i = 0; i < categoriesPromises.length; i++) {
      try {
        const category = await categoriesPromises[i];
        if (category) {
          // Parse if it's a string
          const parsedCategory = typeof category === 'string' ? JSON.parse(category) : category;
          
          // Filter by query if provided
          if (!query || parsedCategory.name.toLowerCase().includes(query.toLowerCase())) {
            categories.push(parsedCategory);
          }
        }
      } catch (error) {
        console.error(`Error fetching category at index ${i}:`, error);
      }
    }
    
    return categories;
  }

  async indexListing(listing: Listing): Promise<void> {
    // No-op for tests
    return Promise.resolve();
  }

  async updateListing(listing: Listing): Promise<void> {
    // No-op for tests
    return Promise.resolve();
  }

  async removeListing(listingId: string, siteId?: string): Promise<void> {
    // No-op for tests
    return Promise.resolve();
  }

  async searchListings(
    siteId: string, 
    query: string, 
    options: ListingSearchOptions = {}
  ): Promise<Listing[]> {
    // Get all listings for the site
    const isTestMode = process.env.NODE_ENV === 'test';
    const keyPrefix = isTestMode ? 'test:' : '';
    
    const listingKeys = await kv.keys(`${keyPrefix}listing:site:${siteId}:*`);
    const listingsPromises = listingKeys.map(async (key) => await kv.get<Listing>(key));
    
    // Handle each promise individually
    let listings: Listing[] = [];
    for (let i = 0; i < listingsPromises.length; i++) {
      try {
        let listing = await listingsPromises[i];
        
        // Parse if it's a string
        if (typeof listing === 'string') {
          try {
            listing = JSON.parse(listing);
          } catch (e) {
            console.error('Error parsing listing JSON:', e);
            continue;
          }
        }
        
        if (listing) {
          listings.push(listing);
        }
      } catch (error) {
        console.error(`Error fetching listing at index ${i}:`, error);
      }
    }
    
    // Apply category filter if provided
    if (options.categoryId) {
      listings = listings.filter(listing => listing.categoryId === options.categoryId);
    }
    
    // Apply featured filter if provided
    if (options.featuredOnly) {
      listings = listings.filter(listing => listing.featured);
    }
    
    // Apply status filter if provided
    if (options.status) {
      listings = listings.filter(listing => listing.status === options.status);
    }
    
    // Apply query filter if provided
    if (query) {
      const lowerQuery = query.toLowerCase();
      listings = listings.filter(listing => 
        listing.title.toLowerCase().includes(lowerQuery) || 
        listing.content.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply sorting
    if (options.sortBy === 'title') {
      listings.sort((a, b) => a.title.localeCompare(b.title));
    } else if (options.sortBy === 'date') {
      listings.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    // Apply pagination
    if (options.offset !== undefined && options.limit !== undefined) {
      listings = listings.slice(options.offset, options.offset + options.limit);
    }
    
    return listings;
  }

  async countSearchResults(
    siteId: string, 
    query: string, 
    options: CountOptions = {}
  ): Promise<number> {
    // Get all listings without pagination
    const listings = await this.searchListings(siteId, query, {
      categoryId: options.categoryId,
      featuredOnly: options.featuredOnly,
      status: options.status
    });
    
    return listings.length;
  }

  async searchAll(
    terms: string[],
    siteId?: string
  ): Promise<string[]> {
    if (!siteId || terms.length === 0) {
      return [];
    }
    
    // Get all listings for the site
    const isTestMode = process.env.NODE_ENV === 'test';
    const keyPrefix = isTestMode ? 'test:' : '';
    
    const listingKeys = await kv.keys(`${keyPrefix}listing:site:${siteId}:*`);
    const listingsPromises = listingKeys.map(async (key) => await kv.get<Listing>(key));
    
    // Handle each promise individually
    const listings: Listing[] = [];
    for (let i = 0; i < listingsPromises.length; i++) {
      try {
        let listing = await listingsPromises[i];
        
        // Parse if it's a string
        if (typeof listing === 'string') {
          try {
            listing = JSON.parse(listing);
          } catch (e) {
            console.error('Error parsing listing JSON:', e);
            continue;
          }
        }
        
        if (listing) {
          listings.push(listing);
        }
      } catch (error) {
        console.error(`Error fetching listing at index ${i}:`, error);
      }
    }
    
    // Filter listings that match all terms
    const matchingListings = listings.filter(listing => {
      const content = `${listing.title} ${listing.content}`.toLowerCase();
      return terms.every(term => content.includes(term.toLowerCase()));
    });
    
    return matchingListings.map(listing => listing.id);
  }
}

// Export singleton instance
export const searchIndexer = new MockSearchIndexer();

// Re-export types
export * from '../types';
export * from '../utils';
