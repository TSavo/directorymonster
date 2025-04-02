/**
 * Authentication Helper for API Tests
 * 
 * Provides utilities for generating tokens and authentication headers
 * for testing the DirectoryMonster API endpoints.
 */

const jwt = require('jsonwebtoken');

// Try to import secret from config, fallback to a test secret if not available
let secret;
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
 * @param {string} userId - The user ID
 * @param {string} tenantId - The tenant ID
 * @param {Array} permissions - Array of permission objects
 * @param {Object} options - Additional options
 * @returns {string} JWT token
 */
function generateTestToken(userId, tenantId, permissions = [], options = {}) {
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
 * @param {Object} options - Configuration options
 * @returns {Object} Headers object
 */
function getAuthHeaders(options = {}) {
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

module.exports = { 
  generateTestToken,
  getAuthHeaders
};
