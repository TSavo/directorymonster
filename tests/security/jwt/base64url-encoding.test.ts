/**
 * Base64URL Encoding Tests
 *
 * Tests for verifying the improved Base64URL encoding implementation.
 */

import jwt from 'jsonwebtoken';
import * as jwtUtils from './jwt-test-utils';

// Helper function for improved Base64URL encoding
function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(typeof input === 'string' ? input : input.toString())
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

describe('Base64URL Encoding', () => {
  it('should properly encode and decode values', () => {
    // Arrange
    const testData = { userId: 'test-user', role: 'admin' };
    const jsonString = JSON.stringify(testData);
    
    // Act
    const encoded = base64UrlEncode(jsonString);
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());
    
    // Assert
    expect(decoded).toEqual(testData);
  });
  
  it('should handle strings with characters that need padding', () => {
    // Arrange - strings that would normally require padding
    const testStrings = [
      'a', // Would normally require 2 padding characters
      'ab', // Would normally require 1 padding character
      'abc', // No padding required
      'abcd' // Would normally require 2 padding characters
    ];
    
    // Act & Assert
    for (const str of testStrings) {
      const encoded = base64UrlEncode(str);
      // Should not contain padding characters
      expect(encoded).not.toContain('=');
      // Should decode back to the original string
      const decoded = Buffer.from(encoded, 'base64').toString();
      expect(decoded).toBe(str);
    }
  });
  
  it('should be compatible with JWT token parts', () => {
    // Arrange
    const token = jwtUtils.generateValidToken();
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Act - Re-encode with our improved function
    const reencoded = base64UrlEncode(JSON.stringify(payload));
    
    // Assert - Our encoding should be compatible with JWT
    // Note: The exact encoding might differ due to whitespace or ordering,
    // but it should decode to the same object
    const decodedOriginal = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    const decodedReencoded = JSON.parse(Buffer.from(reencoded, 'base64').toString());
    expect(decodedReencoded).toEqual(decodedOriginal);
  });
});
