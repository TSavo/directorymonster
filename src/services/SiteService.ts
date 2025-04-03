import { kv } from '@/lib/redis-client';
import { SiteConfig } from '@/types';

/**
 * Service for managing sites
 */
export class SiteService {
  /**
   * Get a site by its slug
   * 
   * @param slug The site slug to look up
   * @returns The site config or null if not found
   */
  static async getSiteBySlug(slug: string): Promise<SiteConfig | null> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';
      
      // Get site by slug
      const site = await kv.get<SiteConfig>(`${keyPrefix}site:slug:${slug}`);
      
      return site;
    } catch (error) {
      console.error(`Error retrieving site with slug ${slug}:`, error);
      return null;
    }
  }
}
