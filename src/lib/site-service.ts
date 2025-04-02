import { kv } from '@/lib/redis-client';
import { SiteConfig } from '@/types';

/**
 * Service for site-related operations
 */
export class SiteService {
  /**
   * Get a site by its slug
   * 
   * @param slug - The site slug
   * @returns The site or null if not found
   */
  static async getSiteBySlug(slug: string): Promise<SiteConfig | null> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';
      
      // Get site by slug
      let site = await kv.get<SiteConfig>(`${keyPrefix}site:slug:${slug}`);
      
      // Parse site if it's a string
      if (typeof site === 'string') {
        try {
          site = JSON.parse(site);
        } catch (e) {
          console.error('Error parsing site JSON:', e);
          return null;
        }
      }
      
      return site;
    } catch (error) {
      console.error(`Error getting site by slug ${slug}:`, error);
      return null;
    }
  }
  
  /**
   * Get a site ID by its slug
   * 
   * @param slug - The site slug
   * @returns The site ID or null if not found
   */
  static async getSiteIdBySlug(slug: string): Promise<string | null> {
    const site = await this.getSiteBySlug(slug);
    return site ? site.id : null;
  }
  
  /**
   * Get all sites for a tenant
   * 
   * @param tenantId - The tenant ID
   * @returns Array of sites
   */
  static async getSitesByTenant(tenantId: string): Promise<SiteConfig[]> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';
      
      // Get all site keys for this tenant
      const siteKeys = await kv.keys(`${keyPrefix}site:tenant:${tenantId}:*`);
      
      if (siteKeys.length === 0) {
        return [];
      }
      
      // Get all sites
      const sitesData = await Promise.all(
        siteKeys.map(async (key) => await kv.get<SiteConfig>(key))
      );
      
      // Filter out null values and parse strings
      return sitesData
        .filter(Boolean)
        .map(site => {
          if (typeof site === 'string') {
            try {
              return JSON.parse(site);
            } catch (e) {
              console.error('Error parsing site JSON:', e);
              return null;
            }
          }
          return site;
        })
        .filter(Boolean) as SiteConfig[];
    } catch (error) {
      console.error(`Error getting sites for tenant ${tenantId}:`, error);
      return [];
    }
  }
}
