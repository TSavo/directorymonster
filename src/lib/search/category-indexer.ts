/**
 * Category search indexing functionality
 */
import { redis, kv } from '../redis-client';
import { Category } from '@/types';
import { searchKeys } from '../tenant';
import { getIntersection } from './utils';

/**
 * Category indexing functionality
 */
export class CategoryIndexer {
  /**
   * Index a category for search
   */
  async indexCategory(category: Category): Promise<void> {
    try {
      // Create search index for categories if it doesn't exist
      const indexKey = searchKeys.categoryIndex(category.siteId);
      
      // Basic search data includes name, slug, and description
      const searchData = {
        id: category.id,
        name: category.name.toLowerCase(),
        slug: category.slug.toLowerCase(),
        description: category.metaDescription.toLowerCase(),
        parentId: category.parentId || null,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
      };
      
      // Add to search index 
      await redis.hset(indexKey, category.id, JSON.stringify(searchData));
      
      // Index category for full-text search
      await this.indexCategoryTerms(category);
      
      console.log(`Indexed category: ${category.name}`);
    } catch (error) {
      console.error('Error indexing category:', error);
      throw error;
    }
  }
  
  /**
   * Index category terms for full-text search
   */
  private async indexCategoryTerms(category: Category): Promise<void> {
    try {
      // Extract search terms from category fields
      const terms = new Set<string>();
      
      // Add terms from name
      category.name.toLowerCase().split(/\s+/).forEach(term => {
        if (term.length > 2) terms.add(term);
      });
      
      // Add terms from description
      category.metaDescription.toLowerCase().split(/\s+/).forEach(term => {
        if (term.length > 2) terms.add(term);
      });
      
      // Add category ID to term indices
      for (const term of terms) {
        const termKey = searchKeys.categoryTermIndex(category.siteId, term);
        await redis.sadd(termKey, category.id);
      }
      
      // Store all terms for this category to track changes
      const categoryTermsKey = searchKeys.categoryTermsSet(category.siteId, category.id);
      await redis.del(categoryTermsKey);
      if (terms.size > 0) {
        await redis.sadd(categoryTermsKey, ...terms);
      }
    } catch (error) {
      console.error('Error indexing category terms:', error);
      throw error;
    }
  }
  
  /**
   * Update a category in the search index
   */
  async updateCategory(category: Category): Promise<void> {
    try {
      // Remove old terms first
      await this.removeCategoryTerms(category.id, category.siteId);
      
      // Then re-index the category
      await this.indexCategory(category);
    } catch (error) {
      console.error('Error updating category index:', error);
      throw error;
    }
  }
  
  /**
   * Remove a category's terms from the search index
   */
  private async removeCategoryTerms(categoryId: string, siteId: string): Promise<void> {
    try {
      // Get all terms for this category
      const categoryTermsKey = searchKeys.categoryTermsSet(siteId, categoryId);
      const terms = await redis.smembers(categoryTermsKey);
      
      // Remove category ID from each term index
      for (const term of terms) {
        const termKey = searchKeys.categoryTermIndex(siteId, term);
        await redis.srem(termKey, categoryId);
      }
      
      // Remove the terms set
      await redis.del(categoryTermsKey);
    } catch (error) {
      console.error('Error removing category terms:', error);
      throw error;
    }
  }
  
  /**
   * Remove a category from the search index
   */
  async removeCategory(categoryId: string, siteId: string): Promise<void> {
    try {
      // Remove from main search index
      const indexKey = searchKeys.categoryIndex(siteId);
      await redis.hdel(indexKey, categoryId);
      
      // Remove all term references
      await this.removeCategoryTerms(categoryId, siteId);
      
      console.log(`Removed category ${categoryId} from search index`);
    } catch (error) {
      console.error('Error removing category from index:', error);
      throw error;
    }
  }
  
  /**
   * Search for categories
   */
  async searchCategories(siteId: string, query: string): Promise<Category[]> {
    try {
      if (!query) {
        return [];
      }
      
      const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
      
      if (searchTerms.length === 0) {
        return [];
      }
      
      // For each term, get matching category IDs
      const termSets: string[][] = [];
      for (const term of searchTerms) {
        const termKey = searchKeys.categoryTermIndex(siteId, term);
        const matches = await redis.smembers(termKey);
        if (matches.length > 0) {
          termSets.push(matches);
        }
      }
      
      if (termSets.length === 0) {
        return [];
      }
      
      // Find categories that match all terms (intersection)
      const categoryIds = getIntersection(termSets);
      
      if (categoryIds.length === 0) {
        return [];
      }
      
      // Get full category data for matching IDs
      const categories: Category[] = [];
      for (const id of categoryIds) {
        const category = await kv.get<Category>(`category:id:${id}`);
        if (category) {
          categories.push(category);
        }
      }
      
      // Sort by relevance (name match is highest priority)
      const lowerQuery = query.toLowerCase();
      categories.sort((a, b) => {
        const aNameMatch = a.name.toLowerCase().includes(lowerQuery) ? 1 : 0;
        const bNameMatch = b.name.toLowerCase().includes(lowerQuery) ? 1 : 0;
        
        return bNameMatch - aNameMatch;
      });
      
      return categories;
    } catch (error) {
      console.error('Error searching categories:', error);
      return [];
    }
  }
}
