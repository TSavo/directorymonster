/**
 * PublicTenantService Tests
 * 
 * Tests for the PublicTenantService which manages users in the public tenant.
 */

import { PublicTenantService } from './public-tenant-service';
import TenantService from './tenant-service';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { redis, kv } from '@/lib/redis-client';
import RoleService from '@/lib/role';

// Mock the dependencies
jest.mock('./tenant-service');
jest.mock('@/lib/tenant-membership-service');
jest.mock('@/lib/redis-client', () => ({
  redis: {
    sadd: jest.fn().mockResolvedValue(true),
    smembers: jest.fn().mockResolvedValue([]),
  },
  kv: {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn(),
  },
}));
jest.mock('@/lib/role');

describe('PublicTenantService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensurePublicTenant', () => {
    it('should return existing tenant if it exists', async () => {
      // Mock the TenantService.getTenantById to return an existing tenant
      const mockTenant = {
        id: 'public',
        slug: 'public',
        name: 'Public Tenant',
        hostnames: ['public.directorymonster.local'],
        primaryHostname: 'public.directorymonster.local',
        theme: 'default',
        settings: {},
        active: true,
        createdAt: '2025-04-02T00:00:00.000Z',
        updatedAt: '2025-04-02T00:00:00.000Z',
      };
      
      (TenantService.getTenantById as jest.Mock).mockResolvedValue(mockTenant);
      
      const result = await PublicTenantService.ensurePublicTenant();
      
      // Check that the tenant service was called with the correct ID
      expect(TenantService.getTenantById).toHaveBeenCalledWith('public');
      
      // Check that the result is the mock tenant
      expect(result).toEqual(mockTenant);
      
      // Make sure other methods weren't called
      expect(kv.set).not.toHaveBeenCalled();
      expect(redis.sadd).not.toHaveBeenCalled();
    });

    it('should create a new public tenant if it does not exist', async () => {
      // Mock that the tenant does not exist
      (TenantService.getTenantById as jest.Mock).mockResolvedValue(null);
      (TenantService.normalizeHostname as jest.Mock).mockImplementation(
        hostname => hostname
      );
      
      // Mock the ensurePublicMemberRole method
      const ensureRoleSpy = jest.spyOn(
        PublicTenantService as any, 
        'ensurePublicMemberRole'
      ).mockResolvedValue(undefined);
      
      // Call the method
      const result = await PublicTenantService.ensurePublicTenant();
      
      // Check that the tenant was created with the correct data
      expect(kv.set).toHaveBeenCalledWith(
        'tenant:public',
        expect.objectContaining({
          id: 'public',
          slug: 'public',
          name: 'Public Tenant',
        })
      );
      
      // Check that the tenant was added to the set of all tenants
      expect(redis.sadd).toHaveBeenCalledWith('tenants:all', 'public');
      
      // Check that the hostname lookups were created
      expect(kv.set).toHaveBeenCalledWith(
        'hostname:public.directorymonster.local',
        'public'
      );
      
      // Check that the public member role was created
      expect(ensureRoleSpy).toHaveBeenCalled();
      
      // Check the returned tenant
      expect(result).toEqual(
        expect.objectContaining({
          id: 'public',
          slug: 'public',
          name: 'Public Tenant',
        })
      );
    });

    it('should handle errors during tenant creation', async () => {
      // Mock that the tenant does not exist
      (TenantService.getTenantById as jest.Mock).mockResolvedValue(null);
      
      // Mock an error during tenant creation
      (kv.set as jest.Mock).mockRejectedValue(new Error('Database error'));
      
      // Check that the error is thrown
      await expect(PublicTenantService.ensurePublicTenant()).rejects.toThrow(
        'Failed to ensure public tenant exists'
      );
    });
  });

  describe('addUserToPublicTenant', () => {
    it('should add a user to the public tenant', async () => {
      // Mock the dependencies
      const mockEnsureTenant = jest.spyOn(
        PublicTenantService,
        'ensurePublicTenant'
      ).mockResolvedValue({} as any);
      
      (TenantMembershipService.addUserToTenant as jest.Mock).mockResolvedValue(true);
      
      // Call the method
      const result = await PublicTenantService.addUserToPublicTenant('user123');
      
      // Check that the tenant was ensured
      expect(mockEnsureTenant).toHaveBeenCalled();
      
      // Check that the user was added to the tenant
      expect(TenantMembershipService.addUserToTenant).toHaveBeenCalledWith(
        'user123',
        'public',
        'public-member'
      );
      
      // Check the result
      expect(result).toBe(true);
    });

    it('should handle errors when adding a user', async () => {
      // Mock an error
      jest.spyOn(PublicTenantService, 'ensurePublicTenant')
        .mockRejectedValue(new Error('Test error'));
      
      // Call the method
      const result = await PublicTenantService.addUserToPublicTenant('user123');
      
      // Check the result
      expect(result).toBe(false);
    });
  });

  describe('isOnlyInPublicTenant', () => {
    it('should return true if user is only in the public tenant', async () => {
      // Mock that the user is only in the public tenant
      (TenantMembershipService.getUserTenants as jest.Mock).mockResolvedValue([
        { id: 'public', name: 'Public Tenant' }
      ]);
      
      // Call the method
      const result = await PublicTenantService.isOnlyInPublicTenant('user123');
      
      // Check the result
      expect(result).toBe(true);
    });

    it('should return false if user is in multiple tenants', async () => {
      // Mock that the user is in multiple tenants
      (TenantMembershipService.getUserTenants as jest.Mock).mockResolvedValue([
        { id: 'public', name: 'Public Tenant' },
        { id: 'tenant1', name: 'Tenant 1' }
      ]);
      
      // Call the method
      const result = await PublicTenantService.isOnlyInPublicTenant('user123');
      
      // Check the result
      expect(result).toBe(false);
    });

    it('should return false if user is not in the public tenant', async () => {
      // Mock that the user is not in the public tenant
      (TenantMembershipService.getUserTenants as jest.Mock).mockResolvedValue([
        { id: 'tenant1', name: 'Tenant 1' }
      ]);
      
      // Call the method
      const result = await PublicTenantService.isOnlyInPublicTenant('user123');
      
      // Check the result
      expect(result).toBe(false);
    });

    it('should handle errors when checking user tenants', async () => {
      // Mock an error
      (TenantMembershipService.getUserTenants as jest.Mock).mockRejectedValue(
        new Error('Failed to get user tenants')
      );
      
      // Call the method
      const result = await PublicTenantService.isOnlyInPublicTenant('user123');
      
      // Check the result
      expect(result).toBe(false);
    });
  });

  describe('getPublicOnlyUsers', () => {
    it('should return users who are only in the public tenant', async () => {
      // Mock the dependencies
      const allPublicUsers = ['user1', 'user2', 'user3'];
      (TenantMembershipService.getTenantUsers as jest.Mock).mockResolvedValue(allPublicUsers);
      
      // Mock the isOnlyInPublicTenant method
      const mockIsOnlyInPublicTenant = jest.spyOn(
        PublicTenantService,
        'isOnlyInPublicTenant'
      );
      mockIsOnlyInPublicTenant.mockImplementation(async (userId) => {
        // user1 and user3 are only in public tenant
        return userId === 'user1' || userId === 'user3';
      });
      
      // Call the method
      const result = await PublicTenantService.getPublicOnlyUsers();
      
      // Check that the tenant users were retrieved
      expect(TenantMembershipService.getTenantUsers).toHaveBeenCalledWith('public');
      
      // Check that each user was checked
      expect(mockIsOnlyInPublicTenant).toHaveBeenCalledTimes(3);
      expect(mockIsOnlyInPublicTenant).toHaveBeenCalledWith('user1');
      expect(mockIsOnlyInPublicTenant).toHaveBeenCalledWith('user2');
      expect(mockIsOnlyInPublicTenant).toHaveBeenCalledWith('user3');
      
      // Check the result
      expect(result).toEqual(['user1', 'user3']);
    });

    it('should return empty array when there are no public users', async () => {
      // Mock no users in public tenant
      (TenantMembershipService.getTenantUsers as jest.Mock).mockResolvedValue([]);
      
      // Call the method
      const result = await PublicTenantService.getPublicOnlyUsers();
      
      // Check the result
      expect(result).toEqual([]);
    });

    it('should handle errors when getting tenant users', async () => {
      // Mock an error
      (TenantMembershipService.getTenantUsers as jest.Mock).mockRejectedValue(
        new Error('Failed to get tenant users')
      );
      
      // Call the method
      const result = await PublicTenantService.getPublicOnlyUsers();
      
      // Check the result
      expect(result).toEqual([]);
    });
  });

  describe('transferUserToTenant', () => {
    it('should transfer a user to another tenant', async () => {
      // Mock successful operations
      (TenantMembershipService.addUserToTenant as jest.Mock).mockResolvedValue(true);
      (TenantMembershipService.removeUserFromTenant as jest.Mock).mockResolvedValue(true);
      
      // Call the method - keep in public tenant
      const result1 = await PublicTenantService.transferUserToTenant(
        'user123',
        'tenant1',
        'role1',
        false // don't remove from public
      );
      
      // Check that the user was added to the target tenant
      expect(TenantMembershipService.addUserToTenant).toHaveBeenCalledWith(
        'user123',
        'tenant1',
        'role1'
      );
      
      // Check that the user was not removed from the public tenant
      expect(TenantMembershipService.removeUserFromTenant).not.toHaveBeenCalled();
      
      // Check the result
      expect(result1).toBe(true);
      
      // Reset mocks
      jest.clearAllMocks();
      (TenantMembershipService.addUserToTenant as jest.Mock).mockResolvedValue(true);
      (TenantMembershipService.removeUserFromTenant as jest.Mock).mockResolvedValue(true);
      
      // Call the method - remove from public tenant
      const result2 = await PublicTenantService.transferUserToTenant(
        'user123',
        'tenant1',
        'role1',
        true // remove from public
      );
      
      // Check that the user was added to the target tenant
      expect(TenantMembershipService.addUserToTenant).toHaveBeenCalledWith(
        'user123',
        'tenant1',
        'role1'
      );
      
      // Check that the user was removed from the public tenant
      expect(TenantMembershipService.removeUserFromTenant).toHaveBeenCalledWith(
        'user123',
        'public'
      );
      
      // Check the result
      expect(result2).toBe(true);
    });

    it('should handle errors when adding user to target tenant', async () => {
      // Mock failure when adding to target tenant
      (TenantMembershipService.addUserToTenant as jest.Mock).mockResolvedValue(false);
      
      // Call the method
      const result = await PublicTenantService.transferUserToTenant(
        'user123',
        'tenant1',
        'role1'
      );
      
      // Check that the user was not removed from the public tenant
      expect(TenantMembershipService.removeUserFromTenant).not.toHaveBeenCalled();
      
      // Check the result
      expect(result).toBe(false);
    });

    it('should handle errors during transfer', async () => {
      // Mock an error
      (TenantMembershipService.addUserToTenant as jest.Mock).mockRejectedValue(
        new Error('Failed to add user to tenant')
      );
      
      // Call the method
      const result = await PublicTenantService.transferUserToTenant(
        'user123',
        'tenant1',
        'role1'
      );
      
      // Check the result
      expect(result).toBe(false);
    });
  });

  describe('getUserPrimaryTenant', () => {
    it('should return a non-public tenant as primary if available', async () => {
      // Mock multiple tenants with public and non-public
      (TenantMembershipService.getUserTenants as jest.Mock).mockResolvedValue([
        { id: 'public', name: 'Public Tenant' },
        { id: 'tenant1', name: 'Tenant 1' }
      ]);
      
      // Call the method
      const result = await PublicTenantService.getUserPrimaryTenant('user123');
      
      // Check that the first non-public tenant is returned
      expect(result).toBe('tenant1');
    });

    it('should return the public tenant if only tenant available', async () => {
      // Mock only public tenant
      (TenantMembershipService.getUserTenants as jest.Mock).mockResolvedValue([
        { id: 'public', name: 'Public Tenant' }
      ]);
      
      // Call the method
      const result = await PublicTenantService.getUserPrimaryTenant('user123');
      
      // Check that the public tenant is returned
      expect(result).toBe('public');
    });

    it('should return null if user has no tenants', async () => {
      // Mock no tenants
      (TenantMembershipService.getUserTenants as jest.Mock).mockResolvedValue([]);
      
      // Call the method
      const result = await PublicTenantService.getUserPrimaryTenant('user123');
      
      // Check that null is returned
      expect(result).toBe(null);
    });

    it('should handle errors when getting user tenants', async () => {
      // Mock an error
      (TenantMembershipService.getUserTenants as jest.Mock).mockRejectedValue(
        new Error('Failed to get user tenants')
      );
      
      // Call the method
      const result = await PublicTenantService.getUserPrimaryTenant('user123');
      
      // Check that null is returned
      expect(result).toBe(null);
    });
  });
});
