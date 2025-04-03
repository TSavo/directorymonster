import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { SiteConfig, Category } from '@/types';

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
    createCategory: jest.fn(),
  },
}));

// Mock the ACLService
jest.mock('@/services/acl-service', () => ({
  ACLService: {
    hasPermission: jest.fn().mockResolvedValue(true), // Default to allowing all permissions
  },
}));

// Mock the middleware
jest.mock('@/middleware/withRedis', () => ({
  withRedis: jest.fn().mockImplementation((handler) => handler),
}));

// Create a mock for NextRequest
const mockNextRequest = (url: string, headers: Record<string, string> = {}) => {
  const req = new Request(url, { headers });
  return {
    ...req,
    url,
    nextUrl: new URL(url),
    headers: new Headers(headers)
  } as unknown as NextRequest;
};

describe('Categories API', () => {
  const testSiteSlug = 'test-site';
  const testSiteId = 'site_' + uuidv4();

  const mockSite: SiteConfig = {
    id: testSiteId,
    name: 'Test Site',
    slug: testSiteSlug,
    primaryKeyword: 'test',
    metaDescription: 'Test site for API testing',
    headerText: 'Test Site Header',
    defaultLinkAttributes: 'dofollow',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockCategories: Category[] = [
    {
      id: 'category_1',
      siteId: testSiteId,
      tenantId: 'default',
      name: 'Category 1',
      slug: 'category-1',
      metaDescription: 'Test category 1',
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'category_2',
      siteId: testSiteId,
      tenantId: 'default',
      name: 'Category 2',
      slug: 'category-2',
      metaDescription: 'Test category 2',
      order: 2,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should return 404 if site is not found', async () => {
    // Mock the SiteService to return null
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(null);

    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');

    // Create a mock request with user ID and tenant ID headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'x-user-id': 'test-user', 'x-tenant-id': 'default' }
    );

    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });

    // Verify the SiteService was called
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith(testSiteSlug);

    // Verify the response
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'Site not found' });
  });

  it('should return empty array when site exists but has no categories', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);

    // Mock the CategoryService to return empty array
    const { CategoryService } = require('@/services/category-service');
    CategoryService.getCategoriesBySiteId.mockResolvedValue([]);

    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');

    // Create a mock request with user ID and tenant ID headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'x-user-id': 'test-user', 'x-tenant-id': 'default' }
    );

    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });

    // Verify the services were called with the correct parameters
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith(testSiteSlug);
    expect(CategoryService.getCategoriesBySiteId).toHaveBeenCalledWith(testSiteId);

    // Verify the response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(0);
  });

  it('should return categories when site exists and has categories', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);

    // Mock the CategoryService to return categories
    const { CategoryService } = require('@/services/category-service');
    CategoryService.getCategoriesBySiteId.mockResolvedValue(mockCategories);

    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');

    // Create a mock request with user ID and tenant ID headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'x-user-id': 'test-user', 'x-tenant-id': 'default' }
    );

    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });

    // Verify the services were called with the correct parameters
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith(testSiteSlug);
    expect(CategoryService.getCategoriesBySiteId).toHaveBeenCalledWith(testSiteId);

    // Verify the response
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe('category_1');
    expect(data[1].id).toBe('category_2');
  });

  it('should return 404 if site is not found when creating a category', async () => {
    // Mock the SiteService to return null
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(null);

    // Import the handler after mocking dependencies
    const { POST } = require('@/app/api/sites/[siteSlug]/categories/route');

    // Create a mock request with JSON body and headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'x-user-id': 'test-user', 'x-tenant-id': 'default' }
    );
    req.json = jest.fn().mockResolvedValue({
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
    });

    // Call the handler
    const response = await POST(req, { params: { siteSlug: testSiteSlug } });

    // Verify the SiteService was called
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith(testSiteSlug);

    // Verify the response
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data).toEqual({ error: 'Site not found' });
  });

  it('should create a new category', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);

    // Mock the CategoryService to create a category
    const { CategoryService } = require('@/services/category-service');
    const mockTimestamp = 1234567890;
    const mockCreatedCategory = {
      id: `category_${mockTimestamp}`,
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
      tenantId: 'default',
      siteId: testSiteId,
      parentId: null,
      order: 1,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    };
    CategoryService.createCategory.mockResolvedValue(mockCreatedCategory);

    // Import the handler after mocking dependencies
    const { POST } = require('@/app/api/sites/[siteSlug]/categories/route');

    // Create a mock request with JSON body and headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'x-user-id': 'test-user', 'x-tenant-id': 'default' }
    );
    req.json = jest.fn().mockResolvedValue({
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
    });

    // Call the handler
    const response = await POST(req, { params: { siteSlug: testSiteSlug } });

    // Verify the services were called with the correct parameters
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith(testSiteSlug);
    expect(CategoryService.createCategory).toHaveBeenCalledWith(
      {
        name: 'New Category',
        slug: 'new-category',
        metaDescription: 'This is a new category',
        tenantId: 'default',
        siteId: testSiteId,
        parentId: undefined,
      },
      'default' // The tenant ID from headers
    );

    // Verify the response
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual(mockCreatedCategory);
  });

  it('should return 409 if a category with the same slug already exists', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);

    // Mock the CategoryService to throw an error for duplicate slug
    const { CategoryService } = require('@/services/category-service');
    CategoryService.createCategory.mockRejectedValue(new Error('A category with this slug already exists'));

    // Import the handler after mocking dependencies
    const { POST } = require('@/app/api/sites/[siteSlug]/categories/route');

    // Create a mock request with JSON body and headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'x-user-id': 'test-user', 'x-tenant-id': 'default' }
    );
    req.json = jest.fn().mockResolvedValue({
      name: 'Duplicate Category',
      slug: 'existing-slug',
      metaDescription: 'This is a duplicate category',
    });

    // Call the handler
    const response = await POST(req, { params: { siteSlug: testSiteSlug } });

    // Verify the services were called with the correct parameters
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith(testSiteSlug);
    expect(CategoryService.createCategory).toHaveBeenCalled();

    // Verify the response
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data).toEqual({ error: 'A category with this slug already exists' });
  });
});
