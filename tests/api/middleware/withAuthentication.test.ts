import { NextRequest, NextResponse } from 'next/server';
import { withAuthentication } from '@/app/api/middleware';
import { verify } from 'jsonwebtoken';

// Mock next/server
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn().mockImplementation((body, options) => {
        return {
          status: options?.status || 200,
          body,
          headers: new Map()
        };
      }),
      next: jest.fn().mockImplementation(() => {
        return {
          status: 200,
          body: {},
          headers: new Map()
        };
      })
    }
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
    })
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
      url: 'http://localhost:3000/api/test'
    } as unknown as NextRequest;
  };

  describe('withAuthentication', () => {
    it('should reject requests without authentication header', async () => {
      const req = createMockRequest({});
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      await withAuthentication(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid auth header format', async () => {
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

      // Mock verify to throw an error
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

    it('should reject when token verification returns no user ID', async () => {
      const req = createMockRequest({ 'authorization': 'Bearer partial-token' });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock verify to return payload without userId
      (verify as jest.Mock).mockReturnValueOnce({ role: 'user' });

      await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should process requests with valid authentication', async () => {
      const req = createMockRequest({ 'authorization': 'Bearer valid-token' });
      const handlerResult = { success: true };
      const handler = jest.fn().mockResolvedValue(NextResponse.json(handlerResult));

      // Mock verify to return valid payload
      (verify as jest.Mock).mockReturnValueOnce({ userId: 'user-123' });

      const result = await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(req, 'user-123');
      expect(result).toEqual(NextResponse.json(handlerResult));
    });

    it('should handle unexpected errors gracefully', async () => {
      const req = createMockRequest({ 'authorization': 'Bearer valid-token' });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock verify to throw an unexpected error
      (verify as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      await withAuthentication(req, handler);

      expect(verify).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle unexpected errors in the handler', async () => {
      const req = createMockRequest({ 'authorization': 'Bearer valid-token' });
      
      // Force an error in the handler
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      // Mock verify to return valid payload
      (verify as jest.Mock).mockReturnValueOnce({ userId: 'user-123' });

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
