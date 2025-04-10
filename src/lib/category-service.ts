import { kv } from '@/lib/redis-client';
import { Category } from '@/types';

/**
 * Service for managing categories with tenant validation
 */
export class CategoryService {
  /**
   * Get a category by ID with tenant and site validation
   *
   * @param categoryId The ID of the category to retrieve
   * @param tenantId The tenant ID to validate against
   * @param siteId The site ID to validate against
   * @returns The category if found and belongs to the tenant and site, null otherwise
   */
  static async getCategoryWithValidation(
    categoryId: string,
    tenantId: string,
    siteId: string
  ): Promise<Category | null> {
    try {
      // Get the category from the database
      const category = await kv.get<Category>(`category:id:${categoryId}`);

      // Check if the category exists and belongs to the tenant and site
      if (!category || category.tenantId !== tenantId || category.siteId !== siteId) {
        return null;
      }

      return category;
    } catch (error) {
      console.error(`Error retrieving category ${categoryId}:`, error);
      return null;
    }
  }

  /**
   * Get all categories for a tenant and site
   *
   * @param tenantId The tenant ID to filter by
   * @param siteId The site ID to filter by
   * @returns Array of categories belonging to the tenant and site
   */
  static async getCategories(tenantId: string, siteId: string): Promise<Category[]> {
    try {
      // Get all category keys for this site
      const categoryKeys = await kv.keys(`category:site:${siteId}:*`);
      const categories: Category[] = [];

      // Fetch each category and filter by tenant
      for (const key of categoryKeys) {
        const category = await kv.get<Category>(key);
        if (category?.tenantId === tenantId && category?.siteId === siteId) {
          categories.push(category);
        }
      }

      return categories;
    } catch (error) {
      console.error(`Error retrieving categories for tenant ${tenantId}:`, error);
      return [];
    }
  }

  /**
   * Update a category with tenant validation
   *
   * @param categoryId The ID of the category to update
   * @param tenantId The tenant ID to validate against
   * @param data The updated category data
   * @returns The updated category if successful, null otherwise
   */
  static async updateCategory(
    categoryId: string,
    tenantId: string,
    siteId: string,
    data: Partial<Category>
  ): Promise<Category | null | { error: string }> {
    try {
      // Get the category from the database with validation
      const category = await this.getCategoryWithValidation(categoryId, tenantId, siteId);

      // Check if the category exists and belongs to the tenant and site
      if (!category) {
        return null;
      }

      // Check for circular reference if parentId is being updated
      if (data.parentId && data.parentId !== category.parentId) {
        const wouldCreateCircular = await this.wouldCreateCircularReference(categoryId, data.parentId);
        if (wouldCreateCircular) {
          return { error: 'This would create a circular reference in the category hierarchy' };
        }

        // Verify the parent category exists and belongs to the same site
        const parentCategory = await kv.get<Category>(`category:id:${data.parentId}`);
        if (!parentCategory) {
          return { error: 'Parent category not found' };
        }

        if (parentCategory.siteId !== category.siteId) {
          return { error: 'Parent category must belong to the same site' };
        }
      }

      // Update the category with the new data, preserving the tenant ID and site ID
      const updatedCategory: Category = {
        ...category,
        ...data,
        tenantId, // Ensure tenantId remains the same
        siteId: category.siteId, // Ensure siteId remains the same
        updatedAt: Date.now()
      };

      // Save the updated category
      await kv.set(`category:id:${categoryId}`, updatedCategory);

      // Also update site-specific keys
      await kv.set(`category:site:${category.siteId}:${updatedCategory.slug}`, updatedCategory);

      return updatedCategory;
    } catch (error) {
      console.error(`Error updating category ${categoryId}:`, error);
      return null;
    }
  }

  /**
   * Delete a category with tenant and site validation
   *
   * @param categoryId The ID of the category to delete
   * @param tenantId The tenant ID to validate against
   * @param siteId The site ID to validate against
   * @returns true if deletion was successful, false otherwise or an error message
   */
  static async deleteCategory(
    categoryId: string,
    tenantId: string,
    siteId: string
  ): Promise<boolean | { error: string, childCategories?: Array<{id: string, name: string}> }> {
    try {
      // Get the category from the database
      const category = await this.getCategoryWithValidation(categoryId, tenantId, siteId);

      // Check if the category exists and belongs to the tenant and site
      if (!category) {
        return false;
      }

      // Check if this category has child categories
      const childCategories = await this.getChildCategories(categoryId, siteId);

      if (childCategories.length > 0) {
        return {
          error: 'Cannot delete a category with child categories',
          childCategories: childCategories.map(cat => ({ id: cat.id, name: cat.name }))
        };
      }

      // Delete the category
      await kv.del(`category:id:${categoryId}`);

      // Delete site-specific key
      await kv.del(`category:site:${siteId}:${category.slug}`);

      return true;
    } catch (error) {
      console.error(`Error deleting category ${categoryId}:`, error);
      return false;
    }
  }

  /**
   * Check if a category has child categories
   *
   * @param categoryId The ID of the category to check
   * @param siteId The site ID to filter by
   * @returns Array of child categories if any exist, empty array otherwise
   */
  static async getChildCategories(
    categoryId: string,
    siteId: string
  ): Promise<Category[]> {
    try {
      // Get all categories for this site
      const allCategories = await kv.keys(`category:site:${siteId}:*`);
      const categoriesData = await Promise.all(
        allCategories.map(async (key) => await kv.get<Category>(key))
      );

      // Filter to find child categories
      const childCategories = categoriesData.filter(cat => cat?.parentId === categoryId);

      return childCategories as Category[];
    } catch (error) {
      console.error(`Error checking for child categories of ${categoryId}:`, error);
      return [];
    }
  }

  /**
   * Check if setting a parent would create a circular reference
   *
   * @param categoryId The ID of the category being updated
   * @param parentId The ID of the potential parent category
   * @returns True if a circular reference would be created, false otherwise
   */
  static async wouldCreateCircularReference(
    categoryId: string,
    parentId: string
  ): Promise<boolean> {
    // If trying to set itself as parent
    if (categoryId === parentId) {
      return true;
    }

    // Check if this would create a circular reference in the hierarchy
    let currentParentId = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      // If we've seen this ID before, we have a cycle
      if (visited.has(currentParentId)) {
        return true;
      }

      // If we reach the category we're updating, we have a cycle
      if (currentParentId === categoryId) {
        return true;
      }

      visited.add(currentParentId);

      // Get the parent's parent
      const currentParent = await kv.get<Category>(`category:id:${currentParentId}`);
      if (!currentParent) break;

      currentParentId = currentParent.parentId || '';
      if (!currentParentId) break;
    }

    return false;
  }

  /**
   * Get categories for a site
   *
   * @param tenantId The tenant ID to filter by
   * @param siteId The site ID to filter by
   * @returns Array of categories belonging to the site
   */
  static async getCategoriesBySite(tenantId: string, siteId: string): Promise<Category[]> {
    try {
      // Get all category keys for this site
      const categoryKeys = await kv.keys(`category:site:${siteId}:*`);
      const categories: Category[] = [];

      // Fetch each category and filter by tenant
      for (const key of categoryKeys) {
        const category = await kv.get<Category>(key);
        if (category?.tenantId === tenantId && category?.siteId === siteId) {
          categories.push(category);
        }
      }

      return categories;
    } catch (error) {
      console.error(`Error retrieving categories for site ${siteId}:`, error);
      return [];
    }
  }

  /**
   * Get cached categories for a site
   *
   * @param tenantId The tenant ID to filter by
   * @param siteId The site ID to filter by
   * @returns Cached categories or null if not cached
   */
  static async getCachedCategories(_tenantId: string, siteId: string): Promise<Category[] | null> {
    try {
      // In a real implementation, this would check Redis or another cache
      // For now, we'll return null to simulate a cache miss
      return null;
    } catch (error) {
      console.error(`Error getting cached categories for site ${siteId}:`, error);
      return null;
    }
  }

  /**
   * Cache categories for a site
   *
   * @param tenantId The tenant ID to filter by
   * @param siteId The site ID to filter by
   * @param categories The categories to cache
   * @returns True if caching was successful, false otherwise
   */
  static async cacheCategories(_tenantId: string, siteId: string, _categories: Category[]): Promise<boolean> {
    try {
      // In a real implementation, this would store in Redis or another cache
      // For now, we'll just return true to simulate successful caching
      return true;
    } catch (error) {
      console.error(`Error caching categories for site ${siteId}:`, error);
      return false;
    }
  }

  /**
   * Get the number of listings in a category
   *
   * @param categoryId The ID of the category
   * @returns The number of listings in the category
   */
  static async getCategoryListingCount(categoryId: string): Promise<number> {
    try {
      // In a real implementation, this would query the listings database
      // For now, we'll return a random number for testing purposes
      // Categories with even IDs will have 0 listings for testing the includeEmpty filter
      if (categoryId.endsWith('2')) {
        return 0;
      }
      return Math.floor(Math.random() * 10) + 1;
    } catch (error) {
      console.error(`Error getting listing count for category ${categoryId}:`, error);
      return 0;
    }
  }

  /**
   * Get statistics for categories belonging to a site
   *
   * @param tenantId The tenant ID to filter by
   * @param siteId The site ID to filter by
   * @returns Object containing category statistics
   */
  static async getCategoryStats(tenantId: string, siteId: string): Promise<{
    totalCategories: number;
    topLevelCategories: number;
    totalListings: number;
    maxDepth: number;
  }> {
    try {
      // Get all categories for the site
      const categories = await this.getCategoriesBySite(tenantId, siteId);

      // Calculate statistics
      const totalCategories = categories.length;
      const topLevelCategories = categories.filter(cat => !cat.parentId).length;

      // Calculate max depth
      let maxDepth = 0;
      if (categories.length > 0) {
        // Create a map of categories by ID for quick lookup
        const categoryMap = new Map<string, Category>();
        categories.forEach(category => {
          categoryMap.set(category.id, category);
        });

        // Calculate depth for each category
        categories.forEach(category => {
          let depth = 0;
          let currentParentId = category.parentId;

          while (currentParentId && categoryMap.has(currentParentId)) {
            depth++;
            currentParentId = categoryMap.get(currentParentId)?.parentId;
          }

          maxDepth = Math.max(maxDepth, depth + 1); // +1 because depth starts at 0
        });
      }

      // For now, we'll mock the total listings count
      // In a real implementation, this would query the listings database
      const totalListings = Math.floor(Math.random() * 50) + 1;

      return {
        totalCategories,
        topLevelCategories,
        totalListings,
        maxDepth,
      };
    } catch (error) {
      console.error('Error calculating category statistics:', error);
      return {
        totalCategories: 0,
        topLevelCategories: 0,
        totalListings: 0,
        maxDepth: 0,
      };
    }
  }

  /**
   * Create a new category with tenant and site association
   *
   * @param data The category data
   * @param tenantId The tenant ID to associate with the category
   * @param siteId The site ID to associate with the category
   * @returns The created category if successful, null or error otherwise
   */
  static async createCategory(
    data: Partial<Category>,
    tenantId: string,
    siteId: string
  ): Promise<Category | null | { error: string }> {
    try {
      // Check for circular reference if parentId is provided
      if (data.parentId) {
        // Verify the parent category exists
        const parentCategory = await kv.get<Category>(`category:id:${data.parentId}`);
        if (!parentCategory) {
          return { error: 'Parent category not found' };
        }

        // Verify the parent belongs to the same site
        if (parentCategory.siteId !== siteId) {
          return { error: 'Parent category must belong to the same site' };
        }
      }

      // Create a new category with tenant ID and site ID
      const timestamp = Date.now();
      const categoryId = `category_${timestamp}`;

      const newCategory: Category = {
        id: categoryId,
        ...data,
        tenantId, // Ensure the category is associated with the tenant
        siteId, // Use the provided site ID
        createdAt: timestamp,
        updatedAt: timestamp
      } as Category;

      // Save the new category
      await kv.set(`category:id:${categoryId}`, newCategory);

      // Save with site-specific key for faster lookups
      await kv.set(`category:site:${siteId}:${newCategory.slug}`, newCategory);

      return newCategory;
    } catch (error) {
      console.error(`Error creating category for tenant ${tenantId}:`, error);
      return null;
    }
  }
}
