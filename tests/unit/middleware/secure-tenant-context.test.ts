/**
 * Tenant Context Middleware Tests
 * 
 * These tests verify the core functionality of the secure tenant context middleware.
 * The tests are structured to isolate dependencies and focus on specific behaviors.
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
    verify: jest.fn(),
    JwtPayload: {}
  };
});

// Silence console errors during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Now import the modules after all mocks are set up
import { NextRequest, NextResponse } from 'next/server';
import { withSecureTenantContext } from '../../../src/app/api/middleware/secureTenantContext';
import { verify } from 'jsonwebtoken';

// Define constants
const VALID_TENANT_ID = '550e8400-e29b-41d4-a716-446655440000';

describe('Secure Tenant Context Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock request
  const createMockRequest = (headers = {}) => ({
    headers: {
      get: (name) => headers[name]
    },
    url: 'https://example.com/api/resources'
  }) as unknown as NextRequest;

  it('should reject requests without tenant ID', async () => {
    // Create a request without tenant ID
    const req = createMockRequest();
    
    // Create a mock handler
    const handler = jest.fn().mockResolvedValue({});

    // Call the middleware
    const result = await withSecureTenantContext(req, handler);

    // Verify the handler was NOT called
    expect(handler).not.toHaveBeenCalled();
    
    // Verify the response is a 401 Unauthorized
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' }),
      expect.objectContaining({ status: 401 })
    );
  });

  it('should reject requests with invalid token', async () => {
    // Create a request with tenant ID but invalid token
    const req = createMockRequest({ 
      'x-tenant-id': VALID_TENANT_ID,
      'authorization': 'Bearer invalid-token' 
    });
    
    // Mock verify to throw an error for invalid token
    (verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });
    
    // Create a mock handler
    const handler = jest.fn().mockResolvedValue({});

    // Call the middleware
    const result = await withSecureTenantContext(req, handler);

    // Verify the handler was NOT called
    expect(handler).not.toHaveBeenCalled();
    
    // Verify the response is a 401 Unauthorized
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Unauthorized' }),
      expect.objectContaining({ status: 401 })
    );
  });

  it('should handle unexpected errors in the middleware', async () => {
    // Create a request with tenant ID
    const req = createMockRequest({ 
      'x-tenant-id': VALID_TENANT_ID,
      'authorization': 'Bearer valid-token' 
    });
    
    // Import TenantContext class
    const { TenantContext } = require('../../../src/app/api/middleware/secureTenantContext');
    
    // Mock TenantContext.fromRequest to return a valid context first
    // This is needed to get past the initial null check
    const mockContext = { tenantId: VALID_TENANT_ID, userId: 'user-123' };
    jest.spyOn(TenantContext, 'fromRequest').mockResolvedValueOnce(mockContext);
    
    // Mock URL constructor to throw an error
    const urlSpy = jest.spyOn(global, 'URL');
    urlSpy.mockImplementationOnce(() => {
      throw new Error('URL parsing error');
    });
    
    // Create a mock handler
    const handler = jest.fn().mockResolvedValue({});

    // Call the middleware
    const result = await withSecureTenantContext(req, handler);

    // Verify the handler was NOT called
    expect(handler).not.toHaveBeenCalled();
    
    // Verify the response is a 500 Internal Server Error
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Internal Server Error' }),
      expect.objectContaining({ status: 500 })
    );
    
    // Restore URL mock
    urlSpy.mockRestore();
  });

  it('should allow requests with valid tenant context', async () => {
    // Create a request with valid tenant ID and auth token
    const req = createMockRequest({ 
      'x-tenant-id': VALID_TENANT_ID, 
      'authorization': 'Bearer valid-token' 
    });
    
    // Import TenantContext class
    const { TenantContext } = require('../../../src/app/api/middleware/secureTenantContext');
    
    // Mock TenantContext.fromRequest to return a valid context
    const mockContext = { 
      tenantId: VALID_TENANT_ID, 
      userId: 'user-123',
      requestId: 'test-request-id',
      timestamp: 1234567890
    };
    jest.spyOn(TenantContext, 'fromRequest').mockResolvedValueOnce(mockContext);
    
    // Mock URL for path checking
    const mockUrl = new URL(`https://example.com/api/tenants/${VALID_TENANT_ID}/resources`);
    jest.spyOn(global, 'URL').mockImplementationOnce(() => mockUrl);
    
    // Create a mock handler that returns a success response
    const mockResponse = { success: true };
    const handler = jest.fn().mockResolvedValue(mockResponse);

    // Call the middleware
    const result = await withSecureTenantContext(req, handler);

    // Verify the handler was called
    expect(handler).toHaveBeenCalled();
    
    // Verify the handler was called with the request and a context object
    expect(handler).toHaveBeenCalledWith(
      req, 
      expect.objectContaining({
        tenantId: VALID_TENANT_ID,
        userId: 'user-123'
      })
    );
    
    // Verify the result is the mock response
    expect(result).toBe(mockResponse);
  });
});