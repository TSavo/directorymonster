/**
 * Utility functions for RoleService
 */

// Redis keys for global role management
export const GLOBAL_ROLES_KEY = 'global:roles';
export const GLOBAL_ROLE_USERS_KEY = 'global:role:users';
export const GLOBAL_ROLE_KEY_PREFIX = 'role:global:';

/**
 * Creates a key for storing a global role in Redis
 */
export function getGlobalRoleKey(roleId: string): string {
  return `${GLOBAL_ROLE_KEY_PREFIX}${roleId}`;
}

/**
 * Generates a universally unique identifier (UUID) string.
 *
 * This function first attempts to use `crypto.randomUUID` (available in Node.js v14.17.0+ and modern browsers).
 * If that is not available, it falls back to a manual implementation that produces a UUID compliant with version 4.
 *
 * @returns A UUID string.
 */
export function generateUUID(): string {
  // Use crypto.randomUUID if available (Node.js 14.17.0+ and modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for testing environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}