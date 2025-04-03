import { kv, redis } from '@/lib/redis-client';
import { Listing, Category } from '@/types';
import { searchIndexer } from '@/lib/search-indexer';

/**
 * Options for filtering, sorting, and paginating listings
 */
interface ListingFilterOptions {
  categoryId?: string;
  name?: string;
  status?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Pagination metadata
 */
interface PaginationMeta {
  totalResults: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

/**
 * Paginated listings response
 */
interface PaginatedListingsResponse {
  results: Listing[];
  pagination: PaginationMeta;
}

/**
 * Service for managing listings
 */
export class ListingService {

  /**
   * Get all listings for a specific site
   *
   * @param siteId The site ID to get listings for
   * @param options Optional filtering and pagination options
   * @returns Paginated listings response or array of listings if no pagination options provided
   */
  static async getListingsBySiteId(siteId: string, options: ListingFilterOptions = {}): Promise<Listing[] | PaginatedListingsResponse> {
    return this.getListings(siteId, options);
  }

  /**
   * Get listings for a specific site and category
   *
   * @param siteId The site ID
   * @param categoryId The category ID
   * @param options Optional pagination options
   * @returns Paginated listings response or array of listings if no pagination options provided
   */
  static async getListingsBySiteAndCategory(
    siteId: string,
    categoryId: string,
    options: Omit<ListingFilterOptions, 'categoryId'> = {}
  ): Promise<Listing[] | PaginatedListingsResponse> {
    return this.getListings(siteId, { ...options, categoryId });
  }

  /**
   * Internal method to get listings with filtering and pagination
   *
   * @param siteId The site ID
   * @param options Filtering and pagination options
   * @returns Listings or paginated listings response
   */
  private static async getListings(siteId: string, options: ListingFilterOptions = {}): Promise<Listing[] | PaginatedListingsResponse> {
    try {
      // Get all listing keys for this site
      const listingKeys = await kv.keys(`listing:site:${siteId}:*`);

      // Fetch each listing
      const listingsPromises = listingKeys.map(key => kv.get<Listing>(key));
      const listingsData = await Promise.all(listingsPromises);

      // Filter out null values and apply filters
      let listings = listingsData.filter(listing => listing !== null) as Listing[];

      // Apply category filter if provided
      if (options.categoryId) {
        listings = listings.filter(listing => listing.categoryId === options.categoryId);
      }

      // Apply name filter if provided
      if (options.name) {
        listings = listings.filter(listing =>
          listing.title.toLowerCase().includes(options.name!.toLowerCase())
        );
      }

      // Apply status filter if provided
interface Listing {
  // Existing properties
  id: number;
  title: string;
  // ... other properties
  
+  status?: string; // add if needed
}

// Later in the file, where the filter is applied:
if (options.status) {
  listings = listings.filter(listing =>
    listing.status === options.status
  );
}

      // Apply sorting if provided
      if (options.sort) {
        const sortField = options.sort as keyof Listing;
        const sortOrder = options.order === 'desc' ? -1 : 1;

        listings = listings.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortOrder;
          if (a[sortField] > b[sortField]) return 1 * sortOrder;
          return 0;
        });
      }

      // Apply pagination if page and limit are provided
      if (options.page !== undefined || options.limit !== undefined) {
        const page = options.page || 1;
        const limit = options.limit || 10;

        // Validate and normalize pagination parameters
        const validPage = Math.max(1, page);
        const validLimit = Math.min(100, Math.max(1, limit));

        // Calculate pagination indices
        const startIndex = (validPage - 1) * validLimit;
        const endIndex = startIndex + validLimit;

        // Get paginated results
        const paginatedResults = listings.slice(startIndex, endIndex);

        // Return paginated response
        return {
          results: paginatedResults,
          pagination: {
            totalResults: listings.length,
            totalPages: Math.ceil(listings.length / validLimit),
            currentPage: validPage,
            limit: validLimit
          }
        };
      }

      // Return all listings if no pagination options
      return listings;
    } catch (error) {
      console.error(`Error retrieving listings for site ${siteId}:`, error);
      return [];
    }
  }

  /**
   * Get a listing by its slug
   *
   * @param siteId The site ID
   * @param slug The listing slug
   * @returns The listing or null if not found
   */
  static async getListingBySlug(siteId: string, slug: string): Promise<Listing | null> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';

      // Get listing by slug
      const listing = await kv.get<Listing>(`${keyPrefix}listing:site:${siteId}:${slug}`);

      return listing;
    } catch (error) {
      console.error(`Error retrieving listing with slug ${slug} for site ${siteId}:`, error);
      return null;
    }
  }

  /**
   * Create a new listing
   *
   * @param siteId The site ID
   * @param data The listing data
   * @returns The created listing or null if creation failed
   */
  static async createListing(siteId: string, data: {
    title: string;
    categoryId: string;
    metaDescription: string;
    content: string;
    backlinkUrl: string;
    imageUrl?: string;
    backlinkAnchorText?: string;
    backlinkPosition?: string;
    backlinkType?: string;
    customFields?: Record<string, any>;
  }): Promise<Listing | null> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';

      // Verify category exists
      const category = await kv.get<Category>(`${keyPrefix}category:id:${data.categoryId}`);
      if (!category) {
        throw new Error('Category not found');
      }

      // Generate a slug from the title
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if slug already exists
      const existingListing = await kv.get(`${keyPrefix}listing:site:${siteId}:${slug}`);
      if (existingListing) {
        throw new Error('A listing with a similar title already exists');
      }

      // Create new listing
      const timestamp = Date.now();
      const listing: Listing = {
        id: `listing_${timestamp}`,
        siteId,
        categoryId: data.categoryId,
        title: data.title,
        slug,
        metaDescription: data.metaDescription,
        content: data.content,
        imageUrl: data.imageUrl,
        backlinkUrl: data.backlinkUrl,
        backlinkAnchorText: data.backlinkAnchorText || data.title,
        backlinkPosition: data.backlinkPosition || 'prominent',
        backlinkType: data.backlinkType || 'dofollow',
        customFields: data.customFields || {},
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Use a Redis transaction for atomicity
      const multi = redis.multi();

      multi.set(`${keyPrefix}listing:id:${listing.id}`, JSON.stringify(listing));
      multi.set(`${keyPrefix}listing:site:${siteId}:${listing.slug}`, JSON.stringify(listing));
      multi.set(`${keyPrefix}listing:category:${listing.categoryId}:${listing.slug}`, JSON.stringify(listing));

      // Execute all commands as a transaction
      const results = await multi.exec();

      // Check for errors in the transaction
      const errors = results.filter(([err]) => err !== null);
      if (errors.length > 0) {
        console.error('Transaction errors:', errors);
        throw new Error('Failed to save listing data');
      }

      // Index the listing for search
      try {
        await searchIndexer.indexListing(listing);
      } catch (error) {
        // Log but don't fail the request if indexing fails
        console.error('Error indexing listing:', error);
      }

      return listing;
    } catch (error) {
      console.error('Error creating listing:', error);
      return null;
    }
  }
}
