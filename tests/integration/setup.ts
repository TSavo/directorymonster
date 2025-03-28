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
  
  return {
    sites,
    categories,
    listings
  };
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
  const sites: SiteConfig[] = [
    {
      id: 'test-site-1',
      name: 'Test Fishing Site',
      slug: 'test-fishing',
      domain: 'test-fishing.localhost',
      primaryKeyword: 'fishing gear',
      metaDescription: 'Test fishing gear directory for integration testing',
      headerText: 'Fishing Gear Directory',
      defaultLinkAttributes: 'dofollow',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'test-site-2',
      name: 'Test Hiking Site',
      slug: 'test-hiking',
      domain: 'test-hiking.localhost',
      primaryKeyword: 'hiking gear',
      metaDescription: 'Test hiking gear directory for integration testing',
      headerText: 'Hiking Gear Directory',
      defaultLinkAttributes: 'dofollow',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ];
  
  // Store sites in Redis
  const multi = redis.multi();
  
  sites.forEach(site => {
    // Store by ID
    multi.set(`test:site:id:${site.id}`, JSON.stringify(site));
    
    // Store by slug
    multi.set(`test:site:slug:${site.slug}`, JSON.stringify(site));
    
    // Store by domain
    if (site.domain) {
      multi.set(`test:site:domain:${site.domain}`, JSON.stringify(site));
    }
  });
  
  await multi.exec();
  
  return sites;
}

/**
 * Creates test categories for each test site
 */
export async function createTestCategories(sites: SiteConfig[]): Promise<Category[]> {
  const categories: Category[] = [];
  
  // Create categories for each site
  for (const site of sites) {
    const siteCategories: Category[] = [
      {
        id: `test-category-${site.id}-1`,
        siteId: site.id,
        name: 'Category 1',
        slug: 'category-1',
        metaDescription: 'Test category 1',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: `test-category-${site.id}-2`,
        siteId: site.id,
        name: 'Category 2',
        slug: 'category-2',
        metaDescription: 'Test category 2',
        order: 2,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: `test-category-${site.id}-3`,
        siteId: site.id,
        name: 'Category 3',
        slug: 'category-3',
        metaDescription: 'Test category 3',
        parentId: `test-category-${site.id}-1`, // Make this a subcategory
        order: 3,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
    ];
    
    categories.push(...siteCategories);
  }
  
  // Store categories in Redis
  const multi = redis.multi();
  
  categories.forEach(category => {
    // Store by ID
    multi.set(`test:category:id:${category.id}`, JSON.stringify(category));
    
    // Store by site and slug
    multi.set(`test:category:site:${category.siteId}:${category.slug}`, JSON.stringify(category));
  });
  
  await multi.exec();
  
  return categories;
}

/**
 * Creates test listings for each category
 */
export async function createTestListings(sites: SiteConfig[], categories: Category[]): Promise<Listing[]> {
  const listings: Listing[] = [];
  
  // Create listings for each category
  for (const category of categories) {
    // Create 2 listings per category
    for (let i = 1; i <= 2; i++) {
      const listing: Listing = {
        id: `test-listing-${category.id}-${i}`,
        siteId: category.siteId,
        categoryId: category.id,
        title: `Test Listing ${i} in ${category.name}`,
        slug: `test-listing-${i}-${category.slug}`,
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
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      listings.push(listing);
    }
  }
  
  // Store listings in Redis
  const multi = redis.multi();
  
  listings.forEach(listing => {
    // Store by ID
    multi.set(`test:listing:id:${listing.id}`, JSON.stringify(listing));
    
    // Store by site and slug
    multi.set(`test:listing:site:${listing.siteId}:${listing.slug}`, JSON.stringify(listing));
    
    // Store by category and slug
    multi.set(`test:listing:category:${listing.categoryId}:${listing.slug}`, JSON.stringify(listing));
  });
  
  await multi.exec();
  
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
