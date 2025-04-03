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
    headers: new Headers(headers),
  } as unknown as NextRequest;
};

describe('Categories API - Tenant Isolation', () => {
  const testSiteSlug = 'test-site';
  const testSiteId = 'site_' + uuidv4();
  
  const tenant1 = 'tenant1';
  const tenant2 = 'tenant2';
  
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
      tenantId: tenant1,
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
      tenantId: tenant2,
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
  
  it('should only return categories for the requesting tenant', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);
    
    // Mock the CategoryService to return all categories
    const { CategoryService } = require('@/services/category-service');
    CategoryService.getCategoriesBySiteId.mockResolvedValue(mockCategories);
    
    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Create a mock request with tenant1 header
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'x-tenant-id': tenant1 }
    );
    
    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });
    
    // Verify the services were called with the correct parameters
    expect(SiteService.getSiteBySlug).toHaveBeenCalledWith(testSiteSlug);
    expect(CategoryService.getCategoriesBySiteId).toHaveBeenCalledWith(testSiteId);
    
    // Verify the response only includes tenant1's categories
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('category_1');
    expect(data[0].tenantId).toBe(tenant1);
  });
  
  it('should prevent creating a category for a different tenant', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);
    
    // Mock the CategoryService to throw a permission error
    const { CategoryService } = require('@/services/category-service');
    CategoryService.createCategory.mockRejectedValue(
      new Error('You do not have permission to create categories for this tenant')
    );
    
    // Import the handler after mocking dependencies
    const { POST } = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Create a mock request with tenant1 header but trying to create a tenant2 category
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'x-tenant-id': tenant1 }
    );
    req.json = jest.fn().mockResolvedValue({
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
      tenantId: tenant2, // Different tenant
    });
    
    // Call the handler
    const response = await POST(req, { params: { siteSlug: testSiteSlug } });
    
    // Verify the response is a 403 Forbidden
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data).toEqual({ 
      error: 'You do not have permission to create categories for this tenant' 
    });
  });
  
  it('should allow creating a category for the same tenant', async () => {
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
      tenantId: tenant1,
      siteId: testSiteId,
      parentId: null,
      order: 1,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    };
    CategoryService.createCategory.mockResolvedValue(mockCreatedCategory);
    
    // Import the handler after mocking dependencies
    const { POST } = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Create a mock request with tenant1 header and creating a tenant1 category
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'x-tenant-id': tenant1 }
    );
    req.json = jest.fn().mockResolvedValue({
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
      tenantId: tenant1, // Same tenant
    });
    
    // Call the handler
    const response = await POST(req, { params: { siteSlug: testSiteSlug } });
    
    // Verify the response is a 201 Created
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual(mockCreatedCategory);
  });
});
