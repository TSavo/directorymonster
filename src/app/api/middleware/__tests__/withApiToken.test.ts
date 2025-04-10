import { NextRequest, NextResponse } from 'next/server';
import { withApiToken } from '../withApiToken';
import { validateApiToken } from '@/lib/auth/api-token-validator';
import { ApiTokenError } from '@/lib/errors/api-token-error';

// Mock the api-token-validator module
jest.mock('@/lib/auth/api-token-validator');

describe('withApiToken middleware', () => {
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
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should extract token from Authorization header', async () => {
    // Mock the Authorization header
    mockRequest.headers.set('Authorization', 'Bearer test-token');
    
    // Mock validateApiToken to return a valid token
    (validateApiToken as jest.Mock).mockReturnValue({
      user: { id: '123', name: 'Test User' }
    });
    
    // Call the middleware
    await withApiToken(mockRequest, mockHandler);
    
    // Verify validateApiToken was called with the token
    expect(validateApiToken).toHaveBeenCalledWith('test-token');
    
    // Verify handler was called with the request
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
  });
  
  it('should extract token from cookie', async () => {
    // Remove the Authorization header
    mockRequest.headers.delete('Authorization');
    
    // Mock the cookie
    mockRequest.cookies.get.mockReturnValue({ value: 'cookie-token' });
    
    // Mock validateApiToken to return a valid token
    (validateApiToken as jest.Mock).mockReturnValue({
      user: { id: '123', name: 'Test User' }
    });
    
    // Call the middleware
    await withApiToken(mockRequest, mockHandler);
    
    // Verify validateApiToken was called with the token
    expect(validateApiToken).toHaveBeenCalledWith('cookie-token');
    
    // Verify handler was called with the request
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
  });
  
  it('should throw ApiTokenError if no token is found', async () => {
    // Remove the Authorization header
    mockRequest.headers.delete('Authorization');
    
    // Mock the cookie to return null
    mockRequest.cookies.get.mockReturnValue(null);
    
    // Call the middleware and expect it to throw
    await expect(withApiToken(mockRequest, mockHandler)).rejects.toThrow(ApiTokenError);
    await expect(withApiToken(mockRequest, mockHandler)).rejects.toThrow('Missing API token');
    
    // Verify validateApiToken was not called
    expect(validateApiToken).not.toHaveBeenCalled();
    
    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
  });
  
  it('should throw ApiTokenError if token validation fails', async () => {
    // Mock the Authorization header
    mockRequest.headers.set('Authorization', 'Bearer invalid-token');
    
    // Mock validateApiToken to throw an error
    (validateApiToken as jest.Mock).mockImplementation(() => {
      throw new ApiTokenError('Invalid API token');
    });
    
    // Call the middleware and expect it to throw
    await expect(withApiToken(mockRequest, mockHandler)).rejects.toThrow(ApiTokenError);
    await expect(withApiToken(mockRequest, mockHandler)).rejects.toThrow('Invalid API token');
    
    // Verify validateApiToken was called with the token
    expect(validateApiToken).toHaveBeenCalledWith('invalid-token');
    
    // Verify handler was not called
    expect(mockHandler).not.toHaveBeenCalled();
  });
  
  it('should add user to request headers', async () => {
    // Mock the Authorization header
    mockRequest.headers.set('Authorization', 'Bearer test-token');
    
    // Mock validateApiToken to return a valid token
    const mockUser = { id: '123', name: 'Test User' };
    (validateApiToken as jest.Mock).mockReturnValue({
      user: mockUser
    });
    
    // Call the middleware
    await withApiToken(mockRequest, mockHandler);
    
    // Verify user was added to request headers
    expect(mockRequest.headers.get('x-user-id')).toBe('123');
    expect(mockRequest.headers.get('x-user-name')).toBe('Test User');
    
    // Verify handler was called with the request
    expect(mockHandler).toHaveBeenCalledWith(mockRequest);
  });
});
