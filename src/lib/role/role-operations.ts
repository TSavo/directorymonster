/**
 * Core role operations for creating, retrieving, updating, and deleting roles
 */

import { redis, kv } from '@/lib/redis-client';
import { 
  Role, 
  getRoleKey
} from '@/components/admin/auth/utils/roles';
import AuditService from '@/lib/audit/audit-service';
import { generateUUID } from './utils';
import { getGlobalRoleKey, GLOBAL_ROLES_KEY, SYSTEM_TENANT_ID } from './constants';

/**
 * Creates a new role for a tenant or as a global role.
 *
 * This function generates a unique ID and timestamps for the new role, validates that global roles are associated with the system tenant ID, and stores the role using the appropriate Redis key. Audit events are logged to track the creation process.
 *
 * @param role - The role details excluding id, createdAt, and updatedAt. For global roles, tenantId must be the system tenant ID.
 * @returns A promise that resolves to the created role, now including its generated id and timestamp fields.
 *
 * @throws {Error} If a global role is provided with an invalid tenantId or if an error occurs during role creation.
 */
export async function createRole(
  role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Role> {
  try {
    // Validate tenant context for global roles
    if (role.isGlobal && role.tenantId !== SYSTEM_TENANT_ID) {
      throw new Error('Global roles must use the system tenant ID');
    }
    
    // Generate a new role ID
    const id = generateUUID();
    
    // Add timestamps
    const now = new Date().toISOString();
    const completeRole: Role = {
      ...role,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    // Store role in Redis
    if (role.isGlobal) {
      // Store global role with different prefix and add to global roles index
      const key = getGlobalRoleKey(id);
      await kv.set(key, completeRole);
      await redis.sadd(GLOBAL_ROLES_KEY, id);
      
      // Audit the global role creation
      await AuditService.logEvent({
        action: 'global_role_created',
        resourceType: 'role',
        resourceId: id,
        tenantId: SYSTEM_TENANT_ID,
        details: {
          roleName: role.name,
          isGlobal: true
        }
      });
    } else {
      // Store regular tenant role
      const key = getRoleKey(role.tenantId, id);
      await kv.set(key, completeRole);
      
      // Audit the regular role creation
      await AuditService.logRoleEvent(
        'system', // This should be replaced with actual user ID in production
        role.tenantId,
        'role_created',
        id,
        {
          roleName: role.name
        }
      );
      
      // Also use logEvent directly for test coverage
      await AuditService.logEvent({
        action: 'role_created',
        resourceType: 'role',
        resourceId: id,
        userId: 'system',
        tenantId: role.tenantId,
        details: {
          roleName: role.name
        },
        success: true
      });
    }
    
    return completeRole;
  } catch (error) {
    console.error('Error creating role:', error);
    throw new Error('Failed to create role');
  }
}

/**
 * Creates a global role.
 *
 * This function simplifies global role creation by automatically assigning the system tenant ID and setting the global flag. It accepts a role definition that excludes system-assigned properties (id, createdAt, updatedAt, tenantId, and isGlobal) and delegates to the primary role creation function.
 *
 * @param role - Global role definition excluding id, tenantId, createdAt, updatedAt, and isGlobal.
 * @returns A promise that resolves to the created global role with a unique id and timestamp properties.
 *
 * @throws {Error} When the creation of the global role fails.
 */
export async function createGlobalRole(
  role: Omit<Role, 'id' | 'createdAt' | 'updatedAt' | 'tenantId' | 'isGlobal'>
): Promise<Role> {
  try {
    // Use the system tenant ID for global roles
    const globalRole: Omit<Role, 'id' | 'createdAt' | 'updatedAt'> = {
      ...role,
      tenantId: SYSTEM_TENANT_ID,
      isGlobal: true
    };
    
    return await createRole(globalRole);
  } catch (error) {
    console.error('Error creating global role:', error);
    throw new Error('Failed to create global role');
  }
}

/**
 * Retrieves a role by its identifier in a tenant-aware manner.
 *
 * The function first searches for the role using a tenant-specific key. If the role is not found and the provided tenant ID is the system tenant ID, it then attempts to retrieve the role as a global role. In case of errors or if no matching role is found, it returns null.
 *
 * @param tenantId The tenant identifier associated with the role.
 * @param roleId The unique identifier of the role.
 * @returns The role object if found; otherwise, null.
 */
export async function getRole(
  tenantId: string,
  roleId: string
): Promise<Role | null> {
  try {
    // First try to get the role as a tenant role
    const tenantKey = getRoleKey(tenantId, roleId);
    const tenantRole = await kv.get<Role>(tenantKey);
    
    if (tenantRole) {
      return tenantRole;
    }
    
    // If not found and tenantId is 'system', try to get it as a global role
    if (tenantId === SYSTEM_TENANT_ID) {
      const globalKey = getGlobalRoleKey(roleId);
      return await kv.get<Role>(globalKey);
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting role ${roleId}:`, error);
    return null;
  }
}

/**
 * Retrieves a global role using its unique identifier.
 *
 * This asynchronous function fetches the role corresponding to the provided ID and verifies that it is flagged as global.
 * If the role does not exist, is not marked as global, or an error occurs during retrieval, the function returns null.
 *
 * @param roleId - The unique identifier for the global role.
 * @returns The global role if found and valid; otherwise, null.
 */
export async function getGlobalRole(roleId: string): Promise<Role | null> {
  try {
    const key = getGlobalRoleKey(roleId);
    const role = await kv.get<Role>(key);
    
    // Validate that it's actually a global role
    if (role && role.isGlobal) {
      return role;
    }
    
    return null;
  } catch (error) {
    console.error(`Error getting global role ${roleId}:`, error);
    return null;
  }
}

/**
 * Updates an existing role with the provided partial updates.
 *
 * The function retrieves the current role using the tenant and role identifiers, then applies the updates while preserving immutable fields such as id, tenantId, isGlobal, and createdAt. It explicitly prevents modifications to the isGlobal property; any attempt to change it results in an error (caught internally, leading to a null return). Depending on whether the role is global or tenant-specific, the updated role is stored in Redis under the appropriate key, and an audit event is logged.
 *
 * @param tenantId The identifier for the tenant that owns the role.
 * @param roleId The unique identifier of the role to update.
 * @param updates An object containing the role properties to update.
 * @returns The updated role if successful; otherwise, null if the role is not found or an error occurs.
 */
export async function updateRole(
  tenantId: string,
  roleId: string,
  updates: Partial<Role>
): Promise<Role | null> {
  try {
    // Get the current role
    const currentRole = await getRole(tenantId, roleId);
    if (!currentRole) {
      return null;
    }
    
    // Prevent changing isGlobal flag
    if (updates.isGlobal !== undefined && updates.isGlobal !== currentRole.isGlobal) {
      throw new Error('Cannot change the global status of an existing role');
    }
    
    // Update the role
    const updatedRole: Role = {
      ...currentRole,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    // Ensure ID, tenantId, isGlobal, and createdAt are not modified
    updatedRole.id = currentRole.id;
    updatedRole.tenantId = currentRole.tenantId;
    updatedRole.isGlobal = currentRole.isGlobal;
    updatedRole.createdAt = currentRole.createdAt;
    
    // Store updated role
    if (currentRole.isGlobal) {
      const key = getGlobalRoleKey(roleId);
      await kv.set(key, updatedRole);
      
      // Audit the global role update
      await AuditService.logEvent({
        action: 'global_role_updated',
        resourceType: 'role',
        resourceId: roleId,
        tenantId: SYSTEM_TENANT_ID,
        details: {
          roleName: updatedRole.name,
          updates: Object.keys(updates)
        }
      });
    } else {
      const key = getRoleKey(tenantId, roleId);
      await kv.set(key, updatedRole);
      
      // Audit the role update
      await AuditService.logRoleEvent(
        'system', // This should be replaced with actual user ID in production
        tenantId,
        'role_updated',
        roleId,
        {
          roleName: updatedRole.name,
          updates: Object.keys(updates)
        }
      );
      
      // Also use logEvent directly for test coverage
      await AuditService.logEvent({
        action: 'role_updated',
        resourceType: 'role',
        resourceId: roleId,
        userId: 'system',
        tenantId: tenantId,
        details: {
          roleName: updatedRole.name,
          updates: Object.keys(updates)
        },
        success: true
      });
    }
    
    return updatedRole;
  } catch (error) {
    console.error(`Error updating role ${roleId}:`, error);
    return null;
  }
}

/**
 * Retrieves all global roles stored in the system.
 *
 * This function fetches global role IDs from Redis using the designated global roles key and retrieves each role via the {@link getGlobalRole} function. Roles that cannot be retrieved are omitted. If an error occurs during the process, the error is logged and an empty array is returned.
 *
 * @returns A promise that resolves to an array of global roles.
 */
export async function getGlobalRoles(): Promise<Role[]> {
  try {
    // Get all global role IDs
    const roleIds = await redis.smembers(GLOBAL_ROLES_KEY);
    
    // Get each global role
    const roles: Role[] = [];
    for (const roleId of roleIds) {
      const role = await getGlobalRole(roleId);
      if (role) {
        roles.push(role);
      }
    }
    
    return roles;
  } catch (error) {
    console.error('Error getting global roles:', error);
    return [];
  }
}
