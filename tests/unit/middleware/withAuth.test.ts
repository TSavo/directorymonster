import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';

// Mock the AuthService
jest.mock('@/services/auth-service', () => ({
  AuthService: {
    validateToken: jest.fn(),
    hasPermission: jest.fn(),
  },
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

// Create a mock handler function
const mockHandler = jest.fn().mockImplementation(() => {
  return NextResponse.json({ success: true });
});

describe('withAuth middleware', () => {
  const testUserId = 'user_123';
  const testTenantId = 'tenant_456';

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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should call the handler if token is valid', async () => {
    // Import the middleware after mocking dependencies
    const { withAuth } = require('@/middleware/withAuth');

    // Mock the AuthService to return a valid token
    const { AuthService } = require('@/services/auth-service');
    AuthService.validateToken.mockResolvedValue({
      userId: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category', 'create:category'],
      isValid: true
    });

    // Create a request with a valid token
    const req = mockNextRequest('http://localhost:3000/api/test', {
      'Authorization': `Bearer ${validToken}`
    });

    // Create a handler with the middleware
    const handler = withAuth(mockHandler);

    // Call the handler
    await handler(req, { params: {} });

    // Verify the AuthService was called with the token
    expect(AuthService.validateToken).toHaveBeenCalledWith(validToken);

    // Verify the handler was called with the request and user info
    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        auth: {
          userId: testUserId,
          tenantId: testTenantId,
          permissions: ['read:category', 'create:category']
        }
      }),
      { params: {} }
    );
  });

  it('should return 401 if no token is provided', async () => {
    // Import the middleware after mocking dependencies
    const { withAuth } = require('@/middleware/withAuth');

    // Mock the AuthService to return an invalid token
    const { AuthService } = require('@/services/auth-service');
    AuthService.validateToken.mockResolvedValue({
      isValid: false,
      error: 'No token provided'
    });

    // Create a request without a token
    const req = mockNextRequest('http://localhost:3000/api/test');

    // Create a handler with the middleware
    const handler = withAuth(mockHandler);

    // Call the handler
    const response = await handler(req, { params: {} });

    // Verify the AuthService was called with null
    expect(AuthService.validateToken).toHaveBeenCalledWith(null);

    // Verify the handler was not called
    expect(mockHandler).not.toHaveBeenCalled();

    // Verify the response is a 401 Unauthorized
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'No token provided' });
  });

  it('should return 401 if token is invalid', async () => {
    // Import the middleware after mocking dependencies
    const { withAuth } = require('@/middleware/withAuth');

    // Mock the AuthService to return an invalid token
    const { AuthService } = require('@/services/auth-service');
    AuthService.validateToken.mockResolvedValue({
      isValid: false,
      error: 'Invalid token'
    });

    // Create a request with an invalid token
    const req = mockNextRequest('http://localhost:3000/api/test', {
      'Authorization': 'Bearer invalid-token'
    });

    // Create a handler with the middleware
    const handler = withAuth(mockHandler);

    // Call the handler
    const response = await handler(req, { params: {} });

    // Verify the AuthService was called with the token
    expect(AuthService.validateToken).toHaveBeenCalledWith('invalid-token');

    // Verify the handler was not called
    expect(mockHandler).not.toHaveBeenCalled();

    // Verify the response is a 401 Unauthorized
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Invalid token' });
  });

  it('should return 401 if token is expired', async () => {
    // Import the middleware after mocking dependencies
    const { withAuth } = require('@/middleware/withAuth');

    // Mock the AuthService to return an expired token
    const { AuthService } = require('@/services/auth-service');
    AuthService.validateToken.mockResolvedValue({
      isValid: false,
      error: 'Token expired'
    });

    // Create a request with an expired token
    const req = mockNextRequest('http://localhost:3000/api/test', {
      'Authorization': 'Bearer expired-token'
    });

    // Create a handler with the middleware
    const handler = withAuth(mockHandler);

    // Call the handler
    const response = await handler(req, { params: {} });

    // Verify the AuthService was called with the token
    expect(AuthService.validateToken).toHaveBeenCalledWith('expired-token');

    // Verify the handler was not called
    expect(mockHandler).not.toHaveBeenCalled();

    // Verify the response is a 401 Unauthorized
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data).toEqual({ error: 'Token expired' });
  });

  it('should support requiring specific permissions', async () => {
    // Import the middleware after mocking dependencies
    const { withAuth } = require('@/middleware/withAuth');

    // Mock the AuthService
    const { AuthService } = require('@/services/auth-service');
    AuthService.validateToken.mockResolvedValue({
      userId: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category'],
      isValid: true
    });
    AuthService.hasPermission.mockImplementation((token, permission) => {
      return Promise.resolve(permission === 'read:category');
    });

    // Create a request with a valid token
    const req = mockNextRequest('http://localhost:3000/api/test', {
      'Authorization': `Bearer ${validToken}`
    });

    // Create a handler with the middleware requiring 'read:category' permission
    const handlerWithReadPermission = withAuth(mockHandler, { requiredPermission: 'read:category' });

    // Call the handler
    await handlerWithReadPermission(req, { params: {} });

    // Verify the handler was called
    expect(mockHandler).toHaveBeenCalled();

    // Reset mocks
    mockHandler.mockClear();

    // Create a handler with the middleware requiring 'delete:category' permission
    const handlerWithDeletePermission = withAuth(mockHandler, { requiredPermission: 'delete:category' });

    // Call the handler
    const response = await handlerWithDeletePermission(req, { params: {} });

    // Verify the handler was not called
    expect(mockHandler).not.toHaveBeenCalled();

    // Verify the response is a 403 Forbidden
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data).toEqual({ error: 'Permission denied' });
  });
});
