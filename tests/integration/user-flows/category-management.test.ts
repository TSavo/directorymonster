/**
 * @jest-environment node
 */
import { GET as getCategories, POST as createCategory } from '@/app/api/sites/[siteSlug]/categories/route';
import { setupTestEnvironment, clearTestData } from '../setup-mock';
import { createMockRequest } from '../auth/acl-test-setup';
import { SiteConfig, Category } from '@/types';

// Mock the Redis client
jest.mock('../../../src/lib/redis-client', () => {
  // Import our mock Redis client
  const setupMock = require('../setup-mock');

  // Create jest mock functions that delegate to the original implementation
  const mockKv = {
    get: jest.fn().mockImplementation((key) => setupMock.kv.get(key)),
    set: jest.fn().mockImplementation((key, value) => setupMock.kv.set(key, value)),
    keys: jest.fn().mockImplementation((pattern) => setupMock.kv.keys(pattern)),
    del: jest.fn().mockImplementation((...keys) => setupMock.kv.del(...keys)),
    smembers: jest.fn().mockImplementation((key) => setupMock.kv.smembers(key)),
    sadd: jest.fn().mockImplementation((key, ...values) => setupMock.kv.sadd(key, ...values))
  };

  const mockRedis = {
    multi: jest.fn().mockImplementation(() => setupMock.redis.multi()),
    ping: jest.fn().mockImplementation(() => setupMock.redis.ping())
  };

  return {
    redis: mockRedis,
    kv: mockKv
  };
});

// Store original module for reference
const originalModule = require('../setup-mock');

describe('Category Management', () => {
  // Store test data references
  let sites: SiteConfig[];
  let categories: Category[];

  beforeAll(async () => {
    // Set up test environment and store references
    const testData = await setupTestEnvironment();
    sites = testData.sites;
    categories = testData.categories;
  });

  afterAll(async () => {
    // Clean up test data
    await clearTestData();
  });

  it('should create and retrieve a new category', async () => {
    // Get the first test site
    const site = sites[0];

    // Create new category data
    const newCategoryData = {
      name: 'Integration Test Category',
      metaDescription: 'This is a test category created by integration tests',
      parentId: categories.find(c => c.siteId === site.id)?.id // Optional parent
    };

    // Create a mock request for creating a category
    const createRequest = createMockRequest(`/api/sites/${site.slug}/categories`, {
      method: 'POST',
      body: {
        ...newCategoryData,
        siteId: site.id // Explicitly set the site ID
      },
    });

    console.log('Creating category with data:', {
      ...newCategoryData,
      siteId: site.id
    });

    // Call the create category API endpoint
    const createResponse = await createCategory(createRequest, { params: { siteSlug: site.slug } });

    // Verify response is successful
    expect(createResponse.status).toBe(201);

    // Parse the response to get the created category
    const createdCategory = await createResponse.json();

    // Verify the category was created with correct data
    expect(createdCategory.id).toBeDefined();
    expect(createdCategory.name).toBe(newCategoryData.name);
    expect(createdCategory.slug).toBe('integration-test-category');
    expect(createdCategory.siteId).toBe(site.id);

    // Now retrieve all categories to verify the new one is included
    const getRequest = createMockRequest(`/api/sites/${site.slug}/categories`);
    const getResponse = await getCategories(getRequest, { params: { siteSlug: site.slug } });

    // Verify get response is successful
    expect(getResponse.status).toBe(200);

    // Parse the response to get all categories
    const allCategories = await getResponse.json();

    // Find our newly created category in the list
    const foundCategory = allCategories.find((c: Category) => c.id === createdCategory.id);

    // Verify the category can be retrieved
    expect(foundCategory).toBeDefined();
    expect(foundCategory.name).toBe(newCategoryData.name);
    expect(foundCategory.slug).toBe('integration-test-category');
  });
});
