/**
 * Authentication Middleware Tests
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuthentication } from '../../../src/app/api/middleware/withAuthentication';
import { verify } from 'jsonwebtoken';

// Import standardized constants
import {
  VALID_TOKEN,
  INVALID_TOKEN,
  DEFAULT_USER_ID
} from '../../../tests/mocks/lib/auth/jwt';

// Direct mocks to avoid circular dependencies
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

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock request
  const createMockRequest = (headers = {}) => ({
    headers: {
      get: (name) => headers[name]
    }
  }) as unknown as NextRequest;

  describe('withAuthentication', () => {
    it('should reject requests without authentication', async () => {
      // Create a request without authorization header
      const req = createMockRequest({ 'authorization': undefined });
      
      const handler = jest.fn().mockResolvedValue({});

      await withAuthentication(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token format', async () => {
      // Create a request with invalid token format
      const req = createMockRequest({ 'authorization': 'InvalidFormat' });
      
      const handler = jest.fn().mockResolvedValue({});

      await withAuthentication(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token', async () => {
      // Create a request with invalid token
      const req = createMockRequest({ 'authorization': `Bearer ${INVALID_TOKEN}` });
      
      // Mock verify to throw an error for invalid token
      (verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      const handler = jest.fn().mockResolvedValue({});

      await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow requests with valid token', async () => {
      // Create a request with valid token
      const req = createMockRequest({ 'authorization': `Bearer ${VALID_TOKEN}` });
      
      // Mock verify to return a valid user ID
      (verify as jest.Mock).mockReturnValueOnce({ userId: DEFAULT_USER_ID });
      
      const mockResponse = { success: true };
      const handler = jest.fn().mockResolvedValue(mockResponse);

      const result = await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(req, DEFAULT_USER_ID);
      expect(result).toBe(mockResponse);
    });

    it('should handle unexpected errors in the handler', async () => {
      // Create a request with valid token
      const req = createMockRequest({ 'authorization': `Bearer ${VALID_TOKEN}` });
      
      // Mock verify to return a valid user ID
      (verify as jest.Mock).mockReturnValueOnce({ userId: DEFAULT_USER_ID });
      
      // Mock the handler to throw an error
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(req, DEFAULT_USER_ID);
      
      // The implementation should return an "Invalid token" error with a 401 status
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
    });
  });
});