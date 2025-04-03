/**
 * Tests for JWT Test Utilities
 *
 * This file contains tests for the utility functions used in JWT token testing.
 */

import * as jwtUtils from './jwt-test-utils';

describe('JWT Test Utilities', () => {
  describe('createMalformedAuthHeader function', () => {
    it('should return a token without Bearer prefix when type is missing-bearer', () => {
      const result = jwtUtils.createMalformedAuthHeader('missing-bearer');
      expect(result).not.toContain('Bearer');
      expect(result.split('.')).toHaveLength(3); // Should be a valid JWT with 3 parts
    });

    it('should return a token with extra spaces when type is extra-spaces', () => {
      const result = jwtUtils.createMalformedAuthHeader('extra-spaces');
      expect(result).toMatch(/^Bearer\s{2,}.*\s{2,}$/);
    });

    it('should return an empty string when type is empty', () => {
      const result = jwtUtils.createMalformedAuthHeader('empty');
      expect(result).toBe('');
    });

    it('should return Bearer prefix without token when type is no-token', () => {
      const result = jwtUtils.createMalformedAuthHeader('no-token');
      expect(result).toBe('Bearer ');
    });

    it('should throw an error for unknown malformation types', () => {
      // @ts-ignore - Intentionally passing an invalid type to test error handling
      expect(() => jwtUtils.createMalformedAuthHeader('unknown-type')).toThrow(
        'Unknown malformation type: unknown-type'
      );
    });
  });
});
