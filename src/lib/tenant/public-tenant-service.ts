/**
 * PublicTenantService
 * 
 * Implements a "Public Tenant" system to support the user onboarding flow.
 * The Public Tenant serves as a default landing space for all new users before
 * they are explicitly assigned to specific tenants.
 * 
 * This service is ONLY responsible for:
 * 1. Ensuring the public tenant exists with the correct configuration
 * 2. Adding new users to the public tenant (delegating to TenantMembershipService)
 */

import { redis, kv } from '@/lib/redis-client';
import TenantService, { TenantConfig } from './tenant-service';
import TenantMembershipService from '@/lib/tenant-membership-service';

/**
 * PublicTenantService provides methods for managing the public tenant.
 */
export class PublicTenantService {
  // Constants for the public tenant
  static PUBLIC_TENANT_ID = 'public';
  
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
      
      return tenant;
    } catch (error) {
      console.error('Error ensuring public tenant exists:', error);
      throw new Error('Failed to ensure public tenant exists');
    }
  }
  
  /**
   * Add a user to the public tenant
   * This delegates to TenantMembershipService for the actual tenant assignment
   * No roles are assigned since the public tenant doesn't use ACLs
   * 
   * @param userId User ID to add to the public tenant
   * @returns true if successful, false otherwise
   */
  static async addUserToPublicTenant(userId: string): Promise<boolean> {
    try {
      // Ensure the public tenant exists
      await this.ensurePublicTenant();
      
      // Add user to the public tenant
      // Delegate to TenantMembershipService for the actual tenant assignment
      // Note: No role is provided - public tenant users don't have specific roles
      const success = await TenantMembershipService.addUserToTenant(
        userId,
        this.PUBLIC_TENANT_ID
      );
      
      return success;
    } catch (error) {
      console.error(`Error adding user ${userId} to public tenant:`, error);
      return false;
    }
  }
}

export default PublicTenantService;
