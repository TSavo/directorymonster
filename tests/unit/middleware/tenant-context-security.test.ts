/**
 * Test for Tenant Context Middleware - Success Path
 * 
 * This test focuses specifically on the successful path through the middleware
 * with a valid tenant context.
 */

// Mock dependencies first, before any imports
jest.mock('next/server', () => {
  const json = jest.fn().mockImplementation((body, options = {}) => {
    return {
      status: options.status || 200,
      body,
      json: async () => body
    };
  });
  
  return {
    NextResponse: {
      json
    },
    NextRequest: jest.fn()
  };
});

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => {
  return {
    verify: jest.fn().mockReturnValue({ userId: 'user-123' }),
    JwtPayload: {}
  };
});

// Mock uuid
jest.mock('uuid', () => {
  return {
    validate: jest.fn().mockImplementation((id) => {
      // Only validate the tenant ID as UUID, not path segments
      return id === '550e8400-e29b-41d4-a716-446655440000';
    }),
    v4: jest.fn().mockReturnValue('test-request-id')
  };
});

// Mock tenant membership service
jest.mock('@/lib/tenant-membership-service', () => {
  return {
    __esModule: true,
    default: {
      isTenantMember: jest.fn().mockResolvedValue(true)
    }
  };
});

// Mock audit service and audit action
jest.mock('@/lib/audit/audit-service', () => {
  return {
    __esModule: true,
    default: {
      logSecurityEvent: jest.fn().mockResolvedValue(undefined)
    }
  };
});

jest.mock('@/lib/audit/types', () => {
  return {
    AuditAction: {
      CROSS_TENANT_ACCESS_ATTEMPT: 'cross_tenant_access_attempt',
      UNAUTHORIZED_TENANT_ACCESS: 'unauthorized_tenant_access',
      PERMISSION_DENIED: 'permission_denied'
    }
  };
});

// Silence console logs/errors during tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

// Now import the modules after all mocks are set up
import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantContext, TenantContext } from '../../../src/app/api/middleware/secureTenantContext';
import { verify } from 'jsonwebtoken';
import { AuditAction } from '@/lib/audit/types';

// Define constants
const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = 'user-123';
const REQUEST_ID = 'test-request-id';

describe('Tenant Context Middleware Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock request with a valid URL
  const createMockRequest = (headers = {}, urlPath = `api/tenants/${VALID_TENANT_ID}/resources`) => ({
    headers: {
      get: (name) => headers[name]
    },
    url: `https://example.com/${urlPath}`,
    method: 'GET',
    clone: () => ({
      json: () => Promise.resolve({})
    })
  }) as unknown as NextRequest;

  describe('Success Path', () => {
    it('should allow requests with valid tenant context and pass context to handler', async () => {
      // ARRANGE
      // Create a request with valid tenant ID and auth token
      const req = createMockRequest({ 
        'x-tenant-id': VALID_TENANT_ID, 
        'authorization': 'Bearer valid-token' 
      });
      
      // Mock URL for path checking
      const mockUrl = {
        searchParams: {
          get: jest.fn().mockReturnValue(null)
        },
        pathname: `/api/tenants/${VALID_TENANT_ID}/resources`
      };
      
      // Mock URL constructor
      global.URL = jest.fn().mockImplementation(() => mockUrl) as any;
      
      // Create a mock response that the handler will return
      const mockResponse = { success: true, data: { message: 'Operation successful' } };
      
      // Create a handler that verifies the context and returns the mock response
      const handler = jest.fn().mockImplementation((req, context) => {
        // Return the mock response
        return mockResponse as any;
      });

      // ACT
      // Call the middleware
      const result = await withSecureTenantContext(req, handler);

      // ASSERT
      // Verify the handler was called exactly once
      expect(handler).toHaveBeenCalledTimes(1);
      
      // Verify the handler was called with the request and a context object
      expect(handler).toHaveBeenCalledWith(
        req, 
        expect.objectContaining({
          tenantId: VALID_TENANT_ID,
          userId: USER_ID
        })
      );
      
      // Verify the result is the mock response
      expect(result).toBe(mockResponse);
      
      // Verify that NextResponse.json was not called (no error response)
      expect(NextResponse.json).not.toHaveBeenCalled();
    });
  });

  describe('Security Checks', () => {
    it('should detect tenant ID mismatch in URL query parameters', async () => {
      // ARRANGE
      // Create a request with valid tenant ID and auth token
      const req = createMockRequest({ 
        'x-tenant-id': VALID_TENANT_ID, 
        'authorization': 'Bearer valid-token' 
      });
      
      // Different tenant ID for the test
      const DIFFERENT_TENANT_ID = '660f9511-f3ac-52e5-b827-557766551111';
      
      // Mock URL with a different tenant ID in query params
      const mockUrl = {
        searchParams: {
          get: jest.fn().mockImplementation((param) => {
            if (param === 'tenantId') return DIFFERENT_TENANT_ID;
            return null;
          })
        },
        pathname: `/api/resources`
      };
      
      // Mock URL constructor
      global.URL = jest.fn().mockImplementation(() => mockUrl) as any;
      
      // Create a mock handler
      const handler = jest.fn().mockImplementation((req, context) => {
        return { success: true } as any;
      });

      // Mock AuditService.logSecurityEvent
      const { default: AuditService } = require('@/lib/audit/audit-service');
      
      // ACT
      // Call the middleware
      const result = await withSecureTenantContext(req, handler);

      // ASSERT
      // Verify the handler was NOT called
      expect(handler).not.toHaveBeenCalled();
      
      // Verify that NextResponse.json was called with a 403 Forbidden
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          error: 'Cross-tenant access denied',
          message: 'Cannot access resources from another tenant'
        }),
        expect.objectContaining({ status: 403 })
      );
      
      // Verify that AuditService.logSecurityEvent was called
      expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
        USER_ID,
        VALID_TENANT_ID,
        AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
        expect.objectContaining({
          targetTenantId: DIFFERENT_TENANT_ID
        })
      );
    });
    
    it('should detect suspicious UUID in path segments', async () => {
      // ARRANGE
      // Different tenant ID for the test
      const DIFFERENT_TENANT_ID = '660f9511-f3ac-52e5-b827-557766551111';
      
      // Create a request with valid tenant ID and auth token but suspicious path
      const req = createMockRequest(
        { 
          'x-tenant-id': VALID_TENANT_ID, 
          'authorization': 'Bearer valid-token' 
        },
        `api/tenants/${DIFFERENT_TENANT_ID}/resources` // Suspicious path with different tenant ID
      );
      
      // Mock URL with a suspicious path segment
      const mockUrl = {
        searchParams: {
          get: jest.fn().mockReturnValue(null)
        },
        pathname: `/api/tenants/${DIFFERENT_TENANT_ID}/resources`
      };
      
      // Mock UUID validation to recognize both tenant IDs as valid UUIDs
      const { validate } = require('uuid');
      validate.mockImplementation((id) => {
        return id === VALID_TENANT_ID || id === DIFFERENT_TENANT_ID;
      });
      
      // Mock URL constructor
      global.URL = jest.fn().mockImplementation(() => mockUrl) as any;
      
      // Create a mock handler
      const handler = jest.fn().mockImplementation((req, context) => {
        return { success: true } as any;
      });

      // Mock AuditService.logSecurityEvent
      const { default: AuditService } = require('@/lib/audit/audit-service');
      
      // ACT
      // Call the middleware
      const result = await withSecureTenantContext(req, handler);

      // ASSERT
      // Verify the handler was NOT called
      expect(handler).not.toHaveBeenCalled();
      
      // Verify that NextResponse.json was called with a 403 Forbidden
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          error: 'Cross-tenant access denied',
          message: 'Cannot access resources from another tenant'
        }),
        expect.objectContaining({ status: 403 })
      );
      
      // Verify that AuditService.logSecurityEvent was called
      expect(AuditService.logSecurityEvent).toHaveBeenCalledWith(
        USER_ID,
        VALID_TENANT_ID,
        AuditAction.CROSS_TENANT_ACCESS_ATTEMPT,
        expect.objectContaining({
          suspiciousPathSegment: DIFFERENT_TENANT_ID
        })
      );
    });
  });
  
  describe('Error Handling', () => {
    it('should handle unexpected errors and return 500 response', async () => {
      // ARRANGE
      // Create a request with valid tenant ID and auth token
      const req = createMockRequest({ 
        'x-tenant-id': VALID_TENANT_ID, 
        'authorization': 'Bearer valid-token' 
      });
      
      // Create a mock context
      const mockContext = new TenantContext(VALID_TENANT_ID, USER_ID);
      
      // Mock TenantContext.fromRequest to return our mock context
      jest.spyOn(TenantContext, 'fromRequest').mockResolvedValue(mockContext);
      
      // Mock URL constructor to throw an error
      const mockError = new Error('Unexpected middleware error');
      global.URL = jest.fn().mockImplementation(() => {
        throw mockError;
      }) as any;
      
      // Create a mock handler
      const handler = jest.fn().mockImplementation((req, context) => {
        return { success: true } as any;
      });
      
      // ACT
      // Call the middleware
      const result = await withSecureTenantContext(req, handler);
      
      // ASSERT
      // Verify the handler was NOT called
      expect(handler).not.toHaveBeenCalled();
      
      // Verify that NextResponse.json was called with a 500 Internal Server Error
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          error: 'Internal Server Error',
          message: 'An error occurred while processing your request'
        }),
        expect.objectContaining({ status: 500 })
      );
    });
  });
});