/**
 * PublicTenantService
 * 
 * Implements a "Public Tenant" system to support the user onboarding flow.
 * The Public Tenant serves as a default landing space for all new users before
 * they are explicitly assigned to specific tenants.
 */

import { redis, kv } from '@/lib/redis-client';
import TenantService, { TenantConfig } from './tenant-service';
import TenantMembershipService from '@/lib/tenant-membership-service';
import RoleService from '@/lib/role';
import { getUserRolesKey } from '@/components/admin/auth/utils/roles';

/**
 * PublicTenantService provides methods for managing the public tenant
 * and the assignment of users to it.
 */
export class PublicTenantService {
  // Constants for the public tenant
  static PUBLIC_TENANT_ID = 'public';
  static PUBLIC_MEMBER_ROLE_ID = 'public-member';
  
  /**
   * Ensure the public tenant exists, creating it if necessary
   * @returns The public tenant configuration
   */
  static async ensurePublicTenant(): Promise<TenantConfig> {
    try {
      // Check if the public tenant already exists
      const existingTenant = await TenantService.getTenantById(this.PUBLIC_TENANT_ID);
      
      if (existingTenant) {
        return existingTenant;
      }
      
      // Create the public tenant
      const publicTenant: Omit<TenantConfig, 'id' | 'createdAt' | 'updatedAt'> = {
        slug: 'public',
        name: 'Public Tenant',
        hostnames: ['public.directorymonster.local'],
        primaryHostname: 'public.directorymonster.local',
        theme: 'default',
        settings: {
          isPublicTenant: true,
          description: 'Default tenant for new users',
          showInTenantSelector: true
        },
        active: true,
      };
      
      // Use direct Redis operations to set the tenant ID to our predefined value
      // rather than generating a new one in TenantService.createTenant
      const tenant: TenantConfig = {
        ...publicTenant,
        id: this.PUBLIC_TENANT_ID,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Store the tenant with the predefined ID
      await kv.set(`tenant:${this.PUBLIC_TENANT_ID}`, tenant);
      
      // Add to the set of all tenants
      await redis.sadd('tenants:all', this.PUBLIC_TENANT_ID);
      
      // Create hostname lookups
      for (const hostname of publicTenant.hostnames) {
        const normalizedHostname = TenantService.normalizeHostname(hostname);
        await kv.set(`hostname:${normalizedHostname}`, this.PUBLIC_TENANT_ID);
      }
      
      // Create the public member role if it doesn't exist
      await this.ensurePublicMemberRole();
      
      return tenant;
    } catch (error) {
      console.error('Error ensuring public tenant exists:', error);
      throw new Error('Failed to ensure public tenant exists');
    }
  }
  
  /**
   * Create the public member role if it doesn't exist
   */
  private static async ensurePublicMemberRole(): Promise<void> {
    try {
      // Check if the role already exists
      const existingRole = await RoleService.getRole(
        this.PUBLIC_TENANT_ID,
        this.PUBLIC_MEMBER_ROLE_ID
      );
      
      if (existingRole) {
        return;
      }
      
      // Create public member role with minimal permissions
      await RoleService.createRole({
        id: this.PUBLIC_MEMBER_ROLE_ID,
        tenantId: this.PUBLIC_TENANT_ID,
        name: 'Public Member',
        description: 'Default role for users in the public tenant',
        permissions: [
          {
            resourceType: 'profile',
            actions: ['view', 'edit']
          },
          {
            resourceType: 'tenant',
            actions: ['view']
          }
        ]
      });
    } catch (error) {
      console.error('Error ensuring public member role exists:', error);
      throw new Error('Failed to ensure public member role exists');
    }
  }
  
  /**
   * Add a user to the public tenant with the default role
   * @param userId User ID to add to the public tenant
   * @returns true if successful, false otherwise
   */
  static async addUserToPublicTenant(userId: string): Promise<boolean> {
    try {
      // Ensure the public tenant exists
      await this.ensurePublicTenant();
      
      // Add user to the public tenant
      const success = await TenantMembershipService.addUserToTenant(
        userId,
        this.PUBLIC_TENANT_ID,
        this.PUBLIC_MEMBER_ROLE_ID
      );
      
      return success;
    } catch (error) {
      console.error(`Error adding user ${userId} to public tenant:`, error);
      return false;
    }
  }
  
  /**
   * Check if a user is only in the public tenant (not assigned to other tenants)
   * @param userId User ID to check
   * @returns true if the user is only in the public tenant
   */
  static async isOnlyInPublicTenant(userId: string): Promise<boolean> {
    try {
      // Get all tenants the user is a member of
      const userTenants = await TenantMembershipService.getUserTenants(userId);
      
      // If the user is only in one tenant and it's the public tenant
      return userTenants.length === 1 && 
             userTenants[0].id === this.PUBLIC_TENANT_ID;
    } catch (error) {
      console.error(`Error checking if user ${userId} is only in public tenant:`, error);
      return false;
    }
  }
  
  /**
   * Get all users who are only in the public tenant
   * @returns Array of user IDs
   */
  static async getPublicOnlyUsers(): Promise<string[]> {
    try {
      // Get all users in the public tenant
      const allPublicUsers = await TenantMembershipService.getTenantUsers(
        this.PUBLIC_TENANT_ID
      );
      
      // Filter to only include users who are only in the public tenant
      const publicOnlyUsers: string[] = [];
      
      for (const userId of allPublicUsers) {
        if (await this.isOnlyInPublicTenant(userId)) {
          publicOnlyUsers.push(userId);
        }
      }
      
      return publicOnlyUsers;
    } catch (error) {
      console.error('Error getting users who are only in public tenant:', error);
      return [];
    }
  }
  
  /**
   * Transfer a user from public tenant to a specific tenant
   * @param userId User ID to transfer
   * @param targetTenantId Tenant ID to transfer to
   * @param roleId Role ID to assign in the target tenant
   * @param removeFromPublic Whether to remove from public tenant
   * @returns true if successful, false otherwise
   */
  static async transferUserToTenant(
    userId: string,
    targetTenantId: string,
    roleId: string,
    removeFromPublic: boolean = false
  ): Promise<boolean> {
    try {
      // Add user to the target tenant with the specified role
      const addSuccess = await TenantMembershipService.addUserToTenant(
        userId,
        targetTenantId,
        roleId
      );
      
      if (!addSuccess) {
        return false;
      }
      
      // If requested, remove from the public tenant
      if (removeFromPublic) {
        return await TenantMembershipService.removeUserFromTenant(
          userId,
          this.PUBLIC_TENANT_ID
        );
      }
      
      return true;
    } catch (error) {
      console.error(`Error transferring user ${userId} to tenant ${targetTenantId}:`, error);
      return false;
    }
  }
  
  /**
   * Get a user's primary tenant, prioritizing non-public tenants
   * @param userId User ID to check
   * @returns The primary tenant ID or null if not found
   */
  static async getUserPrimaryTenant(userId: string): Promise<string | null> {
    try {
      // Get all tenants the user is a member of
      const userTenants = await TenantMembershipService.getUserTenants(userId);
      
      if (userTenants.length === 0) {
        return null;
      }
      
      // Prioritize non-public tenants
      const nonPublicTenants = userTenants.filter(
        tenant => tenant.id !== this.PUBLIC_TENANT_ID
      );
      
      // If there are non-public tenants, return the first one
      if (nonPublicTenants.length > 0) {
        return nonPublicTenants[0].id;
      }
      
      // Otherwise, return the public tenant
      return this.PUBLIC_TENANT_ID;
    } catch (error) {
      console.error(`Error getting primary tenant for user ${userId}:`, error);
      return null;
    }
  }
}

export default PublicTenantService;
