import { NextRequest, NextResponse } from 'next/server';
import { withAuthentication } from '@/app/api/middleware';
import { verify, JwtPayload } from 'jsonwebtoken';

// Mock next/server
jest.mock('next/server', () => {
  const mockJsonResponse = jest.fn().mockImplementation((body, options) => {
    return {
      status: options?.status || 200,
      body,
      headers: new Map(),
      json: jest.fn().mockResolvedValue(body)
    };
  });
  
  return {
    NextResponse: {
      json: mockJsonResponse,
      next: jest.fn().mockImplementation(() => {
        return {
          status: 200,
          body: {},
          headers: new Map(),
          json: jest.fn().mockResolvedValue({})
        };
      })
    },
    NextRequest: jest.fn().mockImplementation((url, init) => {
      return {
        url,
        headers: init?.headers || new Headers(),
        method: init?.method || 'GET',
        body: init?.body,
        redirect: init?.redirect,
        signal: init?.signal
      };
    })
  };
});

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => {
  return {
    verify: jest.fn().mockImplementation((token, secret) => {
      if (token === 'valid-token') {
        return { userId: 'user-123' };
      }
      throw new Error('Invalid token');
    }),
    JwtPayload: {}
  };
});

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock NextRequest
  const createMockRequest = (headers: Record<string, string>) => {
    return {
      headers: {
        get: jest.fn().mockImplementation((name) => headers[name] || null),
      },
      url: 'http://localhost:3000/api/test',
      clone: jest.fn().mockReturnThis()
    } as unknown as NextRequest;
  };

  describe('withAuthentication', () => {
    it('should reject requests without authentication', async () => {
      const req = createMockRequest({});
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      await withAuthentication(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token format', async () => {
      const req = createMockRequest({ 'authorization': 'InvalidFormat' });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      await withAuthentication(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token', async () => {
      const req = createMockRequest({ 'authorization': 'Bearer invalid-token' });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock verify to throw for this test
      (verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow requests with valid token', async () => {
      const req = createMockRequest({ 'authorization': 'Bearer valid-token' });
      const handlerResult = { success: true };
      const mockResponse = { status: 200, body: handlerResult, headers: new Map(), json: jest.fn() };
      const handler = jest.fn().mockResolvedValue(mockResponse);

      // Make the verify mock return a valid user ID for this test
      (verify as jest.Mock).mockReturnValueOnce({ userId: 'user-123' });

      const result = await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(req, 'user-123');
      // Check that the result is the mockResponse
      expect(result).toBe(mockResponse);
    });

    it('should handle unexpected errors in the handler', async () => {
      const req = createMockRequest({ 'authorization': 'Bearer valid-token' });
      
      // Mock verify to return a valid token for this test
      (verify as jest.Mock).mockReturnValueOnce({ userId: 'user-123' });

      // Mock the handler to throw an error
      const handlerError = new Error('Unexpected error');
      const handler = jest.fn().mockImplementation(() => {
        throw handlerError;
      });

      await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(req, 'user-123');
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Authentication failed' }),
        expect.objectContaining({ status: 500 })
      );
    });
  });
});