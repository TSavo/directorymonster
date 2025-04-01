import { kv } from '@/lib/redis-client';
import { Category } from '@/types';
import { categoryKeys } from '@/lib/tenant/redis-keys';

/**
 * Service for managing categories with tenant validation
 */
export class CategoryService {
  /**
   * Get a category by ID with tenant validation
   * 
   * @param categoryId The ID of the category to retrieve
   * @param tenantId The tenant ID to validate against
   * @returns The category if found and belongs to the tenant, null otherwise
   */
  static async getCategoryWithTenantValidation(
    categoryId: string,
    tenantId: string
  ): Promise<Category | null> {
    try {
      // Get the category from the database
      const category = await kv.get<Category>(`category:id:${categoryId}`);
      
      // Check if the category exists and belongs to the tenant
      if (!category || category.tenantId !== tenantId) {
        return null;
      }
      
      return category;
    } catch (error) {
      console.error(`Error retrieving category ${categoryId}:`, error);
      return null;
    }
  }
  
  /**
   * Get all categories for a tenant
   * 
   * @param tenantId The tenant ID to filter by
   * @returns Array of categories belonging to the tenant
   */
  static async getCategoriesByTenant(tenantId: string): Promise<Category[]> {
    try {
      // Get all category keys
      const categoryKeys = await kv.keys('category:id:*');
      const categories: Category[] = [];
      
      // Fetch each category and filter by tenant
      for (const key of categoryKeys) {
        const category = await kv.get<Category>(key);
        if (category && category.tenantId === tenantId) {
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
  static async updateCategoryWithTenantValidation(
    categoryId: string,
    tenantId: string,
    data: Partial<Category>
  ): Promise<Category | null> {
    try {
      // Get the category from the database
      const category = await this.getCategoryWithTenantValidation(categoryId, tenantId);
      
      // Check if the category exists and belongs to the tenant
      if (!category) {
        return null;
      }
      
      // Update the category with the new data, preserving the tenant ID
      const updatedCategory: Category = {
        ...category,
        ...data,
        tenantId, // Ensure tenantId remains the same
        updatedAt: Date.now()
      };
      
      // Save the updated category
      await kv.set(`category:id:${categoryId}`, updatedCategory);
      
      // Also update tenant-specific keys if needed
      if (category.siteId) {
        await kv.set(`category:tenant:${tenantId}:site:${category.siteId}:${updatedCategory.slug}`, updatedCategory);
      }
      
      return updatedCategory;
    } catch (error) {
      console.error(`Error updating category ${categoryId}:`, error);
      return null;
    }
  }
  
  /**
   * Delete a category with tenant validation
   * 
   * @param categoryId The ID of the category to delete
   * @param tenantId The tenant ID to validate against
   * @returns true if deletion was successful, false otherwise
   */
  static async deleteCategoryWithTenantValidation(
    categoryId: string,
    tenantId: string
  ): Promise<boolean> {
    try {
      // Get the category from the database
      const category = await this.getCategoryWithTenantValidation(categoryId, tenantId);
      
      // Check if the category exists and belongs to the tenant
      if (!category) {
        return false;
      }
      
      // Delete the category
      await kv.del(`category:id:${categoryId}`);
      
      // Also delete any tenant-specific keys
      if (category.siteId) {
        await kv.del(`category:site:${category.siteId}:${category.slug}`);
        await kv.del(`category:tenant:${tenantId}:site:${category.siteId}:${category.slug}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting category ${categoryId}:`, error);
      return false;
    }
  }
  
  /**
   * Create a new category with tenant association
   * 
   * @param data The category data
   * @param tenantId The tenant ID to associate with the category
   * @returns The created category if successful, null otherwise
   */
  static async createCategoryWithTenant(
    data: Partial<Category>,
    tenantId: string
  ): Promise<Category | null> {
    try {
      // Create a new category with tenant ID
      const timestamp = Date.now();
      const categoryId = `category_${timestamp}`;
      
      const newCategory: Category = {
        id: categoryId,
        ...data,
        tenantId, // Ensure the category is associated with the tenant
        createdAt: timestamp,
        updatedAt: timestamp
      } as Category;
      
      // Save the new category
      await kv.set(`category:id:${categoryId}`, newCategory);
      
      // Also save with tenant-specific key for faster tenant-based lookups
      if (newCategory.siteId) {
        await kv.set(`category:tenant:${tenantId}:site:${newCategory.siteId}:${newCategory.slug}`, newCategory);
      }
      
      return newCategory;
    } catch (error) {
      console.error(`Error creating category for tenant ${tenantId}:`, error);
      return null;
    }
  }
}
