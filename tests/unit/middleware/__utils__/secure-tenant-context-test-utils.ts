/**
 * Shared utilities for secure tenant context middleware tests
 */

import { NextRequest } from 'next/server';
import { mockNextResponseJson } from '../../../../tests/mocks/next/response';
import { createMockNextRequest } from '../../../../tests/mocks/next/request';

// Common test data
export const TEST_DATA = {
  validTenantId: '550e8400-e29b-41d4-a716-446655440000',
  differentTenantId: '650e8400-e29b-41d4-a716-446655440001',
  userId: 'user-123',
  requestId: '750e8400-e29b-41d4-a716-446655440002'
};

// Mock functions
export const mockValidateUuid = jest.fn(() => true);
export const mockUuidV4 = jest.fn(() => TEST_DATA.requestId);
export const mockVerify = jest.fn(() => ({ userId: TEST_DATA.userId }));
export const mockDetectCrossTenantAccess = jest.fn(() => false);
export const mockIsTenantMember = jest.fn().mockResolvedValue(true);
export const mockHasPermission = jest.fn().mockResolvedValue(true);
export const mockLogSecurityEvent = jest.fn().mockResolvedValue(undefined);

// URL search params mock
export const mockURLSearchParams = new Map();

/**
 * Create a mock tenant context class for testing
 */
export class MockTenantContext {
  tenantId: string;
  userId: string;
  requestId: string;
  timestamp: number;
  
  constructor(tenantId: string, userId: string) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.requestId = TEST_DATA.requestId;
    this.timestamp = Date.now();
  }
  
  static async fromRequest(req: NextRequest): Promise<MockTenantContext | null> {
    const tenantId = req.headers.get('x-tenant-id');
    if (!tenantId) return null;
    return new MockTenantContext(tenantId, TEST_DATA.userId);
  }
}

/**
 * Create a standardized mock request for testing
 */
export function createSecurityTestRequest(options: {
  tenantId?: string;
  auth?: string;
  url?: string;
  method?: string;
  body?: any;
} = {}): NextRequest {
  const headers: Record<string, string> = {
    'x-tenant-id': options.tenantId || TEST_DATA.validTenantId,
    'authorization': options.auth || 'Bearer valid-token'
  };
  
  return createMockNextRequest({
    url: options.url || `https://example.com/api/tenants/${options.tenantId || TEST_DATA.validTenantId}/resources`,
    headers,
    method: options.method || 'POST'
  });
}

/**
 * Create a handler mock that returns tenant ID in response
 */
export function createSecurityHandlerMock(returnValue = { success: true }) {
  return jest.fn().mockImplementation((req, context) => {
    return mockNextResponseJson({
      ...returnValue,
      tenantId: context?.tenantId
    });
  });
}

/**
 * Create a standardized middleware mock
 */
export function createSecurityMiddlewareMock() {
  let mockResponseStatus = 200;
  let mockResponseBody = { success: true };
  
  const setMockResponse = (status: number, body: any) => {
    mockResponseStatus = status;
    mockResponseBody = body;
  };
  
  const resetMockResponse = () => {
    mockResponseStatus = 200;
    mockResponseBody = { success: true };
  };
  
  const middleware = {
    withSecureTenantContext: jest.fn().mockImplementation(async (req, handler) => {
      const context = await MockTenantContext.fromRequest(req);
      
      if (!context) {
        return mockNextResponseJson(
          { error: 'Unauthorized', message: 'Invalid tenant context' }, 
          { status: 401 }
        );
      }
      
      // If this is a test with a custom response, return it
      if (mockResponseStatus !== 200) {
        return mockNextResponseJson(
          mockResponseBody,
          { status: mockResponseStatus }
        );
      }
      
      return handler(req, context);
    }),
    
    withSecureTenantPermission: jest.fn().mockImplementation(async (req, resourceType, permission, handler, resourceId) => {
      // For the valid test case, use status 200
      if (mockResponseStatus === 200) {
        const context = await MockTenantContext.fromRequest(req);
        if (!context) {
          return mockNextResponseJson(
            { error: 'Unauthorized', message: 'Invalid tenant context' }, 
            { status: 401 }
          );
        }
        return handler(req, context);
      } 
      // For the invalid test case, use the status we've set
      else {
        return mockNextResponseJson(
          mockResponseBody,
          { status: mockResponseStatus }
        );
      }
    }),
    
    TenantContext: MockTenantContext,
    
    // Control methods
    setMockResponse,
    resetMockResponse
  };
  
  return middleware;
}