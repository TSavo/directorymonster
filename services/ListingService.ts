import { kv } from '../lib/redis-client';
import { Listing } from '../types';
import { generateId } from '../utils/id';

/**
 * Service for managing listing operations
 */
export class ListingService {
  /**
   * Get a listing by its ID
   *
   * @param siteId The site ID
   * @param id The listing ID
   * @returns The listing or null if not found
   */
  static async getListingById(siteId: string, id: string): Promise<Listing | null> {
    try {
      const listing = await kv.get<Listing>(`site:${siteId}:listing:id:${id}`);
      return listing;
    } catch (error) {
      console.error('Error fetching listing by ID:', error);
      return null;
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
      // First get the listing ID from the slug index
      const listingId = await kv.get<string>(`site:${siteId}:listing:slug:${slug}`);

      if (!listingId) {
        return null;
      }

      // Then get the listing by ID
      return await this.getListingById(siteId, listingId);
    } catch (error) {
      console.error('Error fetching listing by slug:', error);
      return null;
    }
  }

  /**
   * Get all listings for a site
   *
   * @param siteId The site ID
   * @returns Array of all listings for the site
   */
  static async getListingsBySiteId(siteId: string): Promise<Listing[]> {
    try {
      // Get all listing IDs for the site
      const listingIds = await kv.keys(`site:${siteId}:listing:id:*`);

      if (!listingIds.length) {
        return [];
      }

      // Get all listings by their IDs
      const listings = await Promise.all(
        listingIds.map(key => {
          const id = key.replace(`site:${siteId}:listing:id:`, '');
          return this.getListingById(siteId, id);
        })
      );

      // Filter out any null values
      return listings.filter(Boolean) as Listing[];
    } catch (error) {
      console.error('Error fetching listings by site ID:', error);
      return [];
    }
  }

  /**
   * Get listings for a specific site and category with filtering and pagination
   *
   * @param siteId The site ID
   * @param categoryId The category ID
   * @param options Filtering and pagination options
   * @returns Object containing listings and pagination info
   */
  static async getListingsBySiteAndCategory(
    siteId: string,
    categoryId: string,
    options: {
      page?: number;
      limit?: number;
      name?: string;
      status?: string;
      sort?: string;
      order?: 'asc' | 'desc';
      featured?: boolean;
    } = {}
  ): Promise<{
    results: Listing[];
    pagination: {
      totalResults: number;
      currentPage: number;
      limit: number;
      totalPages: number;
    };
  }> {
    try {
      // Set default options
      const page = options.page || 1;
      const limit = options.limit || 20;
      const sort = options.sort || 'createdAt';
      const order = options.order || 'desc';

      // Get all listing IDs for the category
      const listingKeys = await kv.keys(`category:${categoryId}:listings:*`);

      if (!listingKeys.length) {
        return {
          results: [],
          pagination: {
            totalResults: 0,
            currentPage: page,
            limit,
            totalPages: 0
          }
        };
      }

      // Extract listing IDs from keys
      const listingIds = listingKeys.map(key => key.split(':').pop() as string);

      // Get all listings by their IDs
      let listings = await Promise.all(
        listingIds.map(id => this.getListingById(siteId, id))
      );

      // Filter out any null values
      listings = listings.filter(Boolean) as Listing[];

      // Apply filters
      if (options.name) {
        const nameRegex = new RegExp(options.name, 'i');
        listings = listings.filter(listing => nameRegex.test(listing.title));
      }

      if (options.status) {
        listings = listings.filter(listing => listing.status === options.status);
      }

      if (options.featured !== undefined) {
        listings = listings.filter(listing => listing.featured === options.featured);
      }

      // Sort listings
      listings.sort((a, b) => {
        const aValue = a[sort as keyof Listing];
        const bValue = b[sort as keyof Listing];

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return order === 'asc' ? aValue - bValue : bValue - aValue;
        }

        return 0;
      });

      // Calculate pagination
      const totalResults = listings.length;
      const totalPages = Math.ceil(totalResults / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedListings = listings.slice(startIndex, endIndex);

      return {
        results: paginatedListings,
        pagination: {
          totalResults,
          currentPage: page,
          limit,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error fetching listings by site and category:', error);
      return {
        results: [],
        pagination: {
          totalResults: 0,
          currentPage: options.page || 1,
          limit: options.limit || 20,
          totalPages: 0
        }
      };
    }
  }

  /**
   * Create a new listing
   *
   * @param siteId The site ID
   * @param listing The listing data to create
   * @returns The created listing
   */
  static async createListing(siteId: string, listing: Omit<Listing, 'id' | 'siteId' | 'createdAt' | 'updatedAt'>): Promise<Listing> {
    try {
      // Check if a listing with the same slug already exists
      const existingListing = await this.getListingBySlug(siteId, listing.slug);

      if (existingListing) {
        throw new Error(`Listing with slug '${listing.slug}' already exists for site '${siteId}'`);
      }

      // Generate a new ID for the listing
      const id = generateId();
      const now = Date.now();

      const newListing: Listing = {
        ...listing,
        id,
        siteId,
        createdAt: now,
        updatedAt: now,
      };

      // Use a transaction to ensure atomicity
      const transaction = kv.multi();

      // Store the listing
      transaction.set(`site:${siteId}:listing:id:${id}`, newListing);

      // Create a slug index
      transaction.set(`site:${siteId}:listing:slug:${listing.slug}`, id);

      // Add to site listings set for efficient retrieval
      transaction.set(`site:${siteId}:listings:${id}`, id);

      // Add to category listings set for efficient retrieval
      transaction.set(`category:${listing.categoryId}:listings:${id}`, id);

      // Execute the transaction
      await transaction.exec();

      return newListing;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw error;
    }
  }

  /**
   * Update an existing listing
   *
   * @param siteId The site ID
   * @param id The listing ID
   * @param updates The listing data to update
   * @returns The updated listing
   */
  static async updateListing(siteId: string, id: string, updates: Partial<Listing>): Promise<Listing> {
    try {
      // Get the existing listing
      const existingListing = await this.getListingById(siteId, id);

      if (!existingListing) {
        throw new Error(`Listing with ID '${id}' not found for site '${siteId}'`);
      }

      // If the slug is being updated, check if the new slug is already in use
      if (updates.slug && updates.slug !== existingListing.slug) {
        const listingWithNewSlug = await this.getListingBySlug(siteId, updates.slug);

        if (listingWithNewSlug && listingWithNewSlug.id !== id) {
          throw new Error(`Listing with slug '${updates.slug}' already exists for site '${siteId}'`);
        }

        // Use a transaction to ensure atomicity
        const transaction = kv.multi();

        // Update the slug index
        transaction.del(`site:${siteId}:listing:slug:${existingListing.slug}`);
        transaction.set(`site:${siteId}:listing:slug:${updates.slug}`, id);

        // Execute the transaction
        await transaction.exec();
      }

      // Update the listing
      const updatedListing: Listing = {
        ...existingListing,
        ...updates,
        updatedAt: Date.now(),
      };

      // Store the updated listing using a transaction
      const updateTransaction = kv.multi();
      updateTransaction.set(`site:${siteId}:listing:id:${id}`, updatedListing);
      await updateTransaction.exec();

      return updatedListing;
    } catch (error) {
      console.error('Error updating listing:', error);
      throw error;
    }
  }

  /**
   * Delete a listing
   *
   * @param siteId The site ID
   * @param id The listing ID
   * @returns True if the listing was deleted, false otherwise
   */
  static async deleteListing(siteId: string, id: string): Promise<boolean> {
    try {
      // Get the existing listing
      const existingListing = await this.getListingById(siteId, id);

      if (!existingListing) {
        return false;
      }

      // Use a transaction to ensure atomicity
      const transaction = kv.multi();

      // Delete the listing
      transaction.del(`site:${siteId}:listing:id:${id}`);

      // Delete the slug index
      transaction.del(`site:${siteId}:listing:slug:${existingListing.slug}`);

      // Remove from site listings set
      transaction.del(`site:${siteId}:listings:${id}`);

      // Remove from category listings set
      transaction.del(`category:${existingListing.categoryId}:listings:${id}`);

      // Execute the transaction
      await transaction.exec();

      return true;
    } catch (error) {
      console.error('Error deleting listing:', error);
      return false;
    }
  }
}
