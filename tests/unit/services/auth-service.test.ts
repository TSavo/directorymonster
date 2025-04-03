import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_ISSUER = 'test-issuer';
process.env.JWT_AUDIENCE = 'test-audience';

describe('AuthService', () => {
  const testUserId = 'user_' + uuidv4();
  const testTenantId = 'tenant_' + uuidv4();

  // Create a valid JWT token for testing
  const validToken = jwt.sign(
    {
      sub: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category', 'create:category']
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    }
  );

  // Create an expired token for testing
  const expiredToken = jwt.sign(
    {
      sub: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category']
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '-10s', // Expired 10 seconds ago
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    }
  );

  // Create a token with invalid signature
  const invalidSignatureToken = validToken.slice(0, -5) + 'invalid';

  // Create a token with wrong issuer
  const wrongIssuerToken = jwt.sign(
    {
      sub: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category']
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      issuer: 'wrong-issuer',
      audience: process.env.JWT_AUDIENCE
    }
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should have a validateToken method', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Verify the method exists
    expect(typeof AuthService.validateToken).toBe('function');
  });

  it('should return decoded token data for a valid token', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Call the method
    const result = await AuthService.validateToken(validToken);

    // Verify the result
    expect(result).toEqual({
      userId: testUserId,
      tenantId: testTenantId,
      permissions: ['read:category', 'create:category'],
      isValid: true
    });
  });

  it('should return isValid=false for an expired token', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Call the method
    const result = await AuthService.validateToken(expiredToken);

    // Verify the result
    expect(result).toEqual({
      isValid: false,
      error: 'Token expired'
    });
  });

  it('should return isValid=false for a token with invalid signature', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Call the method
    const result = await AuthService.validateToken(invalidSignatureToken);

    // Verify the result
    expect(result).toEqual({
      isValid: false,
      error: 'Invalid token'
    });
  });

  it('should return isValid=false for a token with wrong issuer', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Call the method
    const result = await AuthService.validateToken(wrongIssuerToken);

    // Verify the result
    expect(result).toEqual({
      isValid: false,
      error: 'Invalid token'
    });
  });

  it('should return isValid=false for a null or undefined token', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Call the method with null
    const resultNull = await AuthService.validateToken(null);

    // Verify the result
    expect(resultNull).toEqual({
      isValid: false,
      error: 'No token provided'
    });

    // Call the method with undefined
    const resultUndefined = await AuthService.validateToken(undefined);

    // Verify the result
    expect(resultUndefined).toEqual({
      isValid: false,
      error: 'No token provided'
    });
  });

  it('should have a hasPermission method', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Verify the method exists
    expect(typeof AuthService.hasPermission).toBe('function');
  });

  it('should return true if token has the required permission', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Call the method
    const result = await AuthService.hasPermission(validToken, 'read:category');

    // Verify the result
    expect(result).toBe(true);
  });

  it('should return false if token does not have the required permission', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Call the method
    const result = await AuthService.hasPermission(validToken, 'delete:category');

    // Verify the result
    expect(result).toBe(false);
  });

  it('should return false if token is invalid', async () => {
    // Import the service
    const { AuthService } = require('@/services/auth-service');

    // Call the method with expired token
    const resultExpired = await AuthService.hasPermission(expiredToken, 'read:category');

    // Verify the result
    expect(resultExpired).toBe(false);

    // Call the method with invalid signature token
    const resultInvalidSignature = await AuthService.hasPermission(invalidSignatureToken, 'read:category');

    // Verify the result
    expect(resultInvalidSignature).toBe(false);
  });
});
