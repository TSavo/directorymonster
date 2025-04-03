import { redis } from '@/lib/redis-client';

/**
 * Interface for role data
 */
interface Role {
  id: string;
  name: string;
  permissions: string[];
  tenantId: string;
}

/**
 * Interface for user tenant membership
 */
interface TenantMembership {
  userId: string;
  tenantId: string;
  roles: string[];
  isActive: boolean;
}

/**
 * Service for managing access control in a multi-tenant environment
 */
export class ACLService {
  /**
   * Check if a user has a specific permission in a tenant
   *
   * @param userId The ID of the user
   * @param tenantId The ID of the tenant
   * @param permission The permission to check
   * @returns True if the user has the permission, false otherwise
   */
  static async hasPermission(userId: string, tenantId: string, permission: string): Promise<boolean> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';

      // First, check if the user is a member of the tenant
      const membershipKey = `${keyPrefix}user:${userId}:tenant:${tenantId}`;
      const membershipData = await redis.get(membershipKey);

      if (!membershipData) {
        return false; // User is not a member of this tenant
      }

      // Parse membership data
      let membership: TenantMembership;
      try {
        membership = typeof membershipData === 'string' ? JSON.parse(membershipData) : membershipData;
      } catch (e) {
        console.error(`Error parsing membership data for user ${userId} in tenant ${tenantId}:`, e);
        return false;
      }

      // Check if membership is active
      if (!membership.isActive) {
        return false; // Membership is not active
      }

      // Get the user's roles for this tenant
      const roleIds = membership.roles || [];

      if (!roleIds.length) {
        return false; // User has no roles in this tenant
      }

      // Fetch each role and check if it has the required permission
      for (const roleId of roleIds) {
        const roleKey = `${keyPrefix}role:${roleId}`;
        const roleData = await redis.get(roleKey);

        if (!roleData) continue;

        try {
          const role: Role = typeof roleData === 'string' ? JSON.parse(roleData) : roleData;

          // Ensure the role belongs to the correct tenant
          if (role.tenantId !== tenantId) {
            console.warn(`Role ${roleId} does not belong to tenant ${tenantId}`);
            continue;
          }

          if (role.permissions.includes(permission)) {
            return true;
          }
        } catch (e) {
          console.error(`Error parsing role data for ID ${roleId}:`, e);
          continue;
        }
      }

      return false;
    } catch (error) {
      console.error(`Error checking permission: ${error}`);
      return false;
    }
  }

  /**
   * Get all tenants that a user is a member of
   *
   * @param userId The ID of the user
   * @returns Array of tenant IDs
   */
  static async getUserTenants(userId: string): Promise<string[]> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';

      // Get all tenant memberships for the user
      const membershipKeys = await redis.keys(`${keyPrefix}user:${userId}:tenant:*`) || [];

      if (!membershipKeys.length) {
        return [];
      }

      // Extract tenant IDs from keys and fetch membership data
      const tenantIds: string[] = [];

      for (const key of membershipKeys) {
        // Extract tenant ID from key pattern user:{userId}:tenant:{tenantId}
        const tenantId = key.split(':').pop();
        if (!tenantId) continue;

        const membershipData = await redis.get(key);
        if (!membershipData) continue;

        try {
          const membership: TenantMembership = typeof membershipData === 'string'
            ? JSON.parse(membershipData)
            : membershipData;

          // Only include active memberships
          if (membership.isActive) {
            tenantIds.push(tenantId);
          }
        } catch (e) {
          console.error(`Error parsing membership data for key ${key}:`, e);
          continue;
        }
      }

      return tenantIds;
    } catch (error) {
      console.error(`Error getting user tenants: ${error}`);
      return [];
    }
  }

  /**
   * Check if a user is a member of a tenant
   *
   * @param userId The ID of the user
   * @param tenantId The ID of the tenant
   * @returns True if the user is a member of the tenant, false otherwise
   */
  static async isTenantMember(userId: string, tenantId: string): Promise<boolean> {
    try {
      // Determine if we're in test mode
      const isTestMode = process.env.NODE_ENV === 'test';
      const keyPrefix = isTestMode ? 'test:' : '';

      // Check if the user is a member of the tenant
      const membershipKey = `${keyPrefix}user:${userId}:tenant:${tenantId}`;
      const membershipData = await redis.get(membershipKey);

      if (!membershipData) {
        return false;
      }

      // Parse membership data
      try {
        const membership: TenantMembership = typeof membershipData === 'string'
          ? JSON.parse(membershipData)
          : membershipData;

        return membership.isActive;
      } catch (e) {
        console.error(`Error parsing membership data for user ${userId} in tenant ${tenantId}:`, e);
        return false;
      }
    } catch (error) {
      console.error(`Error checking tenant membership: ${error}`);
      return false;
    }
  }
}
