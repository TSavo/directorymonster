import { redis } from '@/lib/redis-client';
import { SiteConfig } from '@/types';

/**
 * Service for managing sites
 */
export class SiteService {
  /**
   * Get a site by its slug
   *
   * @param slug The slug of the site to retrieve
   * @returns The site if found, null otherwise
   */
  static async getSiteBySlug(slug: string): Promise<SiteConfig | null> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';

      // Get site by slug
      const siteKey = `${keyPrefix}site:slug:${slug}`;
      const siteData = await redis.get(siteKey);

      if (!siteData) {
        return null;
      }

      // Parse site data if it's a string
      try {
        return typeof siteData === 'string' ? JSON.parse(siteData) : siteData;
      } catch (e) {
        console.error('Error parsing site data:', e);
        return null;
      }
    } catch (error) {
      console.error(`Error retrieving site with slug ${slug}:`, error);
      return null;
    }
  }
}
