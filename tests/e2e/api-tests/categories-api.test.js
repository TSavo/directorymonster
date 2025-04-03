/**
 * E2E Tests for Categories API
 * 
 * Tests the /api/sites/[siteSlug]/categories endpoint
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');
const { redis, kv } = require('../../../src/lib/redis-client');

// Base URL for API requests
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

describe('Categories API', () => {
  const testSiteSlug = 'test-site';
  const testSiteId = 'site_' + uuidv4();
  
  // Setup test data before running tests
  beforeAll(async () => {
    // Create a test site
    const site = {
      id: testSiteId,
      name: 'Test Site',
      slug: testSiteSlug,
      primaryKeyword: 'test',
      metaDescription: 'Test site for API testing',
      headerText: 'Test Site Header',
      defaultLinkAttributes: 'dofollow',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    // Store the site in Redis
    await kv.set(`test:site:id:${site.id}`, site);
    await kv.set(`test:site:slug:${site.slug}`, site);
  });
  
  // Clean up test data after tests
  afterAll(async () => {
    // Remove test site
    await redis.del(`test:site:id:${testSiteId}`);
    await redis.del(`test:site:slug:${testSiteSlug}`);
    
    // Remove any test categories
    const categoryKeys = await redis.keys('test:category:*');
    if (categoryKeys.length > 0) {
      await redis.del(...categoryKeys);
    }
    
    // Remove site categories index
    await redis.del(`test:site:${testSiteId}:categories`);
  });
  
  // Test that the endpoint returns a 500 error (since it doesn't exist yet)
  it('should return a 500 error when the endpoint is not implemented', async () => {
    const response = await request(BASE_URL)
      .get(`/api/sites/${testSiteSlug}/categories`);
    
    expect(response.status).toBe(500);
  });
});
