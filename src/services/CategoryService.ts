import { kv } from '@/lib/redis-client';
import { Category } from '@/types';

/**
 * Service for managing categories
 */
export class CategoryService {
  /**
   * Get a category by its slug within a site
   * 
   * @param siteId The site ID
   * @param slug The category slug
   * @returns The category or null if not found
   */
  static async getCategoryBySlug(siteId: string, slug: string): Promise<Category | null> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';
      
      // Get category by slug
      const category = await kv.get<Category>(`${keyPrefix}category:site:${siteId}:slug:${slug}`);
      
      return category;
    } catch (error) {
      console.error(`Error retrieving category with slug ${slug} for site ${siteId}:`, error);
      return null;
    }
  }
}
