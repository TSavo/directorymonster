/**
 * Tenant Isolation and Public Tenant Tests
 * 
 * These tests ensure that:
 * 1. The public tenant is properly isolated from other tenants
 * 2. Users in the public tenant can't access other tenants' data
 * 3. Only users with proper permissions can assign users to tenants
 */

import { PublicTenantService } from '../public-tenant-service';
import TenantService from '../tenant-service';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { redis, kv } from '@/lib/redis-client';
import { db } from '@/lib/db';
import { getUserFromSession } from '@/lib/auth';

jest.mock('../tenant-service');
jest.mock('@/lib/tenant-membership-service');
jest.mock('@/lib/redis-client', () => ({
  redis: {
    sadd: jest.fn().mockResolvedValue(true),
    smembers: jest.fn().mockResolvedValue([]),
    sismember: jest.fn(),
  },
  kv: {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn(),
  },
}));
jest.mock('@/lib/db');
jest.mock('@/lib/auth');

describe('Tenant Isolation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PublicTenantService', () => {
    it('should create a public tenant with the correct configuration', async () => {
      // Mock tenant doesn't exist yet
      (TenantService.getTenantById as jest.Mock).mockResolvedValue(null);
      (TenantService.normalizeHostname as jest.Mock).mockImplementation(
        hostname => hostname
      );
      
      // Call the method
      const tenant = await PublicTenantService.ensurePublicTenant();
      
      // Check tenant configuration
      expect(tenant).toEqual(
        expect.objectContaining({
          id: 'public',
          slug: 'public',
          name: 'Public Tenant',
          settings: expect.objectContaining({
            isPublicTenant: true
          })
        })
      );
      
      // Check it was stored correctly
      expect(kv.set).toHaveBeenCalledWith(
        'tenant:public',
        expect.objectContaining({
          id: 'public'
        })
      );
      
      // Check it was added to all tenants set
      expect(redis.sadd).toHaveBeenCalledWith('tenants:all', 'public');
    });

    it('should add users to the public tenant without roles', async () => {
      // Mock the dependencies
      jest.spyOn(PublicTenantService, 'ensurePublicTenant')
        .mockResolvedValue({} as any);
      
      (TenantMembershipService.addUserToTenant as jest.Mock).mockResolvedValue(true);
      
      // Call the method
      const result = await PublicTenantService.addUserToPublicTenant('user123');
      
      // Check that user was added without a role
      expect(TenantMembershipService.addUserToTenant).toHaveBeenCalledWith(
        'user123',
        'public'
      );
      
      // Should not have a third parameter (roleId)
      expect(TenantMembershipService.addUserToTenant).not.toHaveBeenCalledWith(
        'user123',
        'public',
        expect.anything()
      );
      
      expect(result).toBe(true);
    });
  });

  describe('Public Tenant API Endpoints', () => {
    it('GET /api/tenants/public/users should require authentication', async () => {
      // Mock user is not authenticated
      (getUserFromSession as jest.Mock).mockResolvedValue(null);
      
      // Mock the request/response objects
      const req = {} as Request;
      const jsonMock = jest.fn().mockReturnValue({});
      const NextResponseMock = {
        json: jsonMock
      };
      
      // Import the handler dynamically to avoid hoisting issues with jest.mock
      const { GET } = await import('../../../app/api/tenants/public/users/route');
      
      await GET(req);
      
      // Should return 401 for unauthenticated user
      expect(jsonMock).toHaveBeenCalledWith(
        { error: 'Authentication required' },
        { status: 401 }
      );
    });

    it('GET /api/tenants/public/users should check for user permission', async () => {
      // Mock authenticated user without permissions
      (getUserFromSession as jest.Mock).mockResolvedValue({
        id: 'admin1',
        acl: {
          entries: []
        }
      });
      
      // Mock the request/response objects
      const req = {} as Request;
      const jsonMock = jest.fn().mockReturnValue({});
      const NextResponseMock = {
        json: jsonMock
      };
      
      // Import the handler dynamically
      const { GET } = await import('../../../app/api/tenants/public/users/route');
      
      await GET(req);
      
      // Should return 403 for user without permissions
      expect(jsonMock).toHaveBeenCalledWith(
        { error: 'Permission denied' },
        { status: 403 }
      );
    });

    it('POST /api/tenants/users/assign should enforce tenant isolation', async () => {
      // Mock authenticated user with permissions but not for the requested tenant
      (getUserFromSession as jest.Mock).mockResolvedValue({
        id: 'admin1',
        acl: {
          entries: [
            {
              resource: { type: 'user', permission: 'create', tenantId: 'tenant1' }
            }
          ]
        }
      });
      
      // Mock tenant exists
      (db.tenant.findUnique as jest.Mock).mockResolvedValue({ id: 'tenant2' });
      
      // Mock user exists
      (db.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user1' });
      
      // Mock role exists
      (db.role.findFirst as jest.Mock).mockResolvedValue({ id: 'role1' });
      
      // Mock the request with a body for a different tenant
      const req = {
        json: jest.fn().mockResolvedValue({
          userId: 'user1',
          tenantId: 'tenant2', // Different from the user's permission
          roleId: 'role1'
        })
      } as unknown as Request;
      
      const jsonMock = jest.fn().mockReturnValue({});
      const NextResponseMock = {
        json: jsonMock
      };
      
      // Import the handler dynamically
      const { POST } = await import('../../../app/api/tenants/users/assign/route');
      
      await POST(req);
      
      // Should return 403 for tenant isolation violation
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining('Permission denied') }),
        { status: 403 }
      );
    });
  });

  describe('Tenant Membership Isolation', () => {
    it('should check if a user is a member of a tenant', async () => {
      // Mock for the test
      (redis.sismember as jest.Mock).mockImplementation((key, userId) => {
        // Only return true for public tenant
        return Promise.resolve(key.includes('public'));
      });
      
      // Call the methods
      const isInPublic = await TenantMembershipService.isTenantMember('user1', 'public');
      const isInOther = await TenantMembershipService.isTenantMember('user1', 'tenant1');
      
      // User should be in public tenant but not in other tenant
      expect(isInPublic).toBe(true);
      expect(isInOther).toBe(false);
    });

    it('should enforce tenant isolation when getting tenant users', async () => {
      // Set up multiple tenants with different users
      (redis.smembers as jest.Mock).mockImplementation((key) => {
        if (key.includes('public')) {
          return Promise.resolve(['user1', 'user2', 'user3']);
        } else if (key.includes('tenant1')) {
          return Promise.resolve(['user4', 'user5']);
        }
        return Promise.resolve([]);
      });
      
      // Call the methods
      const publicUsers = await TenantMembershipService.getTenantUsers('public');
      const tenant1Users = await TenantMembershipService.getTenantUsers('tenant1');
      
      // Should return different sets of users
      expect(publicUsers).toEqual(['user1', 'user2', 'user3']);
      expect(tenant1Users).toEqual(['user4', 'user5']);
      expect(publicUsers).not.toEqual(tenant1Users);
    });
  });
});
