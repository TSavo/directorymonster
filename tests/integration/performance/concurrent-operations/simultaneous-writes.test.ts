/**
 * Simultaneous Writes Test Module
 * 
 * Tests the application's ability to handle multiple simultaneous write operations
 * while maintaining data integrity and preventing conflicts.
 */

import { createMockRequest } from '../../setup';
import { POST as createListing } from '@/app/api/sites/[siteSlug]/listings/route';
import { POST as createCategory } from '@/app/api/sites/[siteSlug]/categories/route';
import { kv } from '@/lib/redis-client';

// Constants for simultaneous write tests
const PARALLEL_WRITES = 5;

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

describe('Simultaneous Writes', () => {
  // Access test data from global setup
  const { sites, categories } = global.__TEST_DATA__;
  
  it.skip('should be implemented', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Get the first category
    const category = categories.find(c => c.siteId === site.id);
    
    if (!category) {
      throw new Error('Test setup failed: No category found for the test site');
    }
    
    // Create multiple listing creation requests with unique slugs
    const requests = Array(PARALLEL_WRITES).fill(null).map((_, i) => {
      const uniqueId = `concurrent-${Date.now()}-${i}`;
      
      const request = createMockRequest(`/api/sites/${site.slug}/listings`, {
        method: 'POST',
        headers: {
          'x-forwarded-for': `192.168.4.${i + 1}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: `Concurrent Test Listing ${uniqueId}`,
          slug: `concurrent-test-listing-${uniqueId}`,
          categoryId: category.id,
          metaDescription: `Concurrent test listing ${uniqueId} for simultaneous writes testing.`,
          content: `This is concurrent test listing ${uniqueId} for simultaneous writes testing.`,
          backlinkUrl: `https://example.com/concurrent-test/${uniqueId}`,
          backlinkAnchorText: `Example Concurrent Test Link ${uniqueId}`,
          backlinkPosition: 'prominent',
          backlinkType: 'dofollow',
          customFields: {
            field1: `Concurrent Value ${uniqueId}`,
            field2: i,
          },
        }),
      });
      
      return createListing(request, { params: { siteSlug: site.slug } });
    });
    
    // Execute all requests in parallel
    const { fulfilled, rejected, totalTime } = await settlePromises(requests);
    
    // All requests should succeed
    expect(rejected.length).toBe(0);
    expect(fulfilled.length).toBe(PARALLEL_WRITES);
    
    // All responses should have 201 status (Created)
    fulfilled.forEach(response => {
      expect(response.status).toBe(201);
    });
    
    // Parse all responses to get listing IDs
    const parsedResults = await Promise.all(
      fulfilled.map(async response => await response.json())
    );
    
    const listingIds = parsedResults.map(result => result.id);
    
    // All listings should be created successfully and have unique IDs
    const uniqueIds = new Set(listingIds);
    expect(uniqueIds.size).toBe(PARALLEL_WRITES);
    
    // All listings should be retrievable from the database
    for (const id of listingIds) {
      const listing = await kv.get(`test:listing:id:${id}`);
      expect(listing).toBeTruthy();
    }
    
    // Log performance
    console.log(`Total time for ${PARALLEL_WRITES} parallel listing creations: ${totalTime.toFixed(2)}ms`);
    console.log(`Average time per listing creation: ${(totalTime / PARALLEL_WRITES).toFixed(2)}ms`);
  });
  
  it.skip('should be implemented', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Get the first category
    const category = categories.find(c => c.siteId === site.id);
    
    if (!category) {
      throw new Error('Test setup failed: No category found for the test site');
    }
    
    // Create a shared slug that will cause conflicts
    const sharedSlug = `duplicate-slug-${Date.now()}`;
    
    // Create multiple listing creation requests with the same slug
    const requests = Array(PARALLEL_WRITES).fill(null).map((_, i) => {
      const request = createMockRequest(`/api/sites/${site.slug}/listings`, {
        method: 'POST',
        headers: {
          'x-forwarded-for': `192.168.5.${i + 1}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          title: `Duplicate Slug Test Listing ${i}`,
          slug: sharedSlug, // Same slug for all requests
          categoryId: category.id,
          metaDescription: `Duplicate slug test listing ${i} for concurrent writes.`,
          content: `This is duplicate slug test listing ${i} for concurrent writes testing.`,
          backlinkUrl: `https://example.com/duplicate-test/${i}`,
          backlinkAnchorText: `Example Duplicate Test Link ${i}`,
          backlinkPosition: 'prominent',
          backlinkType: 'dofollow',
          customFields: {
            field1: `Duplicate Value ${i}`,
            field2: i,
          },
        }),
      });
      
      return createListing(request, { params: { siteSlug: site.slug } });
    });
    
    // Execute all requests in parallel
    const { fulfilled, rejected } = await settlePromises(requests);
    
    // Some requests should succeed and some should fail
    // Exactly one should succeed with 201, and the rest should fail with 409 (Conflict)
    const successful = fulfilled.filter(response => response.status === 201);
    const conflicted = fulfilled.filter(response => response.status === 409);
    
    // Verify that exactly one request succeeded
    expect(successful.length).toBe(1);
    
    // Verify that the rest resulted in conflicts
    expect(conflicted.length).toBe(PARALLEL_WRITES - 1);
    
    // Check that conflict responses have appropriate error messages
    for (const response of conflicted) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('already exists');
    }
    
    // Get the successful listing
    const successData = await successful[0].json();
    
    // Verify that it exists in the database
    const listing = await kv.get(`test:listing:site:${site.id}:${sharedSlug}`);
    expect(listing).toBeTruthy();
    expect(listing).toHaveProperty('id', successData.id);
  });
});
