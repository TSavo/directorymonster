import { NextRequest, NextResponse } from 'next/server';
import { GET } from '../route';
import { withSecureApiToken } from '@/app/api/middleware/withSecureApiToken';

// Mock the withSecureApiToken middleware
jest.mock('@/app/api/middleware/withSecureApiToken');

describe('Secure Endpoint', () => {
  // Mock request
  const mockRequest = {
    headers: new Headers(),
    cookies: {
      get: jest.fn()
    }
  } as unknown as NextRequest;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock withSecureApiToken to call the handler with user headers
    (withSecureApiToken as jest.Mock).mockImplementation((req, handler) => {
      // Add user headers
      req.headers.set('x-user-id', 'user-123');
      req.headers.set('x-user-name', 'Test User');
      req.headers.set('x-user-email', 'test@example.com');
      req.headers.set('x-user-role', 'admin');

      // Call the handler
      return handler(req);
    });
  });

  it('should return user information from headers', async () => {
    // Call the endpoint
    const response = await GET(mockRequest);

    // Verify withSecureApiToken was called
    expect(withSecureApiToken).toHaveBeenCalledWith(mockRequest, expect.any(Function));

    // Verify the response
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      success: true,
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'admin'
      }
    });
  });

  it('should handle missing user information', async () => {
    // Mock withSecureApiToken to call the handler without user headers
    (withSecureApiToken as jest.Mock).mockImplementation((req, handler) => {
      // Create a new request with only user ID
      const newReq = {
        ...req,
        headers: new Headers()
      };
      newReq.headers.set('x-user-id', 'user-123');

      // Call the handler with the new request
      return handler(newReq);
    });

    // Call the endpoint
    const response = await GET(mockRequest);

    // Verify withSecureApiToken was called
    expect(withSecureApiToken).toHaveBeenCalledWith(mockRequest, expect.any(Function));

    // Verify the response
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      success: true,
      user: {
        id: 'user-123',
        name: null,
        email: null,
        role: null
      }
    });
  });
});
