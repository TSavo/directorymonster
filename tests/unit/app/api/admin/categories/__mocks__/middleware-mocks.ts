/**
 * Shared middleware mocks for category API tests
 */

// Import the modules first
import * as middleware from '@/app/api/middleware';

// Then mock them
jest.mock('@/app/api/middleware', () => ({
  withTenantAccess: jest.fn(),
  withPermission: jest.fn(),
  withSitePermission: jest.fn(),
}));

// Get the mocked functions
const withTenantAccess = middleware.withTenantAccess as jest.Mock;
const withPermission = middleware.withPermission as jest.Mock;
const withSitePermission = middleware.withSitePermission as jest.Mock;

// Export the mocked functions
export { withTenantAccess, withPermission, withSitePermission };

/**
 * Set up middleware mocks to pass through to the handler
 */
export function setupPassthroughMiddlewareMocks() {
  // Mock the middleware to pass through
  withTenantAccess.mockImplementation((req, handler) => {
    // Add tenant ID to headers if not present
    if (!req.headers.get('x-tenant-id')) {
      req.headers.set('x-tenant-id', 'tenant1');
    }
    return handler(req);
  });

  withPermission.mockImplementation((req, resourceType, permission, handler) => {
    // Add user ID to headers if not present
    if (!req.headers.get('x-user-id')) {
      req.headers.set('x-user-id', 'user1');
    }
    return handler(req);
  });

  withSitePermission.mockImplementation((req, siteId, permission, handler) => {
    // Add user ID to headers if not present
    if (!req.headers.get('x-user-id')) {
      req.headers.set('x-user-id', 'user1');
    }
    return handler(req);
  });
}

/**
 * Set up middleware mocks to deny tenant access
 */
export function setupDenyTenantAccessMock() {
  withTenantAccess.mockImplementation((req, handler) => {
    return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/**
 * Set up middleware mocks to deny permission
 */
export function setupDenyPermissionMock() {
  withTenantAccess.mockImplementation((req, handler) => {
    return handler(req);
  });

  withPermission.mockImplementation((req, resourceType, permission, handler) => {
    return new Response(JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/**
 * Set up middleware mocks to deny site permission
 */
export function setupDenySitePermissionMock() {
  withTenantAccess.mockImplementation((req, handler) => {
    return handler(req);
  });

  withPermission.mockImplementation((req, resourceType, permission, handler) => {
    return handler(req);
  });

  withSitePermission.mockImplementation((req, siteId, permission, handler) => {
    return new Response(JSON.stringify({
      error: 'Forbidden',
      message: `You do not have ${permission} permission for site ${siteId}`
    }), {
      status: 403, // Changed from 401 to 403 as per review comments
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

/**
 * Reset all middleware mocks
 */
export function resetMiddlewareMocks() {
  withTenantAccess.mockReset();
  withPermission.mockReset();
  withSitePermission.mockReset();
}
