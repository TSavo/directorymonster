/**
 * Authentication Helper for API Tests
 *
 * Provides utilities for generating tokens and authentication headers
 * for testing the DirectoryMonster API endpoints.
 */

import * as jwt from 'jsonwebtoken';

// Define interfaces for the auth helper
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

interface TokenOptions {
  expiresIn?: string;
  roles?: string[];
  email?: string;
}

interface AuthHeaderOptions {
  userId?: string;
  tenantId?: string;
  permissions?: Permission[];
  roles?: string[];
}

// Try to import secret from config, fallback to a test secret if not available
let secret: string;
try {
  const authConfig = require('../../../../src/config/auth');
  secret = authConfig.secret;
} catch (error) {
  console.warn('Auth config not found, using test secret');
  secret = 'test-secret-for-api-testing';
}

/**
 * Generates JWT tokens for testing tenant-specific APIs
 *
 * @param userId - The user ID
 * @param tenantId - The tenant ID
 * @param permissions - Array of permission objects
 * @param options - Additional options
 * @returns JWT token
 */
export function generateTestToken(
  userId: string, 
  tenantId: string, 
  permissions: Permission[] = [], 
  options: TokenOptions = {}
): string {
  const {
    expiresIn = '1h',
    roles = ['user'],
    email = 'test@example.com'
  } = options;
  
  const payload = {
    sub: userId,
    tenantId,
    permissions,
    roles,
    email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
  };

  return jwt.sign(payload, secret);
}

/**
 * Generate complete authentication headers including token and tenant ID
 *
 * @param options - Configuration options
 * @returns Headers object
 */
export function getAuthHeaders(options: AuthHeaderOptions = {}): Record<string, string> {
  const {
    userId = 'user-12345',
    tenantId = 'test-tenant',
    permissions = [{ resource: 'site', action: 'read' }],
    roles = ['user'],
  } = options;

  const token = generateTestToken(userId, tenantId, permissions, { roles });

  return {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID': tenantId,
    'Content-Type': 'application/json'
  };
}
