import { NextRequest, NextResponse } from 'next/server';
import { apiTokenHandler } from '../apiTokenHandler';
import { ApiTokenError } from '@/lib/errors/api-token-error';

describe('apiTokenHandler middleware', () => {
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
  });
  
  it('should handle missing API token', async () => {
    // Mock handler to throw ApiTokenError
    mockHandler.mockImplementationOnce(() => {
      throw new ApiTokenError('Missing API token');
    });
    
    // Call the middleware
    const response = await apiTokenHandler(mockRequest, mockHandler);
    
    // Verify handler was called
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    
    // Verify error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
        message: 'Missing API token'
      }),
      expect.objectContaining({
        status: 401
      })
    );
    
    // Verify the response
    expect(response).toBe(mockJsonResponse);
  });
  
  it('should handle invalid API token', async () => {
    // Mock handler to throw ApiTokenError
    mockHandler.mockImplementationOnce(() => {
      throw new ApiTokenError('Invalid API token');
    });
    
    // Call the middleware
    const response = await apiTokenHandler(mockRequest, mockHandler);
    
    // Verify handler was called
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    
    // Verify error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
        message: 'Invalid API token'
      }),
      expect.objectContaining({
        status: 401
      })
    );
    
    // Verify the response
    expect(response).toBe(mockJsonResponse);
  });
  
  it('should handle expired API token', async () => {
    // Mock handler to throw ApiTokenError
    mockHandler.mockImplementationOnce(() => {
      throw new ApiTokenError('API token expired');
    });
    
    // Call the middleware
    const response = await apiTokenHandler(mockRequest, mockHandler);
    
    // Verify handler was called
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    
    // Verify error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Unauthorized',
        message: 'API token expired'
      }),
      expect.objectContaining({
        status: 401
      })
    );
    
    // Verify the response
    expect(response).toBe(mockJsonResponse);
  });
  
  it('should pass through other errors', async () => {
    // Mock handler to throw a different error
    mockHandler.mockImplementationOnce(() => {
      throw new Error('Some other error');
    });
    
    // Call the middleware and expect it to throw
    await expect(apiTokenHandler(mockRequest, mockHandler)).rejects.toThrow('Some other error');
    
    // Verify handler was called
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    
    // Verify NextResponse.json was not called
    expect(NextResponse.json).not.toHaveBeenCalled();
  });
  
  it('should pass through successful responses', async () => {
    // Mock handler to return a successful response
    const successResponse = NextResponse.json({ success: true });
    mockHandler.mockResolvedValueOnce(successResponse);
    
    // Call the middleware
    const response = await apiTokenHandler(mockRequest, mockHandler);
    
    // Verify handler was called
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
    
    // Verify the response was passed through
    expect(response).toBe(successResponse);
  });
});
