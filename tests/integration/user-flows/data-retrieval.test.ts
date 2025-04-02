/**
 * @jest-environment node
 */
import { GET as getSite } from '@/app/api/sites/[siteSlug]/route';
import { GET as getCategories } from '@/app/api/sites/[siteSlug]/categories/route';
import { GET as getListings } from '@/app/api/sites/[siteSlug]/listings/route';
import { setupTestEnvironment, clearTestData, createMockRequest } from '../setup';
import { SiteConfig, Category, Listing } from '@/types';

describe.skip('Data Retrieval User Flow', () => {
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
  });
  
  afterAll(async () => {
    // Clean up test data
    await clearTestData();
  });
  
  it.skip('should retrieve site configuration', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Create a mock request for the site API
    const request = createMockRequest(`/api/sites/${site.slug}`);
    
    // Call the site API endpoint
    const response = await getSite(request, { params: { siteSlug: site.slug } });
    
    // Verify response is successful
    expect(response.status).toBe(200);
    
    // Parse the response
    const data = await response.json();
    
    // Verify the correct site data was retrieved
    expect(data).toMatchObject({
      id: site.id,
      name: site.name,
      slug: site.slug,
      domain: site.domain,
    });
  });
  
  it.skip('should retrieve categories for a site', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Create a mock request for the categories API
    const request = createMockRequest(`/api/sites/${site.slug}/categories`);
    
    // Call the categories API endpoint
    const response = await getCategories(request, { params: { siteSlug: site.slug } });
    
    // Verify response is successful
    expect(response.status).toBe(200);
    
    // Parse the response
    const data = await response.json();
    
    // Verify categories were retrieved
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Verify these are the correct categories for this site
    data.forEach((category: Category) => {
      expect(category.siteId).toBe(site.id);
    });
    
    // Verify the subcategory relationship
    const parentCategory = data.find((c: Category) => c.name === 'Category 1');
    const childCategory = data.find((c: Category) => c.name === 'Category 3');
    
    expect(parentCategory).toBeDefined();
    expect(childCategory).toBeDefined();
    expect(childCategory?.parentId).toBe(parentCategory?.id);
  });
  
  it.skip('should retrieve listings for a site', async () => {
    // Get the first test site
    const site = sites[0];
    
    // Create a mock request for the listings API
    const request = createMockRequest(`/api/sites/${site.slug}/listings`);
    
    // Call the listings API endpoint
    const response = await getListings(request, { params: { siteSlug: site.slug } });
    
    // Verify response is successful
    expect(response.status).toBe(200);
    
    // Parse the response
    const data = await response.json();
    
    // Verify listings were retrieved
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    
    // Verify these are the correct listings for this site
    data.forEach((listing: Listing) => {
      expect(listing.siteId).toBe(site.id);
    });
  });
  
  it.skip('should follow the complete data retrieval flow', async () => {
    // This test simulates a user flow:
    // 1. Get site info
    // 2. Get categories for the site
    // 3. Get listings for a specific category
    
    // Get the first test site
    const site = sites[0];
    
    // Step 1: Get site info
    const siteRequest = createMockRequest(`/api/sites/${site.slug}`);
    const siteResponse = await getSite(siteRequest, { params: { siteSlug: site.slug } });
    const siteData = await siteResponse.json();
    
    // Verify site data
    expect(siteData.id).toBe(site.id);
    
    // Step 2: Get categories for the site
    const categoriesRequest = createMockRequest(`/api/sites/${site.slug}/categories`);
    const categoriesResponse = await getCategories(categoriesRequest, { params: { siteSlug: site.slug } });
    const categoriesData = await categoriesResponse.json();
    
    // Select a category from the response
    const category = categoriesData[0];
    expect(category).toBeDefined();
    
    // Verify the category belongs to the site
    expect(category.siteId).toBe(site.id);
    
    // Step 3: Get listings for the selected category
    // For this we need to modify our request to filter by categoryId
    const listingsRequest = createMockRequest(`/api/sites/${site.slug}/listings?categoryId=${category.id}`);
    const listingsResponse = await getListings(listingsRequest, { params: { siteSlug: site.slug } });
    const listingsData = await listingsResponse.json();
    
    // Verify we got listings
    expect(Array.isArray(listingsData)).toBe(true);
    
    // Check that listings belong to both the site and the category
    listingsData.forEach((listing: Listing) => {
      expect(listing.siteId).toBe(site.id);
      expect(listing.categoryId).toBe(category.id);
    });
  });
});
