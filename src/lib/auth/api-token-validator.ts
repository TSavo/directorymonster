import { ApiTokenError } from '@/lib/errors/api-token-error';
import { decodeToken } from '@/utils/token-utils';

/**
 * Validates an API token
 * 
 * This function checks if the token is present, valid, and not expired.
 * It also verifies that the token contains user data.
 * 
 * @param token - The API token to validate
 * @returns The decoded token if valid
 * @throws ApiTokenError if the token is missing, invalid, or expired
 */
export function validateApiToken(token: string | null | undefined): any {
  // Check if token is missing
  if (!token) {
    throw new ApiTokenError('Missing API token');
  }
  
  // Decode the token
  const decoded = decodeToken(token);
  
  // Check if token is invalid
  if (!decoded) {
    throw new ApiTokenError('Invalid API token');
  }
  
  // Check if token is expired
  if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
    throw new ApiTokenError('API token expired');
  }
  
  // Check if token has user data
  if (!decoded.user) {
    throw new ApiTokenError('Invalid API token: missing user data');
  }
  
  return decoded;
}
