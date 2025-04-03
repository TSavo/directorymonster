import { redis } from '@/lib/redis-client';
import { Category } from '@/types';

/**
 * Interface for category creation data
 */
interface CreateCategoryData {
  name: string;
  slug: string;
  metaDescription: string;
  tenantId: string;
  siteId: string;
  parentId?: string | null;
}

/**
 * Service for managing categories
 */
export class CategoryService {
  /**
   * Get all categories for a site
   *
   * @param siteId The ID of the site
   * @returns Array of categories for the site
   */
  static async getCategoriesBySiteId(siteId: string): Promise<Category[]> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';

      // Get category IDs for this site
      const categoriesKey = `${keyPrefix}site:${siteId}:categories`;
      const categoryIds = await redis.smembers(categoriesKey) || [];

      if (!categoryIds.length) {
        return [];
      }

      // Fetch each category by ID
      const categoryPromises = categoryIds.map(async (id) => {
        const categoryKey = `${keyPrefix}category:id:${id}`;
        const categoryData = await redis.get(categoryKey);

        if (!categoryData) return null;

        try {
          return typeof categoryData === 'string' ? JSON.parse(categoryData) : categoryData;
        } catch (e) {
          console.error(`Error parsing category data for ID ${id}:`, e);
          return null;
        }
      });

      // Resolve all promises and filter out nulls
      const categories = (await Promise.all(categoryPromises)).filter(Boolean) as Category[];

      return categories;
    } catch (error) {
      console.error(`Error retrieving categories for site ${siteId}:`, error);
      return [];
    }
  }

  /**
   * Validates that a category belongs to the specified tenant
   *
   * @param categoryId The ID of the category to validate
   * @param tenantId The tenant ID to validate against
   * @returns The category if it belongs to the specified tenant
   * @throws Error if the category does not exist or belongs to a different tenant
   */
  static async validateCategoryTenant(categoryId: string, tenantId: string): Promise<Category> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';

      // Get the category
      const categoryKey = `${keyPrefix}category:id:${categoryId}`;
      const categoryData = await redis.get(categoryKey);

      if (!categoryData) {
        throw new Error('Category not found');
      }

      // Parse the category data
      let category: Category;
      try {
        category = typeof categoryData === 'string' ? JSON.parse(categoryData) : categoryData;
      } catch (e) {
        console.error(`Error parsing category data for ID ${categoryId}:`, e);
        throw new Error('Invalid category data');
      }

      // Validate tenant ID
      if (category.tenantId !== tenantId) {
        throw new Error('Category does not belong to the specified tenant');
      }

      return category;
    } catch (error) {
      console.error(`Error validating category tenant: ${error}`);
      throw error;
    }
  }

  /**
   * Create a new category
   *
   * @param data The category data
   * @returns The created category
   * @throws Error if a category with the same slug already exists
   */
  static async createCategory(data: CreateCategoryData, requestingTenantId?: string): Promise<Category> {
    // If a requesting tenant ID is provided, validate that it matches the category's tenant ID
    if (requestingTenantId && requestingTenantId !== data.tenantId) {
      throw new Error('You do not have permission to create categories for this tenant');
    }
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';

      // Check if a category with this slug already exists
      const existingCategoryKey = `${keyPrefix}category:site:${data.siteId}:${data.slug}`;
      const existingCategory = await redis.get(existingCategoryKey);

      if (existingCategory) {
        throw new Error('A category with this slug already exists');
      }

      // Get the current highest order value
      const categoriesKey = `${keyPrefix}site:${data.siteId}:categories`;
      const categoryIds = await redis.smembers(categoriesKey) || [];

      let highestOrder = 0;

      if (categoryIds.length > 0) {
        // Fetch each category to find the highest order
        const categoryPromises = categoryIds.map(async (id) => {
          const categoryKey = `${keyPrefix}category:id:${id}`;
          const categoryData = await redis.get(categoryKey);

          if (!categoryData) return null;

          try {
            return typeof categoryData === 'string' ? JSON.parse(categoryData) : categoryData;
          } catch (e) {
            console.error(`Error parsing category data for ID ${id}:`, e);
            return null;
          }
        });

        const categories = (await Promise.all(categoryPromises)).filter(Boolean) as Category[];

        // Find the highest order value
        highestOrder = categories.reduce((max, cat) => Math.max(max, cat?.order || 0), 0);
      }

      // Create new category
      const timestamp = Date.now();
      const category: Category = {
        id: `category_${timestamp}`,
        name: data.name,
        slug: data.slug,
        metaDescription: data.metaDescription,
        tenantId: data.tenantId,
        siteId: data.siteId,
        parentId: data.parentId || null,
        order: highestOrder + 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      // Use a Redis transaction for atomicity
      const multi = redis.multi();

      // Store category by ID
      const categoryIdKey = `${keyPrefix}category:id:${category.id}`;
      multi.set(categoryIdKey, JSON.stringify(category));

      // Store category by site and slug
      multi.set(existingCategoryKey, JSON.stringify(category));

      // Add to site categories index
      multi.sadd(categoriesKey, category.id);

      // Execute transaction
      await multi.exec();

      return category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }
}
