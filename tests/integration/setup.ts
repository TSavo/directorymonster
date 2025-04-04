/**
 * Integration Test Setup Utilities
 *
 * This file provides common utilities and setup procedures for integration tests.
 * It includes functions for setting up test environments, mocking multi-tenancy,
 * and managing test data across integration test suites.
 */

import { NextRequest, NextResponse } from 'next/server';
import { kv, redis } from '../../src/lib/redis-client';
import { SiteConfig, Category, Listing } from '../../src/types';

/**
 * Creates a standard test environment with predefined test sites
 */
export async function setupTestEnvironment() {
  // Clear any existing test data
  await clearTestData();

  // Create test sites
  const sites = await createTestSites();

  // Create test categories for each site
  const categories = await createTestCategories(sites);

  // Create test listings for each category
  const listings = await createTestListings(sites, categories);

  // Verify data was properly stored in Redis
  await verifyTestData(sites, categories, listings);

  return {
    sites,
    categories,
    listings
  };
}

/**
 * Verifies that test data was properly stored in Redis
 */
async function verifyTestData(sites: SiteConfig[], categories: Category[], listings: Listing[]) {
  console.log('Verifying test data in Redis...');

  // Verify sites
  for (const site of sites) {
    const storedSiteById = await kv.get(`test:site:${site.id}`);
    const storedSiteBySlug = await kv.get(`site:slug:${site.slug}`);
    const storedSiteByDomain = site.domain ? await kv.get(`site:domain:${site.domain}`) : null;

    if (!storedSiteById) {
      console.error(`Site with ID ${site.id} not found in Redis`);
      // Re-store the site
      await kv.set(`test:site:${site.id}`, JSON.stringify(site));
    }

    if (!storedSiteBySlug) {
      console.error(`Site with slug ${site.slug} not found in Redis`);
      // Re-store the site
      await kv.set(`site:slug:${site.slug}`, JSON.stringify(site));
      await kv.set(`test:site:slug:${site.slug}`, JSON.stringify(site));
    }

    if (site.domain && !storedSiteByDomain) {
      console.error(`Site with domain ${site.domain} not found in Redis`);
      // Re-store the site
      await kv.set(`site:domain:${site.domain}`, JSON.stringify(site));
      await kv.set(`test:site:domain:${site.domain}`, JSON.stringify(site));
    }
  }

  // Verify categories
  for (const category of categories) {
    const storedCategoryById = await kv.get(`test:category:id:${category.id}`);
    const storedCategoryBySiteAndSlug = await kv.get(`test:category:site:${category.siteId}:${category.slug}`);

    if (!storedCategoryById) {
      console.error(`Category with ID ${category.id} not found in Redis`);
      // Re-store the category
      await kv.set(`test:category:id:${category.id}`, JSON.stringify(category));
    }

    if (!storedCategoryBySiteAndSlug) {
      console.error(`Category with site ID ${category.siteId} and slug ${category.slug} not found in Redis`);
      // Re-store the category
      await kv.set(`test:category:site:${category.siteId}:${category.slug}`, JSON.stringify(category));
    }
  }

  // Verify listings
  for (const listing of listings) {
    const storedListingById = await kv.get(`test:listing:id:${listing.id}`);
    const storedListingBySiteAndSlug = await kv.get(`test:listing:site:${listing.siteId}:${listing.slug}`);
    const storedListingByCategoryAndSlug = await kv.get(`test:listing:category:${listing.categoryId}:${listing.slug}`);

    if (!storedListingById) {
      console.error(`Listing with ID ${listing.id} not found in Redis`);
      // Re-store the listing
      await kv.set(`test:listing:id:${listing.id}`, JSON.stringify(listing));
    }

    if (!storedListingBySiteAndSlug) {
      console.error(`Listing with site ID ${listing.siteId} and slug ${listing.slug} not found in Redis`);
      // Re-store the listing
      await kv.set(`test:listing:site:${listing.siteId}:${listing.slug}`, JSON.stringify(listing));
    }

    if (!storedListingByCategoryAndSlug) {
      console.error(`Listing with category ID ${listing.categoryId} and slug ${listing.slug} not found in Redis`);
      // Re-store the listing
      await kv.set(`test:listing:category:${listing.categoryId}:${listing.slug}`, JSON.stringify(listing));
    }
  }

  // Verify Redis has the expected number of keys
  const allKeys = await kv.keys('test:*');
  console.log(`Redis has ${allKeys.length} test keys`);

  // Expected number of keys:
  // - Sites: 2 keys per site (id, slug) + 1 key per domain
  // - Categories: 2 keys per category (id, site+slug)
  // - Listings: 3 keys per listing (id, site+slug, category+slug)
  const expectedKeyCount =
    sites.length * 2 + sites.filter(s => s.domain).length +
    categories.length * 2 +
    listings.length * 3;

  console.log(`Expected ${expectedKeyCount} keys, found ${allKeys.length} keys`);

  if (allKeys.length < expectedKeyCount) {
    console.warn('Some keys may be missing from Redis');
  }
}

/**
 * Clears all test data from Redis
 */
export async function clearTestData() {
  // Find all test keys
  const testKeys = await kv.keys('test:*');

  // Delete all test keys
  if (testKeys.length > 0) {
    const multi = redis.multi();
    testKeys.forEach(key => {
      multi.del(key);
    });
    await multi.exec();
  }
}

/**
 * Creates test sites for integration testing
 */
export async function createTestSites(): Promise<SiteConfig[]> {
  const timestamp = Date.now();
  const sites: SiteConfig[] = [
    {
      id: 'site1',
      name: 'Test Fishing Site',
      slug: 'test-fishing',  // This matches the slug used in site-identity tests
      domain: 'test-fishing.localhost',
      primaryKeyword: 'fishing gear',
      metaDescription: 'Test fishing site for integration testing',
      headerText: 'Test Fishing Site',
      defaultLinkAttributes: 'dofollow',
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      id: 'site2',
      name: 'Test Hiking Site',
      slug: 'test-hiking',  // This matches the slug used in site-identity tests
      domain: 'test-hiking.localhost',
      primaryKeyword: 'hiking gear',
      metaDescription: 'Test hiking site for integration testing',
      headerText: 'Test Hiking Site',
      defaultLinkAttributes: 'dofollow',
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  ];

  console.log(`Creating ${sites.length} test sites...`);

  // Store sites in Redis
  const multi = redis.multi();

  console.log('Storing sites with the following data:');
  sites.forEach(site => {
    console.log(`Site: ${site.name}, slug: ${site.slug}, domain: ${site.domain}`);

    // Store by ID
    multi.set(`test:site:${site.id}`, JSON.stringify(site));

    // Store by slug - this is used by getSiteByHostname
    multi.set(`site:slug:${site.slug}`, JSON.stringify(site));
    console.log(`Setting key: site:slug:${site.slug}`);

    // Store by domain - this is used by getSiteByHostname
    if (site.domain) {
      multi.set(`site:domain:${site.domain}`, JSON.stringify(site));
      console.log(`Setting key: site:domain:${site.domain}`);
    }

    // Also store with test prefix for cleanup
    multi.set(`test:site:slug:${site.slug}`, JSON.stringify(site));
    if (site.domain) {
      multi.set(`test:site:domain:${site.domain}`, JSON.stringify(site));
    }

    // Add to global sites index
    multi.sadd('test:sites', site.id);
  });

  const results = await multi.exec();

  // Check for errors in the transaction
  const errors = results.filter(([err]) => err !== null);
  if (errors.length > 0) {
    console.error('Error storing test sites:', errors);
  } else {
    console.log(`Successfully stored ${sites.length} test sites in Redis`);
  }

  return sites;
}

/**
 * Creates test categories for each test site
 */
export async function createTestCategories(sites: SiteConfig[]): Promise<Category[]> {
  const timestamp = Date.now();
  const categories: Category[] = [];

  console.log(`Creating test categories for ${sites.length} sites...`);

  // Create categories for each site
  for (const site of sites) {
    // Use site-specific category IDs to avoid collisions
    const siteCategories: Category[] = [
      {
        id: `${site.id}_cat1`,  // Site-specific ID for first category
        siteId: site.id,
        name: 'Category 1',
        slug: 'category-1',
        metaDescription: 'Test category 1',
        order: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: `${site.id}_cat2`,  // Site-specific ID for second category
        siteId: site.id,
        name: 'Category 2',
        slug: 'category-2',
        metaDescription: 'Test category 2',
        order: 2,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: `${site.id}_cat3`,  // Site-specific ID for third category
        siteId: site.id,
        name: 'Category 3',
        slug: 'category-3',
        metaDescription: 'Test category 3',
        parentId: `${site.id}_cat1`, // Make this a subcategory with site-specific parent ID
        order: 3,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    ];

    categories.push(...siteCategories);
  }

  console.log(`Created ${categories.length} test categories in memory`);

  // Store categories in Redis
  const multi = redis.multi();

  categories.forEach(category => {
    // Store by ID
    multi.set(`test:category:id:${category.id}`, JSON.stringify(category));

    // Store by site and slug
    multi.set(`test:category:site:${category.siteId}:${category.slug}`, JSON.stringify(category));

    // Add to site categories index
    multi.sadd(`test:site:${category.siteId}:categories`, category.id);
  });

  const results = await multi.exec();

  // Check for errors in the transaction
  const errors = results.filter(([err]) => err !== null);
  if (errors.length > 0) {
    console.error('Error storing test categories:', errors);
  } else {
    console.log(`Successfully stored ${categories.length} test categories in Redis`);
  }

  return categories;
}

/**
 * Creates test listings for each category
 */
export async function createTestListings(sites: SiteConfig[], categories: Category[]): Promise<Listing[]> {
  const timestamp = Date.now();
  const listings: Listing[] = [];

  console.log(`Creating test listings for ${categories.length} categories...`);

  // Create listings for each category
  for (const category of categories) {
    // Create 2 listings per category
    for (let i = 1; i <= 2; i++) {
      const listing: Listing = {
        id: `listing_${timestamp}_${category.id}_${i}`,
        siteId: category.siteId,
        categoryId: category.id,
        title: `Test Listing ${i} in ${category.name}`,
        slug: `test-listing-${i}`,  // Simple slug for easier testing
        metaDescription: `Test listing ${i} in ${category.name}`,
        content: `This is test listing ${i} in ${category.name} for integration testing.`,
        backlinkUrl: `https://example.com/test/${i}`,
        backlinkAnchorText: `Example Link ${i}`,
        backlinkPosition: 'prominent',
        backlinkType: 'dofollow',
        customFields: {
          field1: `Value ${i}`,
          field2: i,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      listings.push(listing);
    }
  }

  console.log(`Created ${listings.length} test listings in memory`);

  // Store listings in Redis
  const multi = redis.multi();

  listings.forEach(listing => {
    // Store by ID
    multi.set(`test:listing:id:${listing.id}`, JSON.stringify(listing));

    // Store by site and slug
    multi.set(`test:listing:site:${listing.siteId}:${listing.slug}`, JSON.stringify(listing));

    // Store by category and slug
    multi.set(`test:listing:category:${listing.categoryId}:${listing.slug}`, JSON.stringify(listing));

    // Add to site listings index
    multi.sadd(`test:site:${listing.siteId}:listings`, listing.id);

    // Add to category listings index
    multi.sadd(`test:category:${listing.categoryId}:listings`, listing.id);
  });

  const results = await multi.exec();

  // Check for errors in the transaction
  const errors = results.filter(([err]) => err !== null);
  if (errors.length > 0) {
    console.error('Error storing test listings:', errors);
  } else {
    console.log(`Successfully stored ${listings.length} test listings in Redis`);
  }

  return listings;
}

/**
 * Creates a mock request with specific hostname and other options
 */
export function createMockRequest(url: string, options: {
  method?: string;
  hostname?: string;
  headers?: Record<string, string>;
  body?: any;
} = {}) {
  const method = options.method || 'GET';
  const hostname = options.hostname || 'localhost';
  const headers = {
    host: hostname,
    ...(options.headers || {}),
  };

  // Create the request URL
  const requestUrl = new URL(url, `http://${hostname}`);

  // Create request options
  const requestInit: RequestInit = {
    method,
    headers,
  };

  // Add body if provided
  if (options.body) {
    if (typeof options.body === 'object') {
      requestInit.body = JSON.stringify(options.body);
      headers['content-type'] = 'application/json';
    } else {
      requestInit.body = String(options.body);
    }
  }

  return new NextRequest(requestUrl, requestInit);
}

/**
 * Helper function to wait for a specific amount of time
 * Useful for testing async operations
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
