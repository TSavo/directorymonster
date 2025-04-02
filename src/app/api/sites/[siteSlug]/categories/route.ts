import { NextRequest, NextResponse } from 'next/server';
import { redis, kv } from '@/lib/redis-client';
import { SiteConfig, Category } from '@/types';
import { withRedis } from '@/middleware/withRedis';

export const GET = withRedis(async (request: NextRequest, { params }: { params: { siteSlug: string } }) => {
  const siteSlug = params.siteSlug;
  console.log(`Looking for site with slug: ${siteSlug}`);

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  // Get site by slug
  let site = await kv.get<SiteConfig>(`${keyPrefix}site:slug:${siteSlug}`);
  console.log('Site found (raw):', site);

  // Parse site if it's a string
  if (typeof site === 'string') {
    try {
      site = JSON.parse(site);
      console.log('Parsed site object:', site);
    } catch (e) {
      console.error('Error parsing site JSON:', e);
    }
  }

  if (!site) {
    return NextResponse.json(
      { error: 'Site not found' },
      { status: 404 }
    );
  }

  try {
    // Get all categories for this site
    console.log(`Looking for categories for site ID: ${site.id}`);

    // First try to get categories from the site categories index
    const categoryIds = await kv.smembers(`${keyPrefix}site:${site.id}:categories`);
    console.log(`Found ${categoryIds.length} category IDs in index:`, categoryIds);

    let categories: Category[] = [];

    if (categoryIds.length > 0) {
      // Get categories by ID
      const categoriesPromises = categoryIds.map(async (id) => await kv.get<Category>(`${keyPrefix}category:id:${id}`));

      // Resolve all promises
      const resolvedCategories = await Promise.all(categoriesPromises);
      categories = resolvedCategories.filter(Boolean) as Category[];
    }

    // If no categories found via index, try pattern matching
    if (categories.length === 0) {
      // Fallback: try to get categories by pattern matching
      const categoryKeys = await kv.keys(`${keyPrefix}category:site:${site.id}:*`);
      console.log(`Fallback: Found ${categoryKeys.length} category keys by pattern:`, categoryKeys);

      if (categoryKeys.length > 0) {
        const categoriesPromises = categoryKeys.map(async (key) => await kv.get<Category>(key));
        const resolvedCategories = await Promise.all(categoriesPromises);
        categories = resolvedCategories.filter(Boolean) as Category[];
      }
    }

    // If still no categories, try to get all categories and filter by siteId
    if (categories.length === 0) {
      console.log('No categories found via index or pattern matching, trying to get all categories');
      const allCategoryKeys = await kv.keys(`${keyPrefix}category:id:*`);
      console.log(`Found ${allCategoryKeys.length} total category keys`);

      if (allCategoryKeys.length > 0) {
        const allCategoriesPromises = allCategoryKeys.map(async (key) => await kv.get<Category>(key));
        const allCategories = await Promise.all(allCategoriesPromises);

        // Filter categories by siteId and parse JSON strings if needed
        categories = allCategories
          .filter(Boolean)
          .map(category => {
            // If the category is a string (JSON), parse it
            if (typeof category === 'string') {
              try {
                return JSON.parse(category);
              } catch (e) {
                console.error('Error parsing category JSON:', e);
                return null;
              }
            }
            return category;
          })
          .filter(category => category?.siteId === site.id) as Category[];
      }
    }

    // Parse any categories that are still strings
    const parsedCategories = categories.map(category => {
      if (typeof category === 'string') {
        try {
          return JSON.parse(category);
        } catch (e) {
          console.error('Error parsing category JSON:', e);
          return null;
        }
      }
      return category;
    }).filter(Boolean);

    console.log(`Retrieved ${parsedCategories.length} categories for site ${site.id}:`, parsedCategories);

    return NextResponse.json(parsedCategories);
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

  // Determine if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test';
  const keyPrefix = isTestMode ? 'test:' : '';

  console.log(`Looking for site with slug: ${siteSlug}`);

  // Debugging - list all site keys
  const siteKeys = await kv.keys(`${keyPrefix}site:*`);
  console.log('Available site keys:', siteKeys);

  // Get site by slug
  const site = await kv.get<SiteConfig>(`${keyPrefix}site:slug:${siteSlug}`);
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
    const existingCategory = await kv.get(`${keyPrefix}category:site:${site.id}:${slug}`);
    if (existingCategory) {
      return NextResponse.json(
        { error: 'A category with this name or slug already exists' },
        { status: 409 }
      );
    }

    // Get the current highest order value
    const categoryKeys = await kv.keys(`${keyPrefix}category:site:${site.id}:*`);
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

    multi.set(`${keyPrefix}category:id:${category.id}`, JSON.stringify(category));
    multi.set(`${keyPrefix}category:site:${site.id}:${category.slug}`, JSON.stringify(category));

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