import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { SiteConfig, Category } from '@/types';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';

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

// Mock the AuthService
jest.mock('@/services/auth-service', () => ({
  AuthService: {
    validateToken: jest.fn(),
    hasPermission: jest.fn(),
  },
}));

// Mock the middleware
jest.mock('@/middleware/withRedis', () => ({
  withRedis: jest.fn().mockImplementation((handler) => handler),
}));

// Mock the auth middleware
jest.mock('@/middleware/withAuth', () => ({
  withAuth: jest.fn().mockImplementation((handler) => handler),
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

describe('Categories API - JWT Authentication', () => {
  const testSiteSlug = 'test-site';
  const testSiteId = 'site_' + uuidv4();
  const testUserId = 'user_' + uuidv4();
  const testTenantId = 'tenant_1';
  
  // Create a valid JWT token for testing
  const validToken = jwt.sign(
    { 
      sub: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category', 'create:category']
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    }
  );
  
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
  
  it('should use the withAuth middleware for GET endpoint', async () => {
    // Import the handler after mocking dependencies
    const categoriesModule = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Verify the withAuth middleware is used
    const { withAuth } = require('@/middleware/withAuth');
    expect(withAuth).toHaveBeenCalledWith(
      expect.any(Function),
      { requiredPermission: 'read:category' }
    );
  });
  
  it('should use the withAuth middleware for POST endpoint', async () => {
    // Import the handler after mocking dependencies
    const categoriesModule = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Verify the withAuth middleware is used
    const { withAuth } = require('@/middleware/withAuth');
    expect(withAuth).toHaveBeenCalledWith(
      expect.any(Function),
      { requiredPermission: 'create:category' }
    );
  });
  
  it('should get categories with a valid JWT token', async () => {
    // Mock the SiteService to return the site
    const { SiteService } = require('@/services/site-service');
    SiteService.getSiteBySlug.mockResolvedValue(mockSite);
    
    // Mock the CategoryService to return categories
    const { CategoryService } = require('@/services/category-service');
    CategoryService.getCategoriesBySiteId.mockResolvedValue(mockCategories);
    
    // Mock the AuthService to validate the token
    const { AuthService } = require('@/services/auth-service');
    AuthService.validateToken.mockResolvedValue({
      userId: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category', 'create:category'],
      isValid: true
    });
    
    // Import the handler after mocking dependencies
    const { GET } = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Create a mock request with JWT token
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'Authorization': `Bearer ${validToken}` }
    );
    
    // Add auth info to request (normally done by middleware)
    (req as any).auth = {
      userId: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category', 'create:category']
    };
    
    // Call the handler
    const response = await GET(req, { params: { siteSlug: testSiteSlug } });
    
    // Verify the response is a 200 OK with categories
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe('category_1');
  });
  
  it('should create a category with a valid JWT token', async () => {
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
      tenantId: testTenantId,
      siteId: testSiteId,
      parentId: null,
      order: 1,
      createdAt: mockTimestamp,
      updatedAt: mockTimestamp,
    };
    CategoryService.createCategory.mockResolvedValue(mockCreatedCategory);
    
    // Mock the AuthService to validate the token
    const { AuthService } = require('@/services/auth-service');
    AuthService.validateToken.mockResolvedValue({
      userId: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category', 'create:category'],
      isValid: true
    });
    
    // Import the handler after mocking dependencies
    const { POST } = require('@/app/api/sites/[siteSlug]/categories/route');
    
    // Create a mock request with JWT token
    const req = mockNextRequest(
      `http://localhost:3000/api/sites/${testSiteSlug}/categories`,
      { 'Authorization': `Bearer ${validToken}` }
    );
    
    // Add auth info to request (normally done by middleware)
    (req as any).auth = {
      userId: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category', 'create:category']
    };
    
    // Add JSON body
    req.json = jest.fn().mockResolvedValue({
      name: 'New Category',
      slug: 'new-category',
      metaDescription: 'This is a new category',
    });
    
    // Call the handler
    const response = await POST(req, { params: { siteSlug: testSiteSlug } });
    
    // Verify the response is a 201 Created
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data).toEqual(mockCreatedCategory);
  });
});
