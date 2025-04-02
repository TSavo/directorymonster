/**
 * API Tenant Isolation Tests
 * 
 * This test suite verifies that API endpoints properly enforce tenant isolation
 * and prevent cross-tenant access attempts.
 */

import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

// Mock services
jest.mock('../../src/lib/tenant-membership-service', () => ({
  __esModule: true,
  default: {
    isTenantMember: jest.fn()
  }
}));

jest.mock('../../src/lib/role-service', () => ({
  __esModule: true,
  default: {
    hasPermission: jest.fn()
  }
}));

// Create NextResponse.json mock
jest.mock('next/server', () => {
  const originalModule = jest.requireActual('next/server');
  return {
    ...originalModule,
    NextResponse: {
      ...originalModule.NextResponse,
      json: jest.fn((body, opts) => ({
        status: opts?.status || 200,
        body,
        headers: new Map()
      }))
    }
  };
});

// Import services and middleware after mocking
import TenantMembershipService from '@/lib/tenant-membership-service';
import RoleService from '@/lib/role-service';
import { withTenantAccess } from '@/middleware/tenant-validation';

// Test data
const tenant1Id = 'tenant-1';
const tenant2Id = 'tenant-2';
const userId = 'user-123';
const JWT_SECRET = 'test-jwt-secret';

// Setup environment
process.env.JWT_SECRET = JWT_SECRET;

describe('API Tenant Isolation', () => {
  // Reset all mocks before each test
  beforeEach(() => {
    jest.resetAllMocks();
    
    // Default mock implementation for TenantMembershipService
    (TenantMembershipService.isTenantMember as jest.Mock).mockImplementation(
      (testUserId, testTenantId) => {
        // User is a member of tenant1 but not tenant2
        return Promise.resolve(testTenantId === tenant1Id && testUserId === userId);
      }
    );
    
    // Default mock implementation for RoleService
    (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);
    
    // Reset NextResponse.json mock
    (NextResponse.json as jest.Mock).mockImplementation((body, opts) => ({
      status: opts?.status || 200,
      body,
      headers: new Map()
    }));
  });
  
  // Create a valid JWT token for testing
  const createToken = (userId: string, expiresIn = '1h') => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn });
  };
  
  // Create a Next.js request with specified headers
  const createNextRequest = (
    method: string = 'GET',
    url: string = 'http://example.com/api/test',
    headers: Record<string, string> = {}
  ): NextRequest => {
    const headersObj = new Headers();
    Object.entries(headers).forEach(([key, value]) => {
      headersObj.set(key, value);
    });
    
    return {
      method,
      url,
      headers: headersObj,
      nextUrl: new URL(url)
    } as unknown as NextRequest;
  };
  
  /**
   * Test: withTenantAccess middleware should allow access when user is a member of the tenant
   */
  test('withTenantAccess allows access when user is a tenant member', async () => {
    // Create a valid token for our user
    const token = createToken(userId);
    
    // Create a Next.js request with tenant1 headers
    const req = createNextRequest('GET', 'http://example.com/api/test', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': tenant1Id
    });
    
    // Mock the handler function
    const handler = jest.fn().mockResolvedValue({
      status: 200,
      body: { success: true },
      headers: new Map()
    });
    
    // Call the middleware with our request and handler
    const result = await withTenantAccess(req, handler);
    
    // Check that TenantMembershipService was called correctly
    expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenant1Id);
    
    // Check that the handler was called
    expect(handler).toHaveBeenCalled();
    
    // Check that the response was passed through
    expect(result).toEqual({
      status: 200,
      body: { success: true },
      headers: new Map()
    });
  });
  
  /**
   * Test: withTenantAccess middleware should deny access when user is not a member of the tenant
   */
  test('withTenantAccess denies access when user is not a tenant member', async () => {
    // Create a valid token for our user
    const token = createToken(userId);
    
    // Create a Next.js request with tenant2 headers
    const req = createNextRequest('GET', 'http://example.com/api/test', {
      'authorization': `Bearer ${token}`,
      'x-tenant-id': tenant2Id
    });
    
    // Mock the handler function
    const handler = jest.fn().mockResolvedValue({
      status: 200,
      body: { success: true },
      headers: new Map()
    });
    
    // Call the middleware with our request and handler
    const result = await withTenantAccess(req, handler);
    
    // Check that TenantMembershipService was called correctly
    expect(TenantMembershipService.isTenantMember).toHaveBeenCalledWith(userId, tenant2Id);
    
    // Check that the handler was NOT called
    expect(handler).not.toHaveBeenCalled();
    
    // Check that NextResponse.json was called with error and 403 status
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Access denied: User is not a member of this tenant' },
      { status: 403 }
    );
  });
  
  /**
   * Test: withTenantAccess middleware should return 401 when no auth token is provided
   */
  test('withTenantAccess returns 401 when no auth token is provided', async () => {
    // Create a Next.js request with tenant headers but no auth
    const req = createNextRequest('GET', 'http://example.com/api/test', {
      'x-tenant-id': tenant1Id
    });
    
    // Mock the handler function
    const handler = jest.fn().mockResolvedValue({
      status: 200,
      body: { success: true },
      headers: new Map()
    });
    
    // Call the middleware with our request and handler
    const result = await withTenantAccess(req, handler);
    
    // Check that the handler was NOT called
    expect(handler).not.toHaveBeenCalled();
    
    // Check that NextResponse.json was called with error and 401 status
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Missing tenant context or authentication' },
      { status: 401 }
    );
  });
  
  /**
   * Test: withTenantAccess middleware should return 401 when auth token is invalid
   */
  test('withTenantAccess returns 401 when auth token is invalid', async () => {
    // Create a Next.js request with tenant headers but invalid token
    const req = createNextRequest('GET', 'http://example.com/api/test', {
      'authorization': 'Bearer invalid-token',
      'x-tenant-id': tenant1Id
    });
    
    // Mock the handler function
    const handler = jest.fn().mockResolvedValue({
      status: 200,
      body: { success: true },
      headers: new Map()
    });
    
    // Call the middleware with our request and handler
    const result = await withTenantAccess(req, handler);
    
    // Check that the handler was NOT called
    expect(handler).not.toHaveBeenCalled();
    
    // Check that NextResponse.json was called with error and 401 status
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Invalid or expired authentication token' },
      { status: 401 }
    );
  });
  
  /**
   * Test: withTenantAccess middleware should return 401 when no tenant ID is provided
   */
  test('withTenantAccess returns 401 when no tenant ID is provided', async () => {
    // Create a valid token for our user
    const token = createToken(userId);
    
    // Create a Next.js request with auth but no tenant header
    const req = createNextRequest('GET', 'http://example.com/api/test', {
      'authorization': `Bearer ${token}`
    });
    
    // Mock the handler function
    const handler = jest.fn().mockResolvedValue({
      status: 200,
      body: { success: true },
      headers: new Map()
    });
    
    // Call the middleware with our request and handler
    const result = await withTenantAccess(req, handler);
    
    // Check that the handler was NOT called
    expect(handler).not.toHaveBeenCalled();
    
    // Check that NextResponse.json was called with error and 401 status
    expect(NextResponse.json).toHaveBeenCalledWith(
      { error: 'Missing tenant context or authentication' },
      { status: 401 }
    );
  });
});