import { NextRequest, NextResponse } from 'next/server';
import { withSecureApiToken } from '../withSecureApiToken';
import { withApiToken } from '../withApiToken';
import { apiTokenHandler } from '../apiTokenHandler';
import { ApiTokenError } from '@/lib/errors/api-token-error';

// Mock the withApiToken and apiTokenHandler middlewares
jest.mock('../withApiToken');
jest.mock('../apiTokenHandler');

describe('withSecureApiToken middleware', () => {
  // Mock request and handler
  const mockRequest = {
    headers: new Headers(),
    cookies: {
      get: jest.fn()
    }
  } as unknown as NextRequest;

  const mockHandler = jest.fn().mockResolvedValue(
    NextResponse.json({ success: true })
  );

  // Mock NextResponse.json
  const mockJsonResponse = { status: 0, json: {} };
  jest.spyOn(NextResponse, 'json').mockImplementation((json, options) => {
    mockJsonResponse.json = json;
    mockJsonResponse.status = options?.status || 200;
    return mockJsonResponse as unknown as NextResponse;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock apiTokenHandler to pass through to the handler
    (apiTokenHandler as jest.Mock).mockImplementation((req, handler) => handler(req));

    // Mock withApiToken to pass through to the handler
    (withApiToken as jest.Mock).mockImplementation((req, handler) => handler(req));
  });

  it('should call withApiToken and apiTokenHandler in the correct order', async () => {
    // Call the middleware
    await withSecureApiToken(mockRequest, mockHandler);

    // Verify apiTokenHandler was called with the request and a function
    expect(apiTokenHandler).toHaveBeenCalledWith(
      mockRequest,
      expect.any(Function)
    );

    // Verify withApiToken was called with the request and the handler
    expect(withApiToken).toHaveBeenCalledWith(
      mockRequest,
      mockHandler
    );

    // Verify handler was called with the request
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
  });

  it('should handle ApiTokenError from withApiToken', async () => {
    // Mock withApiToken to throw an ApiTokenError
    (withApiToken as jest.Mock).mockRejectedValue(new ApiTokenError('Missing API token'));

    // Mock apiTokenHandler to handle the error
    (apiTokenHandler as jest.Mock).mockImplementation(async (req, handler) => {
      try {
        return await handler(req);
      } catch (error) {
        if (error instanceof ApiTokenError) {
          return NextResponse.json(
            { error: 'Unauthorized', message: error.message },
            { status: 401 }
          );
        }
        throw error;
      }
    });

    // Call the middleware
    const response = await withSecureApiToken(mockRequest, mockHandler);

    // Verify withApiToken was called
    expect(withApiToken).toHaveBeenCalled();

    // Verify apiTokenHandler was called
    expect(apiTokenHandler).toHaveBeenCalled();

    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();

    // Verify the response is a NextResponse
    expect(response).toEqual(expect.any(Object));
    expect(response.status).toBe(401);
  });
});
