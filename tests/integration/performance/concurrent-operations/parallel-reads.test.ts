/**
 * Parallel Reads Test Module
 *
 * Tests the application's ability to handle multiple simultaneous read operations
 * without performance degradation or data integrity issues.
 */

import { createMockRequest } from '../../setup';
import { GET as getListings } from '../../../../src/app/api/sites/[siteSlug]/listings/route';
import { GET as getSearchResults } from '../../../../src/app/api/search/route';
import { GET as getCategories } from '../../../../src/app/api/sites/[siteSlug]/categories/route';

// Constants for parallel read tests
const PARALLEL_OPERATIONS = 10;
const MAX_ACCEPTABLE_RESPONSE_TIME = 500; // 500ms per request

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

describe('Parallel Reads', () => {
  // Access test data from global setup
  const { sites, categories, listings } = global.__TEST_DATA__;

  // Log test data for debugging
  beforeAll(() => {
    console.log(`Parallel Reads Test: Using ${sites.length} sites, ${categories.length} categories, and ${listings.length} listings`);
    if (sites.length > 0) {
      console.log('First test site:', sites[0]);
    }
  });

  it('should handle parallel listing requests efficiently', async () => {
    // Get the first test site
    const site = sites[0];

    // Create multiple request promises
    const requests = Array(PARALLEL_OPERATIONS).fill(null).map((_, i) => {
      const request = createMockRequest(`/api/sites/${site.slug}/listings?page=${(i % 3) + 1}&limit=10`, {
        headers: {
          'x-forwarded-for': `192.168.1.${i + 1}`,
        },
      });

      return getListings(request, { params: { siteSlug: site.slug } });
    });

    // Execute all requests in parallel
    const { fulfilled, rejected, totalTime } = await settlePromises(requests);

    // All requests should succeed
    expect(rejected.length).toBe(0);
    expect(fulfilled.length).toBe(PARALLEL_OPERATIONS);

    // All responses should have 200 status
    fulfilled.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Average time should be efficient
    const averageTime = totalTime / PARALLEL_OPERATIONS;
    console.log(`Average response time for parallel listing requests: ${averageTime.toFixed(2)}ms`);

    // The average time per request should be significantly less than executing them sequentially
    // This validates that parallel processing is working efficiently
    expect(averageTime).toBeLessThan(MAX_ACCEPTABLE_RESPONSE_TIME);
  });

  it('should handle mixed read operations in parallel', async () => {
    // Get the first test site
    const site = sites[0];

    // Create different types of read requests
    const requests = [];

    // Add listing requests
    for (let i = 0; i < PARALLEL_OPERATIONS / 3; i++) {
      const request = createMockRequest(`/api/sites/${site.slug}/listings?page=${(i % 3) + 1}&limit=10`, {
        headers: {
          'x-forwarded-for': `192.168.2.${i + 1}`,
        },
      });

      requests.push(getListings(request, { params: { siteSlug: site.slug } }));
    }

    // Add category requests
    for (let i = 0; i < PARALLEL_OPERATIONS / 3; i++) {
      const request = createMockRequest(`/api/sites/${site.slug}/categories`, {
        headers: {
          'x-forwarded-for': `192.168.2.${i + PARALLEL_OPERATIONS / 3 + 1}`,
        },
      });

      requests.push(getCategories(request, { params: { siteSlug: site.slug } }));
    }

    // Add search requests
    for (let i = 0; i < PARALLEL_OPERATIONS / 3; i++) {
      const request = createMockRequest(`/api/search?q=test&siteId=${site.id}`, {
        headers: {
          'x-forwarded-for': `192.168.2.${i + (2 * PARALLEL_OPERATIONS / 3) + 1}`,
        },
      });

      requests.push(getSearchResults(request));
    }

    // Execute all requests in parallel
    const { fulfilled, rejected, totalTime } = await settlePromises(requests);

    // All requests should succeed
    expect(rejected.length).toBe(0);
    expect(fulfilled.length).toBe(requests.length);

    // All responses should have 200 status
    fulfilled.forEach(response => {
      expect(response.status).toBe(200);
    });

    // Average time should be efficient
    const averageTime = totalTime / requests.length;
    console.log(`Average response time for mixed parallel read operations: ${averageTime.toFixed(2)}ms`);

    // The average time per request should be reasonable
    expect(averageTime).toBeLessThan(MAX_ACCEPTABLE_RESPONSE_TIME);
  });

  it('should maintain consistent response structure during parallel reads', async () => {
    // Get the first test site
    const site = sites[0];

    // Create multiple request promises for the same resource
    const requests = Array(PARALLEL_OPERATIONS).fill(null).map(() => {
      const request = createMockRequest(`/api/sites/${site.slug}/listings?limit=10`, {
        headers: {
          'x-forwarded-for': '192.168.3.1',
        },
      });

      return getListings(request, { params: { siteSlug: site.slug } });
    });

    // Execute all requests in parallel
    const { fulfilled } = await settlePromises(requests);

    // Parse all responses
    const parsedResults = await Promise.all(
      fulfilled.map(async response => await response.json())
    );

    // All responses should have the same structure
    parsedResults.forEach(result => {
      expect(result).toHaveProperty('results');
      expect(result).toHaveProperty('pagination');
      expect(result.pagination).toHaveProperty('totalResults');
      expect(result.pagination).toHaveProperty('totalPages');
      expect(result.pagination).toHaveProperty('currentPage');
      expect(result.pagination).toHaveProperty('limit');
    });

    // All responses should have the same pagination data
    const firstResult = parsedResults[0];
    parsedResults.forEach(result => {
      expect(result.pagination.totalResults).toBe(firstResult.pagination.totalResults);
      expect(result.pagination.totalPages).toBe(firstResult.pagination.totalPages);
      expect(result.pagination.limit).toBe(firstResult.pagination.limit);
      expect(result.pagination.currentPage).toBe(firstResult.pagination.currentPage);
    });

    // All responses should have the same results (same IDs in the same order)
    const firstResultIds = firstResult.results.map(item => item.id);
    parsedResults.forEach(result => {
      const resultIds = result.results.map(item => item.id);
      expect(resultIds).toEqual(firstResultIds);
    });
  });
});
