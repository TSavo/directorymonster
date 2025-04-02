/**
 * @jest-environment node
 *
 * Concurrent Operations Integration Tests
 *
 * These tests verify that the application correctly handles concurrent operations
 * including parallel reads, simultaneous writes, and proper transaction isolation.
 */

import { setupTestEnvironment, clearTestData } from '../setup';
import { SiteConfig, Category, Listing } from '../../../src/types';

// Import test modules
import './concurrent-operations/parallel-reads.test';
import './concurrent-operations/simultaneous-writes.test';
import './concurrent-operations/race-conditions.test';
import './concurrent-operations/transaction-isolation.test';

// Global test data that will be used by imported test modules
let sites: SiteConfig[];
let categories: Category[];
let listings: Listing[];

// Setup the test environment once for all concurrent operation tests
beforeAll(async () => {
  const testData = await setupTestEnvironment();
  sites = testData.sites;
  categories = testData.categories;
  listings = testData.listings;

  // Make test data available globally for imported modules
  global.__TEST_DATA__ = {
    sites,
    categories,
    listings
  };

  console.log('Test environment setup complete');
  console.log(`Created ${sites.length} sites, ${categories.length} categories, and ${listings.length} listings`);

  // Log the first site for debugging
  if (sites.length > 0) {
    console.log('First test site:', sites[0]);
  }
});

afterAll(async () => {
  // Clean up test data
  await clearTestData();
});

// This file serves as the entry point for concurrent operation tests
// The actual test implementations are in the imported modules
describe('Concurrent Operations', () => {
  it('should successfully initialize test environment', () => {
    expect(sites).toBeDefined();
    expect(categories).toBeDefined();
    expect(listings).toBeDefined();
    expect(sites.length).toBeGreaterThan(0);
  });
});
