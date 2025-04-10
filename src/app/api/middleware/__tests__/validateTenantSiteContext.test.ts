import { NextRequest, NextResponse } from 'next/server';
import { validateTenantSiteContext } from '../validateTenantSiteContext';
import { withTenantSiteContext } from '../withTenantSiteContext';

// Mock the withTenantSiteContext middleware
jest.mock('../withTenantSiteContext', () => ({
  withTenantSiteContext: jest.fn()
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url,
    headers: options?.headers || new Headers(),
    method: 'GET'
  })),
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
    next: jest.fn(() => ({ type: 'next' }))
  }
}));

describe('validateTenantSiteContext', () => {
  // Setup variables
  let mockRequest: NextRequest;
  let mockHandler: jest.Mock;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock request
    mockRequest = new NextRequest('https://example.com/api/test', {
      headers: new Headers()
    });
    
    // Create mock handler
    mockHandler = jest.fn().mockResolvedValue({ type: 'next' });
    
    // Mock withTenantSiteContext to call the handler with the request
    (withTenantSiteContext as jest.Mock).mockImplementation((req, handler) => {
      // Add tenant and site context to the request
      const headers = new Headers(req.headers);
      const tenantId = req.headers.get('x-tenant-id');
      const siteId = req.headers.get('x-site-id');
      
      if (tenantId) headers.set('x-tenant-id', tenantId);
      if (siteId) headers.set('x-site-id', siteId);
      
      const requestWithContext = new NextRequest(req.url, {
        headers,
        method: req.method
      });
      
      return handler(requestWithContext);
    });
  });
  
  it('should call handler when tenant ID is present', async () => {
    // Set tenant ID
    mockRequest.headers.set('x-tenant-id', 'tenant-123');
    
    // Call middleware
    await validateTenantSiteContext(mockRequest, mockHandler);
    
    // Check that withTenantSiteContext was called
    expect(withTenantSiteContext).toHaveBeenCalled();
    
    // Check that handler was called
    expect(mockHandler).toHaveBeenCalled();
  });
  
  it('should return error when tenant ID is missing', async () => {
    // Call middleware without setting tenant ID
    await validateTenantSiteContext(mockRequest, mockHandler);
    
    // Check that withTenantSiteContext was called
    expect(withTenantSiteContext).toHaveBeenCalled();
    
    // Check that handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Check that error response was returned
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Missing tenant context'
      }),
      expect.objectContaining({
        status: 400
      })
    );
  });
  
  it('should call handler when site ID is present and required', async () => {
    // Set tenant and site IDs
    mockRequest.headers.set('x-tenant-id', 'tenant-123');
    mockRequest.headers.set('x-site-id', 'site-456');
    
    // Call middleware with requireSite = true
    await validateTenantSiteContext(mockRequest, mockHandler, true);
    
    // Check that withTenantSiteContext was called
    expect(withTenantSiteContext).toHaveBeenCalled();
    
    // Check that handler was called
    expect(mockHandler).toHaveBeenCalled();
  });
  
  it('should return error when site ID is missing and required', async () => {
    // Set tenant ID but not site ID
    mockRequest.headers.set('x-tenant-id', 'tenant-123');
    
    // Call middleware with requireSite = true
    await validateTenantSiteContext(mockRequest, mockHandler, true);
    
    // Check that withTenantSiteContext was called
    expect(withTenantSiteContext).toHaveBeenCalled();
    
    // Check that handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
    
    // Check that error response was returned
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: 'Missing site context'
      }),
      expect.objectContaining({
        status: 400
      })
    );
  });
  
  it('should call handler when site ID is missing but not required', async () => {
    // Set tenant ID but not site ID
    mockRequest.headers.set('x-tenant-id', 'tenant-123');
    
    // Call middleware with default requireSite (false)
    await validateTenantSiteContext(mockRequest, mockHandler);
    
    // Check that withTenantSiteContext was called
    expect(withTenantSiteContext).toHaveBeenCalled();
    
    // Check that handler was called
    expect(mockHandler).toHaveBeenCalled();
  });
});
