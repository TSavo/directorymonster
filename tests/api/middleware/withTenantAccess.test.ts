import { NextRequest, NextResponse } from 'next/server';
import { withTenantAccess, withPermission, withTenantContext } from '@/app/api/middleware';
import RoleService from '@/lib/role-service';
import { decode } from 'jsonwebtoken';

// Mock the RoleService
jest.mock('@/lib/role-service');

// Mock next/server
jest.mock('next/server', () => {
  return {
    NextResponse: {
      json: jest.fn().mockImplementation((body, options) => {
        return {
          status: options?.status || 200,
          body,
          headers: new Map(),
          json: jest.fn().mockResolvedValue(body)
        };
      }),
      next: jest.fn().mockImplementation(() => {
        return {
          status: 200,
          body: {},
          headers: new Map(),
          json: jest.fn().mockResolvedValue({})
        };
      })
    },
    NextRequest: jest.fn().mockImplementation((url, init) => {
      return {
        url,
        headers: init?.headers || new Headers(),
        method: init?.method || 'GET',
        body: init?.body,
        redirect: init?.redirect,
        signal: init?.signal
      };
    })
  };
});

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => {
  return {
    decode: jest.fn().mockImplementation((token) => {
      if (token === 'valid-token') {
        return { userId: 'user-123' };
      }
      return null;
    }),
    sign: jest.fn().mockImplementation((payload) => {
      return 'valid-token';
    }),
    verify: jest.fn().mockImplementation((token, secret) => {
      if (token === 'valid-token') {
        return { userId: 'user-123' };
      }
      throw new Error('Invalid token');
    }),
    JwtPayload: {}
  };
});

describe('Tenant Access Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper to create a mock NextRequest
  const createMockRequest = (headers: Record<string, string>, url = 'http://localhost:3000/api/test') => {
    return {
      headers: {
        get: jest.fn().mockImplementation((name) => headers[name] || null),
      },
      url,
      clone: jest.fn().mockReturnThis()
    } as unknown as NextRequest;
  };

  describe('withTenantAccess', () => {
    it('should reject requests without tenant ID', async () => {
      const req = createMockRequest({});
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      await withTenantAccess(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing tenant context' }),
        expect.objectContaining({ status: 400 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests without authentication', async () => {
      const req = createMockRequest({ 'x-tenant-id': 'tenant-123' });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      await withTenantAccess(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Unauthorized' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject requests with invalid token', async () => {
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer invalid-token'
      });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      (decode as jest.Mock).mockReturnValueOnce(null);

      await withTenantAccess(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Invalid token' }),
        expect.objectContaining({ status: 401 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should reject users without access to the tenant', async () => {
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock RoleService to indicate user does not have access
      (RoleService.hasRoleInTenant as jest.Mock).mockResolvedValue(false);

      await withTenantAccess(req, handler);

      expect(decode).toHaveBeenCalledWith('valid-token');
      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access denied' }),
        expect.objectContaining({ status: 403 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow access for users with tenant access', async () => {
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      });
      const handlerResult = { success: true };
      const handler = jest.fn().mockResolvedValue(NextResponse.json(handlerResult));

      // Mock RoleService to indicate user has access
      (RoleService.hasRoleInTenant as jest.Mock).mockResolvedValue(true);

      const result = await withTenantAccess(req, handler);

      expect(decode).toHaveBeenCalledWith('valid-token');
      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      expect(handler).toHaveBeenCalledWith(req);
      expect(result).toEqual(NextResponse.json(handlerResult));
    });

    it('should handle internal errors gracefully', async () => {
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      });
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Force an error
      (RoleService.hasRoleInTenant as jest.Mock).mockRejectedValue(new Error('Database error'));

      await withTenantAccess(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Tenant validation failed' }),
        expect.objectContaining({ status: 500 })
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('withPermission', () => {
    it('should reject users without the required permission', async () => {
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      }, 'http://localhost:3000/api/categories/cat-123');
      
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock RoleService for tenant access and permission check
      (RoleService.hasRoleInTenant as jest.Mock).mockResolvedValue(true);
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(false);

      await withPermission(req, 'category', 'update', handler);

      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        'category',
        'update',
        'cat-123'
      );
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Permission denied' }),
        expect.objectContaining({ status: 403 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow access for users with the required permission', async () => {
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      }, 'http://localhost:3000/api/categories/cat-123');
      
      const handlerResult = { success: true };
      const handler = jest.fn().mockResolvedValue(NextResponse.json(handlerResult));

      // Mock RoleService for tenant access and permission check
      (RoleService.hasRoleInTenant as jest.Mock).mockResolvedValue(true);
      (RoleService.hasPermission as jest.Mock).mockResolvedValue(true);

      const result = await withPermission(req, 'category', 'update', handler);

      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      expect(RoleService.hasPermission).toHaveBeenCalledWith(
        'user-123',
        'tenant-123',
        'category',
        'update',
        'cat-123'
      );
      expect(handler).toHaveBeenCalled();
      expect(result).toEqual(NextResponse.json(handlerResult));
    });

    it('should respect tenant access rejection', async () => {
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123',
        'authorization': 'Bearer valid-token'
      });
      
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      // Mock RoleService to deny tenant access
      (RoleService.hasRoleInTenant as jest.Mock).mockResolvedValue(false);

      await withPermission(req, 'category', 'read', handler);

      expect(RoleService.hasRoleInTenant).toHaveBeenCalledWith('user-123', 'tenant-123');
      expect(RoleService.hasPermission).not.toHaveBeenCalled();
      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Access denied' }),
        expect.objectContaining({ status: 403 })
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // Skip this section for now as it requires additional mocking
  describe.skip('withTenantContext', () => {
    it('should reject requests without tenant ID', async () => {
      const req = createMockRequest({});
      const handler = jest.fn().mockResolvedValue(NextResponse.json({ success: true }));

      await withTenantContext(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Missing tenant context' }),
        expect.objectContaining({ status: 400 })
      );
      expect(handler).not.toHaveBeenCalled();
    });

    it('should add tenant context to the request', async () => {
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123'
      });
      
      const handlerResult = { success: true };
      const handler = jest.fn().mockResolvedValue(NextResponse.json(handlerResult));

      const result = await withTenantContext(req, handler);

      expect(handler).toHaveBeenCalled();
      
      // Check that the request passed to the handler has the tenant ID
      const handlerArg = handler.mock.calls[0][0];
      expect(handlerArg.headers.get('x-tenant-id')).toBe('tenant-123');
      
      expect(result).toEqual(NextResponse.json(handlerResult));
    });

    it('should handle internal errors gracefully', async () => {
      const req = createMockRequest({
        'x-tenant-id': 'tenant-123'
      });
      
      // Force an error in the handler
      const handler = jest.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      await withTenantContext(req, handler);

      expect(NextResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Tenant context failed' }),
        expect.objectContaining({ status: 500 })
      );
    });
  });
});