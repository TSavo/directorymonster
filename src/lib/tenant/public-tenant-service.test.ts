/**
 * PublicTenantService Tests
 * 
 * Tests for the PublicTenantService which manages the public tenant.
 */

import { PublicTenantService } from './public-tenant-service';
import TenantService from './tenant-service';
import TenantMembershipService from '@/lib/tenant-membership-service';
import { redis, kv } from '@/lib/redis-client';

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
    it('should add a user to the public tenant without a role', async () => {
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
      
      // Check that the user was added to the tenant WITHOUT a role
      expect(TenantMembershipService.addUserToTenant).toHaveBeenCalledWith(
        'user123',
        'public'
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
});
