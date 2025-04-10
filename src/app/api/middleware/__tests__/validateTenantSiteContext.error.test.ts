import { NextRequest, NextResponse } from 'next/server';
import { validateTenantSiteContext } from '../validateTenantSiteContext';
import { withTenantSiteContext } from '../withTenantSiteContext';

// Mock the withTenantSiteContext middleware
jest.mock('../withTenantSiteContext');

describe('validateTenantSiteContext middleware error handling', () => {
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
  
  it('should handle errors thrown by withTenantSiteContext', async () => {
    // Mock withTenantSiteContext to throw an error
    (withTenantSiteContext as jest.Mock).mockRejectedValueOnce(
      new Error('Test error in withTenantSiteContext')
    );
    
    // Call the middleware
    const response = await validateTenantSiteContext(mockRequest, mockHandler);
    
    // Verify withTenantSiteContext was called
    expect(withTenantSiteContext).toHaveBeenCalledWith(mockRequest, expect.any(Function));
    
    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Verify error response
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Error processing tenant-site context'
      }),
      expect.objectContaining({
        status: 500
      })
    );
    
    // Verify the response
    expect(response).toBe(mockJsonResponse);
  });
});
