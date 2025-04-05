import { NextRequest, NextResponse } from 'next/server';
import { withTenantSiteContext } from '../withTenantSiteContext';

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, options) => ({
    url,
    headers: options?.headers || new Headers(),
    cookies: {
      get: jest.fn()
    },
    method: 'GET'
  })),
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
    next: jest.fn(() => ({ type: 'next' }))
  }
}));

describe('withTenantSiteContext', () => {
  // Setup variables
  let mockRequest: NextRequest;
  let mockHandler: jest.Mock;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock request with mock cookies
    mockRequest = new NextRequest('https://example.com/api/test', {
      headers: new Headers()
    });

    // Mock the cookies.get method
    mockRequest.cookies.get = jest.fn((name) => {
      return null; // Default to returning null
    });

    // Create mock handler
    mockHandler = jest.fn().mockResolvedValue({ type: 'next' });
  });

  it('should add tenant ID from headers to the request', async () => {
    // Set tenant ID in headers
    mockRequest.headers.set('x-tenant-id', 'tenant-123');

    // Call middleware
    await withTenantSiteContext(mockRequest, mockHandler);

    // Check that handler was called
    expect(mockHandler).toHaveBeenCalled();

    // Get the request passed to the handler
    const requestWithContext = mockHandler.mock.calls[0][0];

    // Check that tenant ID was added to the request
    expect(requestWithContext.headers.get('x-tenant-id')).toBe('tenant-123');
  });

  it('should add tenant and site IDs from headers to the request', async () => {
    // Set tenant and site IDs in headers
    mockRequest.headers.set('x-tenant-id', 'tenant-123');
    mockRequest.headers.set('x-site-id', 'site-456');

    // Call middleware
    await withTenantSiteContext(mockRequest, mockHandler);

    // Check that handler was called
    expect(mockHandler).toHaveBeenCalled();

    // Get the request passed to the handler
    const requestWithContext = mockHandler.mock.calls[0][0];

    // Check that tenant and site IDs were added to the request
    expect(requestWithContext.headers.get('x-tenant-id')).toBe('tenant-123');
    expect(requestWithContext.headers.get('x-site-id')).toBe('site-456');
  });

  it('should add tenant ID from cookies when not in headers', async () => {
    // Mock cookies.get to return tenant ID
    (mockRequest.cookies.get as jest.Mock).mockImplementation((name) => {
      if (name === 'currentTenantId') {
        return { value: 'tenant-cookie' };
      }
      return null;
    });

    // Call middleware
    await withTenantSiteContext(mockRequest, mockHandler);

    // Check that handler was called
    expect(mockHandler).toHaveBeenCalled();

    // Get the request passed to the handler
    const requestWithContext = mockHandler.mock.calls[0][0];

    // Check that tenant ID from cookie was added to the request
    expect(requestWithContext.headers.get('x-tenant-id')).toBe('tenant-cookie');
  });

  it('should add site ID from cookies when tenant ID is available', async () => {
    // Set tenant ID in headers
    mockRequest.headers.set('x-tenant-id', 'tenant-123');

    // Mock cookies.get to return site ID
    (mockRequest.cookies.get as jest.Mock).mockImplementation((name) => {
      if (name === 'tenant-123_currentSiteId') {
        return { value: 'site-cookie' };
      }
      return null;
    });

    // Call middleware
    await withTenantSiteContext(mockRequest, mockHandler);

    // Check that handler was called
    expect(mockHandler).toHaveBeenCalled();

    // Get the request passed to the handler
    const requestWithContext = mockHandler.mock.calls[0][0];

    // Check that tenant and site IDs were added to the request
    expect(requestWithContext.headers.get('x-tenant-id')).toBe('tenant-123');
    expect(requestWithContext.headers.get('x-site-id')).toBe('site-cookie');
  });

  it('should prioritize headers over cookies', async () => {
    // Set tenant and site IDs in headers
    mockRequest.headers.set('x-tenant-id', 'tenant-header');
    mockRequest.headers.set('x-site-id', 'site-header');

    // Mock cookies.get to return different tenant and site IDs
    (mockRequest.cookies.get as jest.Mock).mockImplementation((name) => {
      if (name === 'currentTenantId') {
        return { value: 'tenant-cookie' };
      }
      if (name === 'tenant-header_currentSiteId' || name === 'tenant-cookie_currentSiteId') {
        return { value: 'site-cookie' };
      }
      return null;
    });

    // Call middleware
    await withTenantSiteContext(mockRequest, mockHandler);

    // Check that handler was called
    expect(mockHandler).toHaveBeenCalled();

    // Get the request passed to the handler
    const requestWithContext = mockHandler.mock.calls[0][0];

    // Check that header values were used instead of cookie values
    expect(requestWithContext.headers.get('x-tenant-id')).toBe('tenant-header');
    expect(requestWithContext.headers.get('x-site-id')).toBe('site-header');
  });
});
