import { createMocks } from 'node-mocks-http';
import { v4 as uuidv4 } from 'uuid';
import { NextRequest, NextResponse } from 'next/server';

// Mock Redis client
jest.mock('@/lib/redis-client', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    smembers: jest.fn().mockResolvedValue([]),
    multi: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  return {
    redis: mockRedis,
  };
});

// Mock the SiteService
jest.mock('@/services/site-service', () => ({
  SiteService: {
    getSiteBySlug: jest.fn(),
  },
}));

// Mock the CategoryService
jest.mock('@/services/category-service', () => ({
  CategoryService: {
    getCategoriesBySiteId: jest.fn(),
  },
}));

// Mock the middleware
jest.mock('@/middleware/withRedis', () => {
  return {
    withRedis: jest.fn().mockImplementation((handler) => {
      return handler;
    }),
  };
});

// Create a mock for NextRequest
const mockNextRequest = (url: string) => {
  const req = new Request(url);
  return {
    ...req,
    url,
    nextUrl: new URL(url)
  } as unknown as NextRequest;
};

describe('Categories API', () => {
  const testSiteSlug = 'test-site';
  const testSiteId = 'site_' + uuidv4();
  const mockSite = {
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

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should return 404 if site is not found', async () => {
    // Mock the site service to return null for the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(null);

    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');

    // Create a mock request
    const req = mockNextRequest(`http://localhost:3000/api/sites/${testSiteSlug}/categories`);

    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });

    // Verify the response
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'Site not found' });
  });

  it('should return empty array when site exists but has no categories', async () => {
    // Mock the site service to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);

    // Mock the category service to return empty array
    const { CategoryService } = require('@/services/category-service');
    CategoryService.getCategoriesBySiteId.mockResolvedValue([]);

    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');

    // Create a mock request
    const req = mockNextRequest(`http://localhost:3000/api/sites/${testSiteSlug}/categories`);

    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });

    // Verify the response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(0);
  });

  it('should return categories when site exists and has categories', async () => {
    const mockCategories = [
      {
        id: 'category_1',
        siteId: testSiteId,
        name: 'Category 1',
        slug: 'category-1',
        metaDescription: 'Test category 1',
        order: 1,
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        id: 'category_2',
        siteId: testSiteId,
        name: 'Category 2',
        slug: 'category-2',
        metaDescription: 'Test category 2',
        order: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ];

    // Mock the site service to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);

    // Mock the category service to return categories
    const { CategoryService } = require('@/services/category-service');
    CategoryService.getCategoriesBySiteId.mockResolvedValue(mockCategories);

    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');

    // Create a mock request
    const req = mockNextRequest(`http://localhost:3000/api/sites/${testSiteSlug}/categories`);

    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });

    // Verify the response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(2);
    expect(data[0].id).toBe('category_1');
    expect(data[1].id).toBe('category_2');
  });
});
