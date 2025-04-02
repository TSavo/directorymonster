/**
 * Race Conditions Test Module
 * 
 * Tests the application's ability to handle race conditions that can occur
 * when multiple operations try to update the same data simultaneously.
 */

import { createMockRequest } from '../../setup';
import { POST as createListing } from '@/app/api/sites/[siteSlug]/listings/route';
import { PUT as updateListing } from '@/app/api/sites/[siteSlug]/listings/[listingSlug]/route';
import { kv, redis } from '@/lib/redis-client';

// Constants for race condition tests
const CONCURRENT_OPERATIONS = 5;

/**
 * Helper function to wait for all promises to settle and return results
 */
async function settlePromises<T>(promises: Promise<T>[]): Promise<{
  fulfilled: T[];
  rejected: any[];
  totalTime: number;
}> {
  const startTime = performance.now();
  const results = await Promise.allSettled(promises);
  const endTime = performance.now();
  
  const fulfilled = results
    .filter((result): result is PromiseFulfilledResult<T> => result.status === 'fulfilled')
    .map(result => result.value);
    
  const rejected = results
    .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
    .map(result => result.reason);
    
  return {
    fulfilled,
    rejected,
    totalTime: endTime - startTime
  };
}

/**
 * Helper function to simulate a short delay
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Race Conditions', () => {
  // Access test data from global setup
  const { sites, categories } = global.__TEST_DATA__;
  
  it('should handle concurrent updates to the same listing', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Get the first category
    const category = categories.find(c => c.siteId === site.id);
    
    if (!category) {
      throw new Error('Test setup failed: No category found for the test site');
    }
    
    // Create a new listing to be updated concurrently
    const uniqueId = `race-condition-${Date.now()}`;
    const listingSlug = `race-condition-test-${uniqueId}`;
    
    const createRequest = createMockRequest(`/api/sites/${site.slug}/listings`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        title: `Race Condition Test Listing ${uniqueId}`,
        slug: listingSlug,
        categoryId: category.id,
        metaDescription: `Race condition test listing ${uniqueId}.`,
        content: `Initial content for race condition testing.`,
        backlinkUrl: `https://example.com/race-test/${uniqueId}`,
        backlinkAnchorText: `Example Race Test Link`,
        backlinkPosition: 'prominent',
        backlinkType: 'dofollow',
      }),
    });
    
    // Create the listing
    const createResponse = await createListing(createRequest, { params: { siteSlug: site.slug } });
    expect(createResponse.status).toBe(201);
    
    // Get the created listing
    const createdListing = await createResponse.json();
    
    // Create multiple concurrent update requests with different content
    const updateRequests = Array(CONCURRENT_OPERATIONS).fill(null).map((_, i) => {
      const updateRequest = createMockRequest(`/api/sites/${site.slug}/listings/${listingSlug}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: createdListing.title,
          metaDescription: createdListing.metaDescription,
          categoryId: createdListing.categoryId,
          content: `Updated content for race condition testing - Update ${i + 1}.`,
          backlinkUrl: createdListing.backlinkUrl,
          backlinkAnchorText: createdListing.backlinkAnchorText,
          backlinkPosition: createdListing.backlinkPosition,
          backlinkType: createdListing.backlinkType,
        }),
      });
      
      // Add a slight delay to ensure different timing for each request
      return delay(i * 10).then(() => 
        updateListing(updateRequest, { 
          params: { 
            siteSlug: site.slug,
            listingSlug: listingSlug
          } 
        })
      );
    });
    
    // Execute all update requests concurrently
    const { fulfilled, rejected } = await settlePromises(updateRequests);
    
    // All requests should be fulfilled (no exceptions)
    expect(rejected.length).toBe(0);
    
    // All responses should have 200 status (OK)
    fulfilled.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    // Get the final state of the listing
    const finalListing = await kv.get(`test:listing:site:${site.id}:${listingSlug}`);
    
    // Verify that the listing exists
    expect(finalListing).toBeTruthy();
    
    // The final content should be one of the updates (we don't know which one will win,
    // but it should match one of our updates)
    const possibleContents = Array(CONCURRENT_OPERATIONS).fill(null).map((_, i) =>
      `Updated content for race condition testing - Update ${i + 1}.`
    );
    
    expect(possibleContents).toContain(finalListing.content);
    
    // The listing ID and other metadata should remain unchanged
    expect(finalListing.id).toBe(createdListing.id);
    expect(finalListing.slug).toBe(listingSlug);
    expect(finalListing.categoryId).toBe(category.id);
  });
  
  it('should use transactions to maintain data consistency during race conditions', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Mock Redis to verify transaction usage
    const redisExecOriginal = redis.exec;
    const redisMultiOriginal = redis.multi;
    
    // Keep track of transactions
    let transactionCount = 0;
    
    // Mock multi and exec to track transaction usage
    redis.multi = jest.fn().mockImplementation(() => {
      const multi = redisMultiOriginal.call(redis);
      multi.exec = jest.fn().mockImplementation(() => {
        transactionCount++;
        return redisExecOriginal.call(multi);
      });
      return multi;
    });
    
    try {
      // Create a unique category for this test
      const uniqueId = `race-transaction-${Date.now()}`;
      const categoryName = `Race Transaction Test Category ${uniqueId}`;
      const categorySlug = `race-transaction-category-${uniqueId}`;
      
      // Create multiple concurrent listing creation requests that will use transactions
      const createRequests = Array(CONCURRENT_OPERATIONS).fill(null).map((_, i) => {
        const listingSlug = `race-transaction-listing-${uniqueId}-${i}`;
        
        const createRequest = createMockRequest(`/api/sites/${site.slug}/listings`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            title: `Race Transaction Test Listing ${uniqueId} ${i}`,
            slug: listingSlug,
            // Use a non-existent category ID to force a new category creation path
            // This simulates a race condition with complex data dependencies
            categoryId: `non-existent-${uniqueId}`,
            categoryName: categoryName,
            categorySlug: categorySlug,
            createCategory: true, // Flag to create the category if it doesn't exist
            metaDescription: `Race transaction test listing ${uniqueId} ${i}.`,
            content: `Content for race transaction testing ${i}.`,
            backlinkUrl: `https://example.com/race-transaction-test/${uniqueId}/${i}`,
            backlinkAnchorText: `Example Race Transaction Test Link ${i}`,
            backlinkPosition: 'prominent',
            backlinkType: 'dofollow',
          }),
        });
        
        // Add a slight delay to ensure different timing for each request
        return delay(i * 10).then(() => 
          createListing(createRequest, { params: { siteSlug: site.slug } })
        );
      });
      
      // Execute all create requests concurrently
      const { fulfilled } = await settlePromises(createRequests);
      
      // Verify that transactions were used
      expect(transactionCount).toBeGreaterThan(0);
      
      // All should be successful
      fulfilled.forEach(response => {
        expect([200, 201]).toContain(response.status);
      });
      
      // Get all created listings
      const createdListingResponses = await Promise.all(
        fulfilled.map(async response => await response.json())
      );
      
      // All listings should reference the same category
      const categoryIds = new Set(createdListingResponses.map(l => l.categoryId));
      
      // Only one category should have been created (or reused)
      expect(categoryIds.size).toBe(1);
      
      // Verify that the category exists
      const categoryId = Array.from(categoryIds)[0];
      const category = await kv.get(`test:category:id:${categoryId}`);
      
      expect(category).toBeTruthy();
      expect(category.name).toBe(categoryName);
      expect(category.slug).toBe(categorySlug);
      
      // Verify that all listings exist and are correctly associated
      for (const listing of createdListingResponses) {
        const storedListing = await kv.get(`test:listing:id:${listing.id}`);
        expect(storedListing).toBeTruthy();
        expect(storedListing.categoryId).toBe(categoryId);
      }
    } finally {
      // Restore original Redis methods
      redis.multi = redisMultiOriginal;
    }
  });
});
