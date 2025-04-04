import { NextRequest, NextResponse } from 'next/server';
import { redis, kv } from '@/lib/redis-client';
import { SiteConfig, Category } from '@/types';
import { withRedis } from '@/middleware/withRedis';

/**
 * GET handler for retrieving a single category by slug
 */
export const GET = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string, categorySlug: string } }) => {
  const { siteSlug, categorySlug } = params;
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    // Get category by slug
    const category = await kv.get<Category>(`category:site:${site.id}:${categorySlug}`);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Ensure the category belongs to the site
    if (category.siteId !== site.id) {
      return NextResponse.json(
        { error: 'Category not found in this site' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    );
  }
});

/**
 * PUT handler for updating a category
 */
export const PUT = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string, categorySlug: string } }) => {
  const { siteSlug, categorySlug } = params;
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    // Get existing category
    const existingCategory = await kv.get<Category>(`category:site:${site.id}:${categorySlug}`);
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Ensure the category belongs to the site
    if (existingCategory.siteId !== site.id) {
      return NextResponse.json(
        { error: 'Category not found in this site' },
        { status: 404 }
      );
    }
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.metaDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate a new slug if name has changed
    let slug = existingCategory.slug;
    if (data.name !== existingCategory.name && !data.slug) {
      slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    } else if (data.slug) {
      slug = data.slug;
    }
    
    // Check if new slug conflicts with another category
    if (slug !== existingCategory.slug) {
      const existingCategoryWithSlug = await kv.get(`category:site:${site.id}:${slug}`);
      if (existingCategoryWithSlug) {
        return NextResponse.json(
          { error: 'A category with this name or slug already exists' },
          { status: 409 }
        );
      }
    }
    
    // Check if parentId creates a circular reference
    if (data.parentId && data.parentId !== existingCategory.parentId) {
      // Check if parent category exists
      const parentCategory = await kv.get<Category>(`category:id:${data.parentId}`);
      if (!parentCategory) {
        return NextResponse.json(
          { error: 'Parent category not found' },
          { status: 404 }
        );
      }
      
      // Check if parent belongs to same site
      if (parentCategory.siteId !== site.id) {
        return NextResponse.json(
          { error: 'Parent category not found in this site' },
          { status: 400 }
        );
      }
      
      // Check for circular reference
      if (data.parentId === existingCategory.id) {
        return NextResponse.json(
          { error: 'A category cannot be its own parent' },
          { status: 400 }
        );
      }
      
      // Check if this would create a circular reference in the hierarchy
      let currentParent = parentCategory;
      while (currentParent.parentId) {
        if (currentParent.parentId === existingCategory.id) {
          return NextResponse.json(
            { error: 'This would create a circular reference in the category hierarchy' },
            { status: 400 }
          );
        }
        
        currentParent = await kv.get<Category>(`category:id:${currentParent.parentId}`);
        if (!currentParent) break;
      }
    }
    
    // Update category
    const updatedCategory: Category = {
      ...existingCategory,
      name: data.name,
      slug,
      metaDescription: data.metaDescription,
      parentId: data.parentId,
      order: data.order !== undefined ? data.order : existingCategory.order,
      updatedAt: Date.now()
    };
    
    // Use a Redis transaction for atomicity
    const multi = redis.multi();
    
    // Update the category
    multi.set(`category:id:${existingCategory.id}`, JSON.stringify(updatedCategory));
    
    // Handle slug change
    if (slug !== existingCategory.slug) {
      // Delete old slug reference
      multi.del(`category:site:${site.id}:${existingCategory.slug}`);
      // Create new slug reference
      multi.set(`category:site:${site.id}:${slug}`, JSON.stringify(updatedCategory));
    } else {
      // Update existing slug reference
      multi.set(`category:site:${site.id}:${slug}`, JSON.stringify(updatedCategory));
    }
    
    try {
      // Execute all commands as a transaction
      const results = await multi.exec();
      
      // Check for errors in the transaction
      const errors = results.filter(([err]) => err !== null);
      if (errors.length > 0) {
        console.error('Transaction errors:', errors);
        return NextResponse.json(
          { error: 'Failed to update category data' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(updatedCategory);
    } catch (error) {
      console.error('Error executing Redis transaction:', error);
      return NextResponse.json(
        { error: 'Failed to update category data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

/**
 * DELETE handler for removing a category
 */
export const DELETE = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string, categorySlug: string } }) => {
  const { siteSlug, categorySlug } = params;
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    // Get category by slug
    const category = await kv.get<Category>(`category:site:${site.id}:${categorySlug}`);
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }
    
    // Ensure the category belongs to the site
    if (category.siteId !== site.id) {
      return NextResponse.json(
        { error: 'Category not found in this site' },
        { status: 404 }
      );
    }
    
    // Check if this category has child categories
    const allCategories = await kv.keys(`category:site:${site.id}:*`);
    const categoriesData = await Promise.all(
      allCategories.map(async (key) => await kv.get<Category>(key))
    );
    
    const childCategories = categoriesData.filter(cat => cat?.parentId === category.id);
    
    if (childCategories.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete a category with child categories',
          childCategories: childCategories.map(cat => ({ id: cat.id, name: cat.name }))
        },
        { status: 400 }
      );
    }
    
    // Check if category has any listings
    const listingKeys = await kv.keys(`listing:category:${category.id}:*`);
    
    if (listingKeys.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete a category with associated listings',
          listingCount: listingKeys.length
        },
        { status: 400 }
      );
    }
    
    // Use a Redis transaction for atomicity
    const multi = redis.multi();
    
    // Delete category references
    multi.del(`category:id:${category.id}`);
    multi.del(`category:site:${site.id}:${category.slug}`);
    
    try {
      // Execute all commands as a transaction
      const results = await multi.exec();
      
      // Check for errors in the transaction
      const errors = results.filter(([err]) => err !== null);
      if (errors.length > 0) {
        console.error('Transaction errors:', errors);
        return NextResponse.json(
          { error: 'Failed to delete category' },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error executing Redis transaction:', error);
      return NextResponse.json(
        { error: 'Failed to delete category' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
