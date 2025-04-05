/**
 * Listing search indexing functionality
 */
import { redis, kv } from '../redis-client';
import { Listing } from '@/types';
import { searchKeys } from '../tenant';
import { CountOptions, ListingSearchOptions, SearchResult } from './types';
import { calculateSearchScore, getIntersection, getUnion } from './utils';

/**
 * Listing indexing functionality
 */
export class ListingIndexer {
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
        featured: listing.featured || false,
        status: listing.status || 'published',
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt
      };

      // Add to search index
      await redis.hset(indexKey, listing.id, JSON.stringify(searchData));

      // Index listing for full-text search
      await this.indexListingTerms(listing);

      // Add to category listings set
      const categoryListingsKey = searchKeys.categoryListings(listing.siteId, listing.categoryId);
      await redis.sadd(categoryListingsKey, listing.id);

      // Add to featured listings set if featured
      if (listing.featured) {
        const featuredListingsKey = searchKeys.featuredListings(listing.siteId);
        await redis.sadd(featuredListingsKey, listing.id);
      }

      // Add to status-based set
      const statusListingsKey = searchKeys.statusListings(listing.siteId, listing.status || 'published');
      await redis.sadd(statusListingsKey, listing.id);

      console.log(`Indexed listing: ${listing.title}`);
    } catch (error) {
      console.error('Error indexing listing:', error);
      throw error;
    }
  }

  /**
   * Index listing terms for full-text search
   */
  private async indexListingTerms(listing: Listing): Promise<void> {
    try {
      // Extract search terms from listing fields
      const terms = new Set<string>();

      // Add terms from title
      listing.title.toLowerCase().split(/\s+/).forEach(term => {
        if (term.length > 2) terms.add(term);
      });

      // Add terms from description
      listing.metaDescription.toLowerCase().split(/\s+/).forEach(term => {
        if (term.length > 2) terms.add(term);
      });

      // Add terms from content (split by spaces and punctuation)
      listing.content.toLowerCase()
        .split(/[\s.,!?;:()"']+/)
        .forEach(term => {
          if (term.length > 2) terms.add(term);
        });

      // Add listing ID to term indices
      for (const term of terms) {
        const termKey = searchKeys.listingTermIndex(listing.siteId, term);
        await redis.sadd(termKey, listing.id);
      }

      // Store all terms for this listing to track changes
      const listingTermsKey = searchKeys.listingTermsSet(listing.siteId, listing.id);
      await redis.del(listingTermsKey);
      if (terms.size > 0) {
        await redis.sadd(listingTermsKey, ...terms);
      }
    } catch (error) {
      console.error('Error indexing listing terms:', error);
      throw error;
    }
  }

  /**
   * Update a listing in the search index
   */
  async updateListing(listing: Listing): Promise<void> {
    try {
      // Remove old terms and category references first
      await this.removeListingReferences(listing.id, listing.siteId);

      // Then re-index the listing
      await this.indexListing(listing);
    } catch (error) {
      console.error('Error updating listing index:', error);
      throw error;
    }
  }

  /**
   * Remove a listing's terms from the search index
   */
  private async removeListingTerms(listingId: string, siteId: string): Promise<void> {
    try {
      // Get all terms for this listing
      const listingTermsKey = searchKeys.listingTermsSet(siteId, listingId);
      const terms = await redis.smembers(listingTermsKey);

      // Remove listing ID from each term index
      for (const term of terms) {
        const termKey = searchKeys.listingTermIndex(siteId, term);
        await redis.srem(termKey, listingId);
      }

      // Remove the terms set
      await redis.del(listingTermsKey);
    } catch (error) {
      console.error('Error removing listing terms:', error);
      throw error;
    }
  }

  /**
   * Remove a listing's references from category and feature sets
   */
  private async removeListingReferences(listingId: string, siteId: string): Promise<void> {
    try {
      // Get the listing data to find its category
      const indexKey = searchKeys.listingIndex(siteId);
      const listingData = await redis.hget(indexKey, listingId);

      if (listingData) {
        const { categoryId, featured, status } = JSON.parse(listingData);

        // Remove from category listings set
        if (categoryId) {
          const categoryListingsKey = searchKeys.categoryListings(siteId, categoryId);
          await redis.srem(categoryListingsKey, listingId);
        }

        // Remove from featured listings set
        if (featured) {
          const featuredListingsKey = searchKeys.featuredListings(siteId);
          await redis.srem(featuredListingsKey, listingId);
        }

        // Remove from status-based set
        if (status) {
          const statusListingsKey = searchKeys.statusListings(siteId, status);
          await redis.srem(statusListingsKey, listingId);
        }
      }

      // Remove all term references
      await this.removeListingTerms(listingId, siteId);

      // Remove from main index
      await redis.hdel(indexKey, listingId);
    } catch (error) {
      console.error('Error removing listing references:', error);
      throw error;
    }
  }

  /**
   * Remove a listing from the search index
   */
  async removeListing(listingId: string, siteId?: string): Promise<void> {
    try {
      // If siteId is provided, use it directly
      if (siteId) {
        await this.removeListingReferences(listingId, siteId);

        console.log(`Removed listing ${listingId} from search index`);
        return;
      }

      // Otherwise, look up the listing first to get the siteId
      const listing = await kv.get<Listing>(`listing:id:${listingId}`);

      if (listing) {
        await this.removeListingReferences(listingId, listing.siteId);

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
   * Search for listings with advanced filtering
   */
  async searchListings(
    siteId: string,
    query: string,
    options: ListingSearchOptions = {}
  ): Promise<Listing[]> {
    try {
      const {
        categoryId,
        limit = 20,
        offset = 0,
        featuredOnly = false,
        status,
        sortBy = 'relevance'
      } = options;

      // Search by query or filters
      let listingIds: string[] = [];

      if (query) {
        // Search by query terms
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);

        if (searchTerms.length > 0) {
          // Get matching listing IDs for each term
          const termSets: string[][] = [];
          for (const term of searchTerms) {
            const termKey = searchKeys.listingTermIndex(siteId, term);
            const matches = await redis.smembers(termKey);
            if (matches.length > 0) {
              termSets.push(matches);
            }
          }

          if (termSets.length > 0) {
            // Use union or intersection based on search strategy
            // Here we're using intersection (AND logic)
            listingIds = getIntersection(termSets);
          }
        }
      } else if (categoryId) {
        // If no query but has category filter, get all listings in category
        const categoryListingsKey = searchKeys.categoryListings(siteId, categoryId);
        listingIds = await redis.smembers(categoryListingsKey);
      } else {
        // If no query and no category, get all listings
        const indexKey = searchKeys.listingIndex(siteId);
        const allListings = await redis.hkeys(indexKey);
        listingIds = allListings;
      }

      // Apply featured filter if needed
      if (featuredOnly && listingIds?.length > 0) {
        const featuredListingsKey = searchKeys.featuredListings(siteId);
        const featuredListings = await redis.smembers(featuredListingsKey);

        // Keep only listings that are in both sets
        listingIds = listingIds.filter(id => featuredListings.includes(id));
      }

      // Apply status filter if needed
      if (status && listingIds?.length > 0) {
        const statusListingsKey = searchKeys.statusListings(siteId, status);
        const statusListings = await redis.smembers(statusListingsKey);

        // Keep only listings that are in both sets
        listingIds = listingIds.filter(id => statusListings.includes(id));
      }

      if (listingIds.length === 0) {
        return [];
      }

      // Score results if there's a query
      let scoredResults: SearchResult[] = [];

      if (query?.length > 0) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);

        // Calculate score for each listing
        const scoringPromises = listingIds.map(async id => {
          const score = await calculateSearchScore(id, searchTerms, siteId);
          return { id, score };
        });

        scoredResults = await Promise.all(scoringPromises);

        // Sort by score (descending)
        scoredResults.sort((a, b) => b.score - a.score);
      } else {
        // If no query, assign default score and sort later
        scoredResults = listingIds.map(id => ({ id, score: 1 }));
      }

      // Get full listing data
      let listings: Listing[] = [];
      const idsToFetch = scoredResults.map(result => result.id);

      const listingPromises = idsToFetch.map(async id => {
        return await kv.get<Listing>(`listing:id:${id}`);
      });

      const listingResults = await Promise.all(listingPromises);
      listings = listingResults.filter(Boolean) as Listing[];

      // Sort results if not sorting by relevance
      if (sortBy !== 'relevance') {
        switch (sortBy) {
          case 'newest':
            listings.sort((a, b) => b.createdAt - a.createdAt);
            break;
          case 'oldest':
            listings.sort((a, b) => a.createdAt - b.createdAt);
            break;
          case 'title_asc':
            listings.sort((a, b) => a.title.localeCompare(b.title));
            break;
          case 'title_desc':
            listings.sort((a, b) => b.title.localeCompare(a.title));
            break;
          case 'featured':
            listings.sort((a, b) => {
              if (a.featured === b.featured) return 0;
              return a.featured ? -1 : 1;
            });
            break;
          default:
            // Default to relevance, which is already sorted
            break;
        }
      }

      // Apply pagination
      return listings.slice(offset, offset + limit);
    } catch (error) {
      console.error('Error searching listings:', error);
      return [];
    }
  }

  /**
   * Count total search results (for pagination)
   */
  async countSearchResults(
    siteId: string,
    query: string,
    options: CountOptions = {}
  ): Promise<number> {
    try {
      const { categoryId, featuredOnly = false, status } = options;

      // Search by query or filters
      let listingIds: string[] = [];

      if (query) {
        // Search by query terms
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);

        if (searchTerms.length > 0) {
          // Get matching listing IDs for each term
          const termSets: string[][] = [];
          for (const term of searchTerms) {
            const termKey = searchKeys.listingTermIndex(siteId, term);
            const matches = await redis.smembers(termKey);
            if (matches.length > 0) {
              termSets.push(matches);
            }
          }

          if (termSets.length > 0) {
            // Use intersection (AND logic)
            listingIds = getIntersection(termSets);
          }
        }
      } else if (categoryId) {
        // If no query but has category filter, get all listings in category
        const categoryListingsKey = searchKeys.categoryListings(siteId, categoryId);
        listingIds = await redis.smembers(categoryListingsKey);
      } else {
        // If no query and no category, get all listings
        const indexKey = searchKeys.listingIndex(siteId);
        const allListings = await redis.hkeys(indexKey);
        listingIds = allListings;
      }

      // Apply featured filter if needed
      if (featuredOnly && listingIds?.length > 0) {
        const featuredListingsKey = searchKeys.featuredListings(siteId);
        const featuredListings = await redis.smembers(featuredListingsKey);

        // Keep only listings that are in both sets
        listingIds = listingIds.filter(id => featuredListings.includes(id));
      }

      // Apply status filter if needed
      if (status && listingIds?.length > 0) {
        const statusListingsKey = searchKeys.statusListings(siteId, status);
        const statusListings = await redis.smembers(statusListingsKey);

        // Keep only listings that are in both sets
        listingIds = listingIds.filter(id => statusListings.includes(id));
      }

      return listingIds.length;
    } catch (error) {
      console.error('Error counting search results:', error);
      return 0;
    }
  }
}
