/**
 * Authentication helper utilities for API testing
 * 
 * Provides functions for generating test tokens and auth headers
 * for use in API tests.
 */

const jwt = require('jsonwebtoken');

// Secret key for test tokens - this should match the one used in the API
// In a real environment, this would be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

/**
 * Generate a test JWT token
 * @param {string} userId - User ID to include in the token
 * @param {string} tenantId - Tenant ID to include in the token
 * @param {Array} permissions - Array of permission objects
 * @returns {string} JWT token
 */
function generateTestToken(userId, tenantId, permissions = []) {
  const payload = {
    sub: userId,
    tenantId,
    permissions,
    // Add standard JWT claims
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
  };
  
  return jwt.sign(payload, JWT_SECRET);
}

/**
 * Generate authentication headers for API requests
 * @param {Object} options - Configuration options
 * @param {string} options.userId - User ID (default: 'test-user')
 * @param {string} options.tenantId - Tenant ID (default: 'test-tenant')
 * @param {Array} options.permissions - Array of permission objects
 * @returns {Object} Headers object
 */
function getAuthHeaders(options = {}) {
  const {
    userId = 'test-user',
    tenantId = 'test-tenant',
    permissions = [{ resource: '*', action: '*' }]
  } = options;
  
  const token = generateTestToken(userId, tenantId, permissions);
  
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
