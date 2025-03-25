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
  
  // Get all categories for this site
  const categoryKeys = await kv.keys(`category:site:${site.id}:*`);
  const categories = await Promise.all(
    categoryKeys.map(async (key) => await kv.get<Category>(key))
  );
  
  return NextResponse.json(categories);
});

export const POST = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string } }) => {
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
    
    // Execute all commands as a transaction
    await multi.exec();
    
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});