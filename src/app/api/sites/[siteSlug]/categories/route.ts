import { NextRequest, NextResponse } from 'next/server';
import { redis, kv } from '@/lib/redis-client';
import { SiteConfig, Category } from '@/types';
import { withRedis } from '@/middleware/withRedis';

export const GET = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string } }) => {
  const siteSlug = params.siteSlug;
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    // Get all categories for this site
    const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
    const categoriesPromises = categoryKeys.map(async (key) => await kv.get<Category>(key));
    
    // Handle each promise individually to prevent one failure from breaking everything
    const categories: Category[] = [];
    for (let i = 0; i < categoriesPromises.length; i++) {
      try {
        const category = await categoriesPromises[i];
        if (category) {
          categories.push(category);
        }
      } catch (error) {
        console.error(`Error fetching category at index ${i}:`, error);
        // Continue with other categories
      }
    }
    
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
});

export const POST = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string } }) => {
  const siteSlug = params.siteSlug;
  
  console.log(`Looking for site with slug: ${siteSlug}`);
  
  // Debugging - list all site keys
  const siteKeys = await kv.keys('site:*');
  console.log('Available site keys:', siteKeys);
  
  // Get site by slug
  const site = await kv.get<SiteConfig>(`site:slug:${siteSlug}`);
  console.log('Found site:', site);
  
  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }
  
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.name || !data.metaDescription) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Generate a slug from the name
    const slug = data.slug || data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    // Check if slug already exists
    const existingCategory = await kv.get(`category:site:${site.id}:${slug}`);
    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name or slug already exists' },
        { status: 409 }
      );
    }
    
    // Get the current highest order value
    const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
    const categories = await Promise.all(
      categoryKeys.map(async (key) => await kv.get<Category>(key))
    );
    
    const highestOrder = categories.reduce((max, cat) => Math.max(max, cat?.order || 0), 0);
    
    // Create new category
    const timestamp = Date.now();
    const category: Category = {
      id: `category_${timestamp}`,
      siteId: site.id,
      name: data.name,
      slug,
      metaDescription: data.metaDescription,
      parentId: data.parentId,
      order: highestOrder + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    
    // Use a Redis transaction for atomicity
    const multi = redis.multi();
    
    multi.set(`category:id:${category.id}`, JSON.stringify(category));
    multi.set(`category:site:${site.id}:${category.slug}`, JSON.stringify(category));
    
    try {
      // Execute all commands as a transaction
      const results = await multi.exec();
      
      // Check for errors in the transaction
      const errors = results.filter(([err]) => err !== null);
      if (errors.length > 0) {
        console.error('Transaction errors:', errors);
        return NextResponse.json(
          { error: 'Failed to save category data' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(category, { status: 201 });
    } catch (error) {
      console.error('Error executing Redis transaction:', error);
      return NextResponse.json(
        { error: 'Failed to save category data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});