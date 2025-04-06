/**
 * Manual mock for secureTenantContext middleware
 *
 * This mock is automatically used by Jest when we call
 * jest.mock('@/app/api/middleware/secureTenantContext')
 */

// Create a mock context
const mockContext = {
  tenantId: '123e4567-e89b-12d3-a456-426614174000',
  userId: 'user-123',
  requestId: 'request-123',
  siteId: undefined
};

// Mock the TenantContext class
class TenantContext {
  constructor(tenantId, userId, requestId, siteId) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.requestId = requestId;
    this.siteId = siteId;
  }

  static fromRequest(req) {
    return mockContext;
  }

  static error(req) {
    return null;
  }
}

// Mock the withSecureTenantPermission middleware
export const withSecureTenantPermission = jest.fn().mockImplementation(
  (req, resourceType, permission, handler) => {
    // Call the handler with the request and context
    return handler(req, mockContext);
  }
);

// Mock the withSecureTenantContext middleware
export const withSecureTenantContext = jest.fn().mockImplementation(
  (req, handler) => {
    return handler(req, mockContext);
  }
);

// Export the TenantContext class
export default TenantContext;
