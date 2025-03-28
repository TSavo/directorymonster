/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '../../../src/app/api/sites/[siteSlug]/categories/route';

// Mock the Redis client
jest.mock('../../../src/lib/redis-client', () => ({
  kv: {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn(),
    del: jest.fn(),
  },
  redis: {
    multi: jest.fn(),
    ping: jest.fn(),
  },
}));

// Mock withRedis middleware to pass through the handler
jest.mock('../../../src/middleware/withRedis', () => ({
  withRedis: (handler: Function) => handler,
}));

describe('Categories API - POST', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 404 when site is not found', async () => {
    // Mock the Redis client to return null for site
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockResolvedValue(null);
    (kv.keys as jest.Mock).mockResolvedValue([]);
    
    // Create request
    const request = new NextRequest('http://localhost:3000/api/sites/non-existent/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Category',
        metaDescription: 'New category description',
      }),
    });
    
    // Spy on console.log for debugging output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    
    // Execute the route handler
    const response = await POST(request, { params: { siteSlug: 'non-existent' } });
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(404);
    expect(data).toEqual({
      error: 'Site not found',
    });
  });

  it('should return 400 when required fields are missing', async () => {
    // Mock site data
    const mockSite = {
      id: 'site1',
      name: 'Test Site',
      slug: 'test-site',
      primaryKeyword: 'test',
      metaDescription: 'Test site description',
      headerText: 'Test Site Header',
      defaultLinkAttributes: 'dofollow',
      createdAt: 1000,
      updatedAt: 1000,
    };
    
    // Mock the Redis client
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockResolvedValue(mockSite);
    
    // Create request with missing fields
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing name
        // Missing metaDescription
      }),
    });
    
    // Execute the route handler
    const response = await POST(request, { params: { siteSlug: 'test-site' } });
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(400);
    expect(data).toEqual({
      error: 'Missing required fields',
    });
  });

  it('should return 409 when category slug already exists', async () => {
    // Mock site data
    const mockSite = {
      id: 'site1',
      name: 'Test Site',
      slug: 'test-site',
      primaryKeyword: 'test',
      metaDescription: 'Test site description',
      headerText: 'Test Site Header',
      defaultLinkAttributes: 'dofollow',
      createdAt: 1000,
      updatedAt: 1000,
    };
    
    // Mock the Redis client
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation((key) => {
      if (key === 'site:slug:test-site') {
        return Promise.resolve(mockSite);
      }
      if (key === 'category:site:site1:test-category') {
        // Slug already exists
        return Promise.resolve({
          id: 'existing-category',
          siteId: 'site1',
          name: 'Test Category',
          slug: 'test-category',
          metaDescription: 'Existing description',
          order: 1,
          createdAt: 1000,
          updatedAt: 1000,
        });
      }
      return Promise.resolve(null);
    });
    (kv.keys as jest.Mock).mockResolvedValue([]);
    
    // Create request with a name that generates an existing slug
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Category', // This will generate 'test-category' as the slug
        metaDescription: 'Test description',
      }),
    });
    
    // Execute the route handler
    const response = await POST(request, { params: { siteSlug: 'test-site' } });
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(409);
    expect(data).toEqual({
      error: 'A category with this name or slug already exists',
    });
  });

  it('should create a new category successfully', async () => {
    // Mock site data
    const mockSite = {
      id: 'site1',
      name: 'Test Site',
      slug: 'test-site',
      primaryKeyword: 'test',
      metaDescription: 'Test site description',
      headerText: 'Test Site Header',
      defaultLinkAttributes: 'dofollow',
      createdAt: 1000,
      updatedAt: 1000,
    };
    
    // Mock the Redis client
    const { kv, redis } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation((key) => {
      if (key === 'site:slug:test-site') {
        return Promise.resolve(mockSite);
      }
      // Slug doesn't exist yet
      return Promise.resolve(null);
    });
    (kv.keys as jest.Mock).mockResolvedValue([
      'category:site:site1:existing-category-1',
      'category:site:site1:existing-category-2',
    ]);
    
    // Mock existing categories for order calculation
    const existingCategories = [
      {
        id: 'cat1',
        siteId: 'site1',
        name: 'Existing Category 1',
        slug: 'existing-category-1',
        metaDescription: 'Existing description 1',
        order: 1,
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        id: 'cat2',
        siteId: 'site1',
        name: 'Existing Category 2',
        slug: 'existing-category-2',
        metaDescription: 'Existing description 2',
        order: 2,
        createdAt: 2000,
        updatedAt: 2000,
      }
    ];
    
    // Setup Promise.all mock implementation for existing categories
    const originalPromiseAll = Promise.all;
    // @ts-ignore: Needed for mocking
    Promise.all = jest.fn().mockImplementation((promises) => {
      // Simulate the behavior of Promise.all with our mock data
      return Promise.resolve(existingCategories);
    });
    
    // Mock the multi transaction
    const mockMulti = {
      set: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 'OK'], // First set operation result
        [null, 'OK'], // Second set operation result
      ]),
    };
    (redis.multi as jest.Mock).mockReturnValue(mockMulti);
    
    // Mock Date.now for consistent timestamps
    const originalDateNow = Date.now;
    Date.now = jest.fn(() => 1234567890);
    
    // Create request with valid data
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Test Category',
        metaDescription: 'New test description',
        parentId: 'cat1', // Optional parent category
      }),
    });
    
    // Execute the route handler
    const response = await POST(request, { params: { siteSlug: 'test-site' } });
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(201);
    expect(data).toEqual({
      id: 'category_1234567890',
      siteId: 'site1',
      name: 'New Test Category',
      slug: 'new-test-category',
      metaDescription: 'New test description',
      parentId: 'cat1',
      order: 3, // Based on highest existing order + 1
      createdAt: 1234567890,
      updatedAt: 1234567890,
    });
    
    // Verify the Redis client was called correctly
    expect(redis.multi).toHaveBeenCalled();
    expect(mockMulti.set).toHaveBeenCalledTimes(2);
    expect(mockMulti.set).toHaveBeenCalledWith(
      'category:id:category_1234567890',
      expect.any(String)
    );
    expect(mockMulti.set).toHaveBeenCalledWith(
      'category:site:site1:new-test-category',
      expect.any(String)
    );
    expect(mockMulti.exec).toHaveBeenCalled();
    
    // Restore original functions
    Promise.all = originalPromiseAll;
    Date.now = originalDateNow;
  });

  it('should handle errors in Redis transaction', async () => {
    // Mock site data
    const mockSite = {
      id: 'site1',
      name: 'Test Site',
      slug: 'test-site',
      primaryKeyword: 'test',
      metaDescription: 'Test site description',
      headerText: 'Test Site Header',
      defaultLinkAttributes: 'dofollow',
      createdAt: 1000,
      updatedAt: 1000,
    };
    
    // Mock the Redis client
    const { kv, redis } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockImplementation((key) => {
      if (key === 'site:slug:test-site') {
        return Promise.resolve(mockSite);
      }
      return Promise.resolve(null);
    });
    (kv.keys as jest.Mock).mockResolvedValue([]);
    
    // Setup Promise.all mock implementation for empty categories
    const originalPromiseAll = Promise.all;
    // @ts-ignore: Needed for mocking
    Promise.all = jest.fn().mockImplementation((promises) => {
      // Simulate the behavior of Promise.all with empty data
      return Promise.resolve([]);
    });
    
    // Mock the multi transaction with an error
    const mockMulti = {
      set: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([
        [null, 'OK'], // First set operation result
        [new Error('Transaction error'), null], // Error in second operation
      ]),
    };
    (redis.multi as jest.Mock).mockReturnValue(mockMulti);
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create request with valid data
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Test Category',
        metaDescription: 'New test description',
      }),
    });
    
    // Execute the route handler
    const response = await POST(request, { params: { siteSlug: 'test-site' } });
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Failed to save category data',
    });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Transaction errors:',
      expect.anything()
    );
    
    // Restore original function
    Promise.all = originalPromiseAll;
  });

  it('should handle JSON parsing errors', async () => {
    // Mock site data
    const mockSite = {
      id: 'site1',
      name: 'Test Site',
      slug: 'test-site',
      primaryKeyword: 'test',
      metaDescription: 'Test site description',
      headerText: 'Test Site Header',
      defaultLinkAttributes: 'dofollow',
      createdAt: 1000,
      updatedAt: 1000,
    };
    
    // Mock the Redis client
    const { kv } = require('../../../src/lib/redis-client');
    (kv.get as jest.Mock).mockResolvedValue(mockSite);
    (kv.keys as jest.Mock).mockResolvedValue([]);
    
    // Create a mock request that will throw during JSON parsing
    const request = new NextRequest('http://localhost:3000/api/sites/test-site/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    
    // Mock request.json to throw an error
    request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'));
    
    // Spy on console.error
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Execute the route handler
    const response = await POST(request, { params: { siteSlug: 'test-site' } });
    
    // Parse the response
    const data = await response.json();
    
    // Verify the response
    expect(response.status).toBe(500);
    expect(data).toEqual({
      error: 'Internal server error',
    });
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'Error creating category:',
      expect.any(Error)
    );
  });
});
