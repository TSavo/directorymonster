/**
 * Constants for role management
 */

// Redis keys for role management
export const GLOBAL_ROLES_KEY = 'global:roles';
export const GLOBAL_ROLE_USERS_KEY = 'global:role:users';
export const GLOBAL_ROLE_KEY_PREFIX = 'role:global:';
export const SYSTEM_TENANT_ID = 'system';

/**
 * Creates a key for storing a global role in Redis
 */
export function getGlobalRoleKey(roleId: string): string {
  return `${GLOBAL_ROLE_KEY_PREFIX}${roleId}`;
}
