import { validateApiToken } from '../api-token-validator';
import { ApiTokenError } from '@/lib/errors/api-token-error';
import { decodeToken } from '@/utils/token-utils';

// Mock the token-utils module
jest.mock('@/utils/token-utils');

describe('validateApiToken', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should throw ApiTokenError if token is missing', () => {
    expect(() => validateApiToken(undefined)).toThrow(ApiTokenError);
    expect(() => validateApiToken(undefined)).toThrow('Missing API token');
    
    expect(() => validateApiToken(null)).toThrow(ApiTokenError);
    expect(() => validateApiToken(null)).toThrow('Missing API token');
    
    expect(() => validateApiToken('')).toThrow(ApiTokenError);
    expect(() => validateApiToken('')).toThrow('Missing API token');
  });
  
  it('should throw ApiTokenError if token is invalid', () => {
    // Mock decodeToken to return null (invalid token)
    (decodeToken as jest.Mock).mockReturnValue(null);
    
    expect(() => validateApiToken('invalid-token')).toThrow(ApiTokenError);
    expect(() => validateApiToken('invalid-token')).toThrow('Invalid API token');
    
    // Verify decodeToken was called with the token
    expect(decodeToken).toHaveBeenCalledWith('invalid-token');
  });
  
  it('should throw ApiTokenError if token is expired', () => {
    // Mock decodeToken to return a token with an expired exp claim
    const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    (decodeToken as jest.Mock).mockReturnValue({
      exp: pastTime,
      user: { id: '123', name: 'Test User' }
    });
    
    expect(() => validateApiToken('expired-token')).toThrow(ApiTokenError);
    expect(() => validateApiToken('expired-token')).toThrow('API token expired');
    
    // Verify decodeToken was called with the token
    expect(decodeToken).toHaveBeenCalledWith('expired-token');
  });
  
  it('should throw ApiTokenError if token has no user claim', () => {
    // Mock decodeToken to return a token without a user claim
    const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
    (decodeToken as jest.Mock).mockReturnValue({
      exp: futureTime
    });
    
    expect(() => validateApiToken('no-user-token')).toThrow(ApiTokenError);
    expect(() => validateApiToken('no-user-token')).toThrow('Invalid API token: missing user data');
    
    // Verify decodeToken was called with the token
    expect(decodeToken).toHaveBeenCalledWith('no-user-token');
  });
  
  it('should return the decoded token if valid', () => {
    // Mock decodeToken to return a valid token
    const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in the future
    const mockDecodedToken = {
      exp: futureTime,
      user: { id: '123', name: 'Test User' }
    };
    (decodeToken as jest.Mock).mockReturnValue(mockDecodedToken);
    
    const result = validateApiToken('valid-token');
    
    // Verify decodeToken was called with the token
    expect(decodeToken).toHaveBeenCalledWith('valid-token');
    
    // Verify the result is the decoded token
    expect(result).toBe(mockDecodedToken);
  });
});
