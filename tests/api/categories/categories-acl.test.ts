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
    hasPermission: jest.fn(),
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

describe('Categories API - ACL', () => {
  const testSiteSlug = 'test-site';
  const testSiteId = 'site_' + uuidv4();
  const testUserId = 'user_' + uuidv4();
  const testTenantId = 'tenant_1';
  
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
      tenantId: testTenantId,
      name: 'Category 1',
      slug: 'category-1',
      metaDescription: 'Test category 1',
      order: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });
  
  it('should return 403 if user does not have permission to read categories', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);
    
    // Mock the ACLService to return false for permission check
    const { ACLService } = require('@/services/acl-service');
    ACLService.hasPermission.mockResolvedValue(false);
    
    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Create a mock request with user ID and tenant ID headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 
        'x-user-id': testUserId,
        'x-tenant-id': testTenantId
      }
    );
    
    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });
    
    // Verify the ACLService was called with the correct parameters
    expect(ACLService.hasPermission).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'read:category'
    );
    
    // Verify the response is a 403 Forbidden
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data).toEqual({ 
      error: 'You do not have permission to view categories' 
    });
  });
  
  it('should return categories if user has permission to read categories', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);
    
    // Mock the CategoryService to return categories
    const { CategoryService } = require('@/services/category-service');
    CategoryService.getCategoriesBySiteId.mockResolvedValue(mockCategories);
    
    // Mock the ACLService to return true for permission check
    const { ACLService } = require('@/services/acl-service');
    ACLService.hasPermission.mockResolvedValue(true);
    
    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Create a mock request with user ID and tenant ID headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 
        'x-user-id': testUserId,
        'x-tenant-id': testTenantId
      }
    );
    
    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });
    
    // Verify the ACLService was called with the correct parameters
    expect(ACLService.hasPermission).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'read:category'
    );
    
    // Verify the response is a 200 OK with categories
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('category_1');
  });
  
  it('should return 403 if user does not have permission to create categories', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);
    
    // Mock the ACLService to return false for permission check
    const { ACLService } = require('@/services/acl-service');
    ACLService.hasPermission.mockResolvedValue(false);
    
    // Import the handler after mocking dependencies
    const { POST } = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Create a mock request with user ID and tenant ID headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 
        'x-user-id': testUserId,
        'x-tenant-id': testTenantId
      }
    );
    req.json = jest.fn().mockResolvedValue({
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
    });
    
    // Call the handler
    const response = await POST(req, { params: { siteSlug: testSiteSlug } });
    
    // Verify the ACLService was called with the correct parameters
    expect(ACLService.hasPermission).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'create:category'
    );
    
    // Verify the response is a 403 Forbidden
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data).toEqual({ 
      error: 'You do not have permission to create categories' 
    });
  });
  
  it('should create a category if user has permission', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);
    
    // Mock the ACLService to return true for permission check
    const { ACLService } = require('@/services/acl-service');
    ACLService.hasPermission.mockResolvedValue(true);
    
    // Mock the CategoryService to create a category
    const { CategoryService } = require('@/services/category-service');
    const mockTimestamp = 1234567890;
    const mockCreatedCategory = {
      id: `category_${mockTimestamp}`,
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
      tenantId: testTenantId,
      siteId: testSiteId,
      parentId: null,
      order: 1,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    };
    CategoryService.createCategory.mockResolvedValue(mockCreatedCategory);
    
    // Import the handler after mocking dependencies
    const { POST } = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Create a mock request with user ID and tenant ID headers
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 
        'x-user-id': testUserId,
        'x-tenant-id': testTenantId
      }
    );
    req.json = jest.fn().mockResolvedValue({
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
    });
    
    // Call the handler
    const response = await POST(req, { params: { siteSlug: testSiteSlug } });
    
    // Verify the ACLService was called with the correct parameters
    expect(ACLService.hasPermission).toHaveBeenCalledWith(
      testUserId,
      testTenantId,
      'create:category'
    );
    
    // Verify the CategoryService was called with the correct parameters
    expect(CategoryService.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Category',
        slug: 'new-category',
        metaDescription: 'This is a new category',
        tenantId: testTenantId,
      }),
      testTenantId
    );
    
    // Verify the response is a 201 Created
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual(mockCreatedCategory);
  });
});
