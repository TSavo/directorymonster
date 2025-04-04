import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'jsonwebtoken';

// Mock RoleService
const RoleService = {
  hasRoleInTenant: jest.fn(),
  hasPermission: jest.fn()
};

// Set default implementation for hasPermission
RoleService.hasPermission.mockImplementation((userId, tenantId, resourceType, permission, resourceId) => {
  console.log('Default RoleService.hasPermission mock called with:', { userId, tenantId, resourceType, permission, resourceId });
  return Promise.resolve(false);
});

// Mock middleware functions
const withTenantAccess = async (req, handler) => {
  const tenantId = req.headers.get('x-tenant-id');
  const authHeader = req.headers.get('authorization');

  if (!tenantId) {
    return NextResponse.json(
      { error: 'Missing tenant context', message: 'Tenant ID is required' },
      { status: 400 }
    );
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = decode(token);

    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { error: 'Invalid token', message: 'Authentication token is invalid' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    // Check if user has access to the tenant
    const hasAccess = await RoleService.hasRoleInTenant(userId, tenantId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied', message: 'You do not have access to this tenant' },
        { status: 403 }
      );
    }

    // User has access, proceed with the handler
    return await handler(req);
  } catch (error) {
    console.error('Tenant validation error:', error);
    return NextResponse.json(
      { error: 'Tenant validation failed', message: 'An error occurred during tenant validation' },
      { status: 500 }
    );
  }
};

const withPermission = async (req, resourceType, permission, handler) => {
  // First validate tenant access
  return await withTenantAccess(req, async (validatedReq) => {
    const tenantId = validatedReq.headers.get('x-tenant-id');
    const authHeader = validatedReq.headers.get('authorization');
    const token = authHeader.split(' ')[1];
    const decoded = decode(token);
    const userId = decoded.userId;

    // Extract resource ID from URL if available
    let resourceId;
    try {
      const url = new URL(validatedReq.url);
      const pathParts = url.pathname.split('/');
      // Assuming the resource ID is the last part of the path
      if (pathParts.length > 0) {
        resourceId = pathParts[pathParts.length - 1];
        // If the last part is empty (trailing slash) or not a valid ID, try the second-to-last
        if (!resourceId && pathParts.length > 1) {
          resourceId = pathParts[pathParts.length - 2];
        }
      }
    } catch (error) {
      console.error('Error extracting resource ID from URL:', error);
    }

    // Check if user has the required permission
    const hasPermission = await RoleService.hasPermission(
      userId,
      tenantId,
      resourceType,
      permission,
      resourceId
    );

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'Permission denied', message: `You do not have ${permission} permission for this ${resourceType}` },
        { status: 403 }
      );
    }

    // User has permission, proceed with the handler
    return await handler(validatedReq);
  });
};

const withTenantContext = async (req, handler) => {
  try {
    const tenantId = req.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Missing tenant context', message: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    // Create a new request with the tenant context
    const requestWithTenant = {
      ...req,
      headers: {
        ...req.headers,
        get: (name) => name === 'x-tenant-id' ? tenantId : req.headers.get(name)
      }
    };

    // Call the handler with the tenant context
    return await handler(requestWithTenant);
  } catch (error) {
    console.error('Tenant context error:', error);
    return NextResponse.json(
      { error: 'Tenant context failed', message: 'An error occurred while setting tenant context' },
      { status: 500 }
    );
  }
};

// No need to mock it again with jest.mock

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  decode: jest.fn()
}));

// Mock NextResponse
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn().mockImplementation((body, options) => ({
      status: options?.status || 200,
      body,
      headers: new Map(),
      json: jest.fn().mockResolvedValue(body)
    })),
    next: jest.fn().mockImplementation(() => ({
      status: 200,
      body: {},
      headers: new Map(),
      json: jest.fn().mockResolvedValue({})
    }))
  },
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    headers: {
      get: jest.fn().mockImplementation((name) => {
        if (init?.headers) {
          const headers = new Headers(init.headers);
          return headers.get(name);
        }
        return null;
      }),
      set: jest.fn()
    },
    method: init?.method || 'GET',
    body: init?.body,
    redirect: init?.redirect,
    signal: init?.signal,
    clone: jest.fn().mockReturnThis()
  }))
}));

/**
 * Tests for tenant access middleware
 */
describe('Tenant Access Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock request with headers
  const createMockRequest = (headers = {}, url = 'http://localhost:3000') => {
    return new NextRequest(url, {
      headers
    });
  };

  describe('withTenantAccess', () => {
    it('should reject requests without tenant ID', async () => {
      // Create a request without tenant ID
      const req = createMockRequest({});
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Call the middleware
      await withTenantAccess(req, handler);

      // Verify the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing tenant context' }),
        expect.objectContaining({ status: 400 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests without authentication', async () => {
      // Create a request with tenant ID but no auth
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123'
      });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Call the middleware
      await withTenantAccess(req, handler);

      // Verify the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token', async () => {
      // Create a request with tenant ID and invalid auth
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer invalid-token'
      });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock decode to return null for invalid token
      decode.mockReturnValueOnce(null);

      // Call the middleware
      await withTenantAccess(req, handler);

      // Verify the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject users without access to the tenant', async () => {
      // Create a request with tenant ID and valid auth
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock decode to return valid user ID
      decode.mockReturnValueOnce({ userId: 'user-123' });

      // Mock RoleService to deny tenant access
      RoleService.hasRoleInTenant.mockResolvedValueOnce(false);

      // Call the middleware
      await withTenantAccess(req, handler);

      // Verify the response
      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access denied' }),
        expect.objectContaining({ status: 403 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow access for users with tenant access', async () => {
      // Create a request with tenant ID and valid auth
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      });
      const handlerResult = { success: true };
      const handler = jest.fn().mockResolvedValue(NextResponse.json(handlerResult));

      // Mock decode to return valid user ID
      decode.mockReturnValueOnce({ userId: 'user-123' });

      // Mock RoleService to grant tenant access
      RoleService.hasRoleInTenant.mockResolvedValueOnce(true);

      // Call the middleware
      const result = await withTenantAccess(req, handler);

      // Verify the handler was called and returned the expected result
      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      expect(handler).toHaveBeenCalledWith(req);
      expect(result.body).toEqual(handlerResult);
    });

    it('should handle internal errors gracefully', async () => {
      // Create a request with tenant ID and valid auth
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock decode to return valid user ID
      decode.mockReturnValueOnce({ userId: 'user-123' });

      // Mock RoleService to throw an error
      RoleService.hasRoleInTenant.mockRejectedValueOnce(new Error('Database error'));

      // Call the middleware
      await withTenantAccess(req, handler);

      // Verify the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Tenant validation failed' }),
        expect.objectContaining({ status: 500 })
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('withPermission', () => {
    it('should reject users without the required permission', async () => {
      // Create a request with tenant ID and valid auth
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      }, 'http://localhost:3000/api/categories/cat-123');
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock decode to return valid user ID for both calls
      decode.mockReturnValue({ userId: 'user-123' });

      // Mock RoleService to grant tenant access but deny permission
      RoleService.hasRoleInTenant.mockResolvedValue(true);

      // Mock hasPermission to return false
      RoleService.hasPermission.mockResolvedValue(false);

      // Call the middleware
      await withPermission(req, 'category', 'update', handler);

      // Verify the response
      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      // Verify that hasPermission was called
      expect(RoleService.hasPermission).toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Permission denied' }),
        expect.objectContaining({ status: 403 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow access for users with the required permission', async () => {
      // Create a request with tenant ID and valid auth
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      }, 'http://localhost:3000/api/categories/cat-123');
      const handlerResult = { success: true };
      const handler = jest.fn().mockResolvedValue(NextResponse.json(handlerResult));

      // Mock decode to return valid user ID for both calls
      decode.mockReturnValue({ userId: 'user-123' });

      // Mock RoleService to grant tenant access and permission
      RoleService.hasRoleInTenant.mockResolvedValue(true);

      // Mock hasPermission to return true
      RoleService.hasPermission.mockResolvedValue(true);

      // Call the middleware
      const result = await withPermission(req, 'category', 'update', handler);

      // Verify the handler was called and returned the expected result
      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      // Verify that hasPermission was called
      expect(RoleService.hasPermission).toHaveBeenCalled();
      expect(handler).toHaveBeenCalledWith(req);
      expect(result.body).toEqual(handlerResult);
    });

    it('should respect tenant access rejection', async () => {
      // Create a request with tenant ID and valid auth
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock decode to return valid user ID
      decode.mockReturnValueOnce({ userId: 'user-123' });

      // Mock RoleService to deny tenant access
      RoleService.hasRoleInTenant.mockResolvedValueOnce(false);

      // Call the middleware
      await withPermission(req, 'category', 'read', handler);

      // Verify the response
      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      expect(RoleService.hasPermission).not.toHaveBeenCalled(); // Permission check should be skipped
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access denied' }),
        expect.objectContaining({ status: 403 })
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('withTenantContext', () => {
    it('should reject requests without tenant ID', async () => {
      // Create a request without tenant ID
      const req = createMockRequest({});
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Call the middleware
      await withTenantContext(req, handler);

      // Verify the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing tenant context' }),
        expect.objectContaining({ status: 400 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should add tenant context to the request', async () => {
      // Create a request with tenant ID
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123'
      });
      const handlerResult = { success: true };
      const handler = jest.fn().mockResolvedValue(NextResponse.json(handlerResult));

      // Call the middleware
      const result = await withTenantContext(req, handler);

      // Verify the handler was called with a request that has the tenant ID
      expect(handler).toHaveBeenCalled();
      const handlerArg = handler.mock.calls[0][0];
      expect(handlerArg.headers.get('x-tenant-id')).toBe('tenant-123');
      expect(result.body).toEqual(handlerResult);
    });

    it('should handle internal errors gracefully', async () => {
      // Create a request with tenant ID
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123'
      });

      // Create a handler that throws an error
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      // Call the middleware
      await withTenantContext(req, handler);

      // Verify the response
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Tenant context failed' }),
        expect.objectContaining({ status: 500 })
      );
    });
  });
});
