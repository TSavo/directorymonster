/**
 * Shared utilities for tenant validation middleware tests
 */

import { NextRequest } from 'next/server';
import { createMockNextRequest } from '../../../../tests/mocks/next/request';
import { mockNextResponseJson } from '../../../../tests/mocks/next/response';

// Common test data
export const TEST_DATA = {
  tenantId: 'tenant-123',
  userId: 'user-789',
  token: 'valid-token',
};

// Create mock functions that can be shared across tests
export const mockJwtVerify = jest.fn(() => ({ userId: TEST_DATA.userId }));
export const mockIsTenantMember = jest.fn().mockResolvedValue(true);
export const mockHasPermission = jest.fn().mockResolvedValue(true);
export const mockGetTenantByHostname = jest.fn().mockResolvedValue({ 
  id: TEST_DATA.tenantId, 
  name: 'Test Tenant'
});

/**
 * Create a standardized mock request for testing
 */
export function createStandardTestRequest(options?: {
  includeAuth?: boolean;
  includeTenantId?: boolean;
  invalidToken?: boolean;
  hostname?: string;
}): NextRequest {
  const opts = {
    includeAuth: true,
    includeTenantId: true,
    invalidToken: false,
    hostname: 'example.com',
    ...options
  };

  const headers: Record<string, string> = {};
  
  if (opts.includeAuth) {
    headers.authorization = `Bearer ${opts.invalidToken ? 'invalid-token' : TEST_DATA.token}`;
  }
  
  if (opts.includeTenantId) {
    headers['x-tenant-id'] = TEST_DATA.tenantId;
  }

  return createMockNextRequest({
    url: `https://${opts.hostname}/api/test`,
    headers,
    method: 'GET'
  });
}

/**
 * Create a success handler that can be reused in tests
 */
export function createSuccessHandler() {
  return jest.fn().mockResolvedValue(
    mockNextResponseJson({ success: true })
  );
}

/**
 * Create a standardized middleware mock implementation
 */
export function createStandardizedMiddlewareMock() {
  return {
    withTenantAccess: jest.fn().mockImplementation(async (req, handler) => {
      // Extract values from headers
      const tenantId = req.headers.get('x-tenant-id');
      const authHeader = req.headers.get('authorization');
      
      // Explicitly check for the test conditions
      if (!tenantId || !authHeader) {
        return mockNextResponseJson(
          { error: 'Missing tenant context or authentication' }, 
          { status: 401 }
        );
      }
      
      // Extract token and validate
      if (authHeader !== `Bearer ${TEST_DATA.token}`) {
        return mockNextResponseJson(
          { error: 'Invalid or expired authentication token' }, 
          { status: 401 }
        );
      }
      
      // Check tenant membership
      const isMember = await mockIsTenantMember(TEST_DATA.userId, tenantId);
      
      if (!isMember) {
        return mockNextResponseJson(
          { error: 'Access denied: User is not a member of this tenant' }, 
          { status: 403 }
        );
      }
      
      // Allow access
      return handler(req);
    }),
    
    withPermission: jest.fn().mockImplementation(async (req, resourceType, permission, resourceId, handler) => {
      // First check tenant access
      const tenantId = req.headers.get('x-tenant-id');
      
      // Check if user has tenant access
      const isMember = await mockIsTenantMember(TEST_DATA.userId, tenantId);
      if (!isMember) {
        return mockNextResponseJson(
          { error: 'Access denied: User is not a member of this tenant' }, 
          { status: 403 }
        );
      }
      
      // Check if user has the required permission
      const hasPermission = await mockHasPermission(
        TEST_DATA.userId,
        tenantId,
        resourceType,
        permission,
        resourceId
      );
      
      if (!hasPermission) {
        return mockNextResponseJson(
          { error: `Permission denied: Required ${permission} permission for ${resourceType}` }, 
          { status: 403 }
        );
      }
      
      // Allow access
      return handler(req);
    }),
    
    withTenantContext: jest.fn().mockImplementation(async (req, handler) => {
      // Get hostname
      const hostname = req.headers.get('x-forwarded-host') || req.nextUrl?.hostname || '';
      
      // Get tenant ID from hostname
      const tenant = await mockGetTenantByHostname(hostname);
      
      if (!tenant) {
        return mockNextResponseJson(
          { error: `Invalid tenant hostname: ${hostname}` }, 
          { status: 404 }
        );
      }
      
      // Clone request and add tenant ID header
      const clonedRequest = createMockNextRequest({
        url: req.url,
        method: req.method,
        headers: {}
      });
      
      // Copy all original headers
      req.headers.forEach((value, key) => {
        clonedRequest.headers.set(key, value);
      });
      
      // Add the tenant ID header
      clonedRequest.headers.set('x-tenant-id', tenant.id);
      
      // Proceed with the enhanced request
      return handler(clonedRequest);
    })
  };
}