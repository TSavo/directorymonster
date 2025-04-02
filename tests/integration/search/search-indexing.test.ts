/**
 * @jest-environment node
 */
import { GET as getSearch } from '@/app/api/search/route';
import { POST as createListing } from '@/app/api/sites/[siteSlug]/listings/route';
import { searchIndexer } from '@/lib/search-indexer';
import { setupTestEnvironment, clearTestData, createMockRequest, wait } from '../setup';
import { SiteConfig, Category, Listing } from '@/types';

// Mock the search-indexer module
jest.mock('../../../src/lib/search-indexer', () => {
  // Keep track of indexed listings for testing
  const indexedListings: Record<string, any> = {};
  
  return {
    searchIndexer: {
      indexListing: jest.fn((listing) => {
        // Store the listing in our test index
        indexedListings[listing.id] = listing;
        return Promise.resolve();
      }),
      searchListings: jest.fn(({ query, siteId, limit }) => {
        // Simple search implementation for testing
        const results = Object.values(indexedListings)
          // Filter by site if siteId is provided
          .filter(listing => !siteId || listing.siteId === siteId)
          // Search in title and content
          .filter(listing => 
            listing.title.toLowerCase().includes(query.toLowerCase()) ||
            listing.content.toLowerCase().includes(query.toLowerCase())
          )
          // Limit results
          .slice(0, limit || 10);
        
        return Promise.resolve(results);
      }),
      // Expose the indexed listings for test verification
      getIndexedListings: () => indexedListings,
      // Clear the test index
      clearIndex: () => {
        Object.keys(indexedListings).forEach(key => {
          delete indexedListings[key];
        });
      }
    }
  };
});

describe('Search Indexing and Retrieval', () => {
  // Store test data references
  let sites: SiteConfig[];
  let categories: Category[];
  let listings: Listing[];
  
  beforeAll(async () => {
    // Set up test environment and store references
    const testData = await setupTestEnvironment();
    sites = testData.sites;
    categories = testData.categories;
    listings = testData.listings;
    
    // Clear the search index
    (searchIndexer as any).clearIndex();
  });
  
  afterAll(async () => {
    // Clean up test data
    await clearTestData();
    // Clear the search index
    (searchIndexer as any).clearIndex();
  });
  
  it('should index a listing when created', async () => {
    // Get the first test site and category
    const site = sites[0];
    const category = categories.find(c => c.siteId === site.id)!;
    
    // Create new listing data
    const newListingData = {
      title: 'Unique Search Test Listing',
      categoryId: category.id,
      metaDescription: 'This is a test listing for search functionality',
      content: 'This content contains unique search keywords like xylophone zebra rainbow',
      backlinkUrl: 'https://example.com/search-test',
      backlinkAnchorText: 'Search Test Link',
      backlinkPosition: 'prominent',
      backlinkType: 'dofollow',
    };
    
    // Create a mock request for creating a listing
    const request = createMockRequest(`/api/sites/${site.slug}/listings`, {
      method: 'POST',
      body: newListingData,
    });
    
    // Call the create listing API endpoint
    const response = await createListing(request, { params: { siteSlug: site.slug } });
    
    // Verify response is successful
    expect(response.status).toBe(201);
    
    // Parse the response to get the created listing
    const createdListing = await response.json();
    
    // Verify the listing was created
    expect(createdListing.id).toBeDefined();
    expect(createdListing.title).toBe(newListingData.title);
    
    // Verify the listing was indexed
    expect(searchIndexer.indexListing).toHaveBeenCalledWith(
      expect.objectContaining({
        id: createdListing.id,
        title: createdListing.title,
      })
    );
    
    // Get the indexed listings
    const indexedListings = (searchIndexer as any).getIndexedListings();
    
    // Verify the listing is in the index
    expect(indexedListings[createdListing.id]).toBeDefined();
  });
  
  it('should retrieve listings via search API', async () => {
    // Define a unique search query
    const uniqueQuery = 'xylophone';
    
    // Create a mock request for the search API
    const request = createMockRequest(`/api/search?q=${uniqueQuery}`);
    
    // Call the search API endpoint
    const response = await getSearch(request);
    
    // Verify response is successful
    expect(response.status).toBe(200);
    
    // Parse the response
    const data = await response.json();
    
    // Verify search results were returned
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
    
    // Verify the results contain our unique search term
    const hasMatch = data.results.some((result: any) => 
      result.title.includes('Unique Search Test') ||
      result.content.includes(uniqueQuery)
    );
    
    expect(hasMatch).toBe(true);
  });
  
  it('should filter search results by site', async () => {
    // Get sites for testing
    const site1 = sites[0];
    const site2 = sites[1];
    
    // Index listings for both sites with a common keyword
    const commonKeyword = 'gemstone';
    
    // Create and index a listing for site 1
    const listing1 = {
      id: 'test-search-site1',
      siteId: site1.id,
      title: `${site1.name} ${commonKeyword}`,
      content: `This listing belongs to ${site1.name} and contains the keyword ${commonKeyword}`,
    };
    await searchIndexer.indexListing(listing1 as any);
    
    // Create and index a listing for site 2
    const listing2 = {
      id: 'test-search-site2',
      siteId: site2.id,
      title: `${site2.name} ${commonKeyword}`,
      content: `This listing belongs to ${site2.name} and contains the keyword ${commonKeyword}`,
    };
    await searchIndexer.indexListing(listing2 as any);
    
    // Search with site filter for site 1
    const request1 = createMockRequest(`/api/search?q=${commonKeyword}&site=${site1.slug}`);
    const response1 = await getSearch(request1);
    const data1 = await response1.json();
    
    // Verify results are filtered to site 1
    expect(data1.results.length).toBeGreaterThan(0);
    data1.results.forEach((result: any) => {
      expect(result.siteId).toBe(site1.id);
    });
    
    // Search with site filter for site 2
    const request2 = createMockRequest(`/api/search?q=${commonKeyword}&site=${site2.slug}`);
    const response2 = await getSearch(request2);
    const data2 = await response2.json();
    
    // Verify results are filtered to site 2
    expect(data2.results.length).toBeGreaterThan(0);
    data2.results.forEach((result: any) => {
      expect(result.siteId).toBe(site2.id);
    });
  });
  
  it('should handle search with no results', async () => {
    // Search for a term that shouldn't exist
    const nonExistentQuery = 'xyznonexistentterm123';
    
    // Create a mock request for the search API
    const request = createMockRequest(`/api/search?q=${nonExistentQuery}`);
    
    // Call the search API endpoint
    const response = await getSearch(request);
    
    // Verify response is successful
    expect(response.status).toBe(200);
    
    // Parse the response
    const data = await response.json();
    
    // Verify empty results array
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBe(0);
  });
});
