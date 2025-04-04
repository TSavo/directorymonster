/**
 * Integration Test Setup Utilities with Mock Redis
 *
 * This file provides common utilities and setup procedures for integration tests
 * using a mock Redis client that properly implements the exec method.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SiteConfig, Category, Listing } from '../../src/types';
import { RedisMock } from '../mocks/redis-client-mock';

// Create a mock Redis client
const mockRedis = new RedisMock();
const mockKv = mockRedis;

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

  return { sites, categories, listings };
}

/**
 * Clears all test data from Redis
 */
export async function clearTestData() {
  // Find all test keys
  const testKeys = await mockRedis.keys('test:*');
  
  // Delete all test keys
  if (testKeys.length > 0) {
    await mockRedis.del(...testKeys);
    console.log(`Cleared ${testKeys.length} test keys from Redis`);
  }
}

/**
 * Creates test sites for integration testing
 */
export async function createTestSites(): Promise<SiteConfig[]> {
  console.log('Creating 2 test sites...');
  
  // Define test sites
  const sites: SiteConfig[] = [
    {
      id: 'site1',
      name: 'Test Site 1',
      slug: 'test-site-1',
      domain: 'test-site-1.localhost',
      primaryKeyword: 'test site',
      metaDescription: 'Test site 1 for integration testing',
      headerText: 'Test Site 1',
      defaultLinkAttributes: 'dofollow',
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    {
      id: 'site2',
      name: 'Test Site 2',
      slug: 'test-site-2',
      domain: 'test-site-2.localhost',
      primaryKeyword: 'test site 2',
      metaDescription: 'Test site 2 for integration testing',
      headerText: 'Test Site 2',
      defaultLinkAttributes: 'dofollow',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  ];
  
  // Store sites in Redis
  const multi = mockRedis.multi();
  
  sites.forEach(site => {
    // Store site by ID
    multi.set(`test:site:${site.id}`, JSON.stringify(site));
    
    // Store site by slug for lookups
    multi.set(`test:site:slug:${site.slug}`, JSON.stringify(site));
    
    // Store site domain mapping
    multi.set(`test:site:domain:${site.domain}`, site.id);
    
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
  console.log(`Creating test categories for ${sites.length} sites...`);
  
  const categories: Category[] = [];
  
  // Create 3 categories per site
  sites.forEach(site => {
    for (let i = 1; i <= 3; i++) {
      categories.push({
        id: `${site.id}_cat${i}`,
        siteId: site.id,
        name: `Category ${i}`,
        slug: `category-${i}`,
        description: `Test category ${i} for ${site.name}`,
        metaDescription: `Meta description for category ${i}`,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  });
  
  console.log(`Created ${categories.length} test categories in memory`);
  
  // Store categories in Redis
  const multi = mockRedis.multi();
  
  categories.forEach(category => {
    // Store category by ID
    multi.set(`test:category:${category.id}`, JSON.stringify(category));
    
    // Store category by slug within site
    multi.set(`test:category:site:${category.siteId}:slug:${category.slug}`, JSON.stringify(category));
    
    // Add to site's categories index
    multi.sadd(`test:site:${category.siteId}:categories`, category.id);
    
    // Add to global categories index
    multi.sadd('test:categories', category.id);
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
  console.log(`Creating test listings for ${categories.length} categories...`);
  
  const listings: Listing[] = [];
  
  // Create 2 listings per category
  categories.forEach(category => {
    for (let i = 1; i <= 2; i++) {
      listings.push({
        id: `listing_${Date.now()}_${category.siteId}_${category.id.split('_')[1]}_${i}`,
        siteId: category.siteId,
        categoryId: category.id,
        title: `Test Listing ${i} in ${category.name}`,
        slug: `test-listing-${i}`,
        metaDescription: `Test listing ${i} in ${category.name}`,
        content: `This is test listing ${i} in ${category.name} for integration testing.`,
        backlinkUrl: `https://example.com/test/${i}`,
        backlinkAnchorText: `Example Link ${i}`,
        backlinkPosition: 'prominent',
        backlinkType: 'dofollow',
        customFields: { field1: `Value ${i}`, field2: i },
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  });
  
  console.log(`Created ${listings.length} test listings in memory`);
  
  // Store listings in Redis
  const multi = mockRedis.multi();
  
  listings.forEach(listing => {
    // Store listing by ID
    multi.set(`test:listing:${listing.id}`, JSON.stringify(listing));
    
    // Store listing by slug within site
    multi.set(`test:listing:site:${listing.siteId}:slug:${listing.slug}`, JSON.stringify(listing));
    
    // Add to site's listings index
    multi.sadd(`test:site:${listing.siteId}:listings`, listing.id);
    
    // Add to category's listings index
    multi.sadd(`test:category:${listing.categoryId}:listings`, listing.id);
    
    // Add to global listings index
    multi.sadd('test:listings', listing.id);
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
 * Verifies that test data was properly stored in Redis
 */
export async function verifyTestData(sites: SiteConfig[], categories: Category[], listings: Listing[]) {
  // Verify sites
  const storedSiteIds = await mockRedis.smembers('test:sites');
  console.log(`Verified ${storedSiteIds.length}/${sites.length} sites in Redis`);
  
  // Verify categories
  const storedCategoryIds = await mockRedis.smembers('test:categories');
  console.log(`Verified ${storedCategoryIds.length}/${categories.length} categories in Redis`);
  
  // Verify listings
  const storedListingIds = await mockRedis.smembers('test:listings');
  console.log(`Verified ${storedListingIds.length}/${listings.length} listings in Redis`);
}

// Export the mock Redis client for use in tests
export const redis = mockRedis;
export const kv = mockKv;
