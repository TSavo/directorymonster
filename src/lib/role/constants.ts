/**
 * Constants for role management
 */

// Redis keys for role management
export const GLOBAL_ROLES_KEY = 'global:roles';
export const GLOBAL_ROLE_USERS_KEY = 'global:role:users';
export const GLOBAL_ROLE_KEY_PREFIX = 'role:global:';
export const SYSTEM_TENANT_ID = 'system';

/**
 * Generates a Redis key for a global role.
 *
 * This function concatenates a predefined global role key prefix with the given role identifier,
 * producing a unique key for storing and retrieving global role entries in Redis.
 *
 * @param roleId - The unique identifier of the role.
 * @returns The Redis key composed of the global role key prefix and the role identifier.
 */
export function getGlobalRoleKey(roleId: string): string {
  return `${GLOBAL_ROLE_KEY_PREFIX}${roleId}`;
}
