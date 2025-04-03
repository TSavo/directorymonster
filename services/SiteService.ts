import { kv } from '../lib/redis-client';
import { SiteConfig } from '../types';
import { generateId } from '../utils/id';

/**
 * Service for managing site operations
 */
export class SiteService {
  /**
   * Get a site by its ID
   *
   * @param id The site ID
   * @returns The site or null if not found
   */
  static async getSiteById(id: string): Promise<SiteConfig | null> {
    try {
      const site = await kv.get<SiteConfig>(`site:id:${id}`);
      return site;
    } catch (error) {
      console.error('Error fetching site by ID:', error);
      return null;
    }
  }

  /**
   * Get a site by its slug
   *
   * @param slug The site slug
   * @returns The site or null if not found
   */
  static async getSiteBySlug(slug: string): Promise<SiteConfig | null> {
    try {
      // First get the site ID from the slug index
      const siteId = await kv.get<string>(`site:slug:${slug}`);

      if (!siteId) {
        return null;
      }

      // Then get the site by ID
      return await this.getSiteById(siteId);
    } catch (error) {
      console.error('Error fetching site by slug:', error);
      return null;
    }
  }

  /**
   * Get all sites
   *
   * @returns Array of all sites
   */
  static async getAllSites(): Promise<SiteConfig[]> {
    try {
      // Get all site IDs
      const siteIds = await kv.keys('site:id:*');

      if (!siteIds.length) {
        return [];
      }

      // Get all sites by their IDs
      const sites = await Promise.all(
        siteIds.map(key => {
          const id = key.replace('site:id:', '');
          return this.getSiteById(id);
        })
      );

      // Filter out any null values
      return sites.filter(Boolean) as SiteConfig[];
    } catch (error) {
      console.error('Error fetching all sites:', error);
      return [];
    }
  }

  /**
   * Create a new site
   *
   * @param site The site data to create
   * @returns The created site
   */
  static async createSite(site: Omit<SiteConfig, 'id'>): Promise<SiteConfig> {
    try {
      // Check if a site with the same slug already exists
      const existingSite = await this.getSiteBySlug(site.slug);

      if (existingSite) {
        throw new Error(`Site with slug '${site.slug}' already exists`);
      }

      // Generate a new ID for the site
      const id = generateId();
      const newSite: SiteConfig = {
        ...site,
        id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Use a transaction to ensure atomicity
      const transaction = kv.multi();

      // Store the site
      transaction.set(`site:id:${id}`, newSite);

      // Create a slug index
      transaction.set(`site:slug:${site.slug}`, id);

      // Execute the transaction
      await transaction.exec();

      return newSite;
    } catch (error) {
      console.error('Error creating site:', error);
      throw error;
    }
  }

  /**
   * Update an existing site
   *
   * @param id The site ID
   * @param updates The site data to update
   * @returns The updated site
   */
  static async updateSite(id: string, updates: Partial<SiteConfig>): Promise<SiteConfig> {
    try {
      // Get the existing site
      const existingSite = await this.getSiteById(id);

      if (!existingSite) {
        throw new Error(`Site with ID '${id}' not found`);
      }

      // If the slug is being updated, check if the new slug is already in use
      if (updates.slug && updates.slug !== existingSite.slug) {
        const siteWithNewSlug = await this.getSiteBySlug(updates.slug);

        if (siteWithNewSlug && siteWithNewSlug.id !== id) {
          throw new Error(`Site with slug '${updates.slug}' already exists`);
        }

        // Use a transaction to ensure atomicity
        const transaction = kv.multi();

        // Update the slug index
        transaction.del(`site:slug:${existingSite.slug}`);
        transaction.set(`site:slug:${updates.slug}`, id);

        // Execute the transaction
        await transaction.exec();
      }

      // Update the site
      const updatedSite: SiteConfig = {
        ...existingSite,
        ...updates,
        updatedAt: Date.now(),
      };

      // Store the updated site
      await kv.set(`site:id:${id}`, updatedSite);

      return updatedSite;
    } catch (error) {
      console.error('Error updating site:', error);
      throw error;
    }
  }

  /**
   * Delete a site
   *
   * @param id The site ID
   * @returns True if the site was deleted, false otherwise
   */
  static async deleteSite(id: string): Promise<boolean> {
    try {
      // Get the existing site
      const existingSite = await this.getSiteById(id);

      if (!existingSite) {
        return false;
      }

      // Use a transaction to ensure atomicity
      const transaction = kv.multi();

      // Delete the site
      transaction.del(`site:id:${id}`);

      // Delete the slug index
      transaction.del(`site:slug:${existingSite.slug}`);

      // Execute the transaction
      await transaction.exec();

      return true;
    } catch (error) {
      console.error('Error deleting site:', error);
      return false;
    }
  }
}
