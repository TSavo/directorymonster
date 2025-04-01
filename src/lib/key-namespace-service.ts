/**
 * Key Namespace Service
 * 
 * Provides consistent key namespacing for Redis operations to ensure proper tenant 
 * data isolation. This is a crucial security measure to prevent cross-tenant data access.
 * 
 * Part of the Cross-Tenant Attack Prevention implementation (Issue #58)
 */

import { AuditService } from '@/lib/audit/audit-service';
import crypto from 'crypto';

// Delimiter character used to separate namespace components
const NAMESPACE_DELIMITER = ':';

// Default namespace for system-wide keys (not tenant-specific)
const SYSTEM_NAMESPACE = 'system';

/**
 * Enum representing various key resource types for consistent naming
 */
export enum KeyResourceType {
  USER = 'user',
  ROLE = 'role',
  SITE = 'site',
  CATEGORY = 'category',
  LISTING = 'listing',
  TENANT = 'tenant',
  PERMISSION = 'permission',
  AUDIT = 'audit',
  SETTINGS = 'settings',
  CONFIG = 'config',
  SESSION = 'session',
  CACHE = 'cache',
  HOSTNAME = 'hostname',
  SEARCH = 'search',
  RESOURCE = 'resource',
}

/**
 * Interface for key components used to build namespaced keys
 */
export interface KeyComponents {
  tenantId: string;
  resourceType: KeyResourceType | string;
  resourceId?: string;
  subType?: string;
  action?: string;
}

/**
 * Service that provides consistent key namespacing for Redis operations
 * to ensure proper tenant data isolation and prevent cross-tenant access
 */
export class KeyNamespaceService {
  /**
   * Generate a tenant-namespaced key to ensure proper data isolation
   * 
   * @param components Key components to use in generating the namespaced key
   * @returns Properly namespaced Redis key
   */
  static getNamespacedKey(components: KeyComponents): string {
    const { tenantId, resourceType, resourceId, subType, action } = components;
    
    // Validate tenant ID format for security (part of Tenant ID Protection)
    if (!KeyNamespaceService.isValidTenantId(tenantId) && tenantId !== SYSTEM_NAMESPACE) {
      console.warn(`Invalid tenant ID format: ${tenantId}`);
    }
    
    // Build key parts array, filtering out undefined/null values
    const keyParts = [
      tenantId,
      resourceType,
      subType,
      resourceId,
      action
    ].filter(Boolean);
    
    // Join with namespace delimiter
    return keyParts.join(NAMESPACE_DELIMITER);
  }
  
  /**
   * Generate a system-level key (not tenant-specific)
   * 
   * IMPORTANT: Only use for truly global data that should be accessible across tenants.
   * Most data should be tenant-specific for security isolation.
   * 
   * @param resourceType Type of resource
   * @param resourceId Optional resource identifier
   * @param subType Optional sub-type or category
   * @returns System-level Redis key
   */
  static getSystemKey(
    resourceType: KeyResourceType | string,
    resourceId?: string,
    subType?: string
  ): string {
    // Build key parts array, filtering out undefined/null values
    const keyParts = [
      SYSTEM_NAMESPACE,
      resourceType,
      subType,
      resourceId
    ].filter(Boolean);
    
    // Join with namespace delimiter
    return keyParts.join(NAMESPACE_DELIMITER);
  }
  
  /**
   * Generate a secure UUID for tenant ID
   * 
   * Uses version 4 UUIDs which are cryptographically random and 
   * difficult to guess, enhancing security of tenant IDs.
   * 
   * @returns A cryptographically secure UUID string
   */
  static generateSecureTenantId(): string {
    return crypto.randomUUID();
  }
  
  /**
   * Validate a tenant ID format
   * 
   * Ensures tenant IDs follow the expected UUID format to 
   * prevent injection attacks or malformed IDs.
   * 
   * @param tenantId The tenant ID to validate
   * @returns True if the ID is a valid UUID, false otherwise
   */
  static isValidTenantId(tenantId: string): boolean {
    // Basic UUID validation pattern (version 4 UUID)
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidV4Pattern.test(tenantId);
  }
  
  /**
   * Get hostname mapping key (special case that maps hostnames to tenant IDs)
   * 
   * @param hostname The hostname to create a key for
   * @returns Redis key for hostname mapping
   */
  static getHostnameKey(hostname: string): string {
    return `${KeyResourceType.HOSTNAME}${NAMESPACE_DELIMITER}${hostname}`;
  }
  
  /**
   * Get the tenant key prefix for pattern-based operations
   * 
   * @param tenantId Tenant identifier
   * @returns Key prefix for the tenant
   */
  static getTenantKeyPrefix(tenantId: string): string {
    return `${tenantId}${NAMESPACE_DELIMITER}`;
  }
  
  /**
   * Get a tenant key with proper namespace
   * 
   * @param tenantId Tenant identifier
   * @param resourceId Optional resource identifier
   * @returns Namespaced tenant key
   */
  static getTenantKey(tenantId: string, resourceId?: string): string {
    return KeyNamespaceService.getNamespacedKey({
      tenantId: SYSTEM_NAMESPACE, // Tenant IDs are stored at system level
      resourceType: KeyResourceType.TENANT,
      resourceId: resourceId || tenantId
    });
  }
  
  /**
   * Get a user-related key with proper tenant namespace
   * 
   * @param tenantId Tenant identifier
   * @param userId User identifier
   * @param subType Optional sub-type (e.g., 'roles', 'settings')
   * @returns Namespaced user key
   */
  static getUserKey(tenantId: string, userId: string, subType?: string): string {
    return KeyNamespaceService.getNamespacedKey({
      tenantId,
      resourceType: KeyResourceType.USER,
      resourceId: userId,
      subType
    });
  }
  
  /**
   * Get a role-related key with proper tenant namespace
   * 
   * @param tenantId Tenant identifier
   * @param roleId Role identifier
   * @param subType Optional sub-type (e.g., 'permissions', 'users')
   * @returns Namespaced role key
   */
  static getRoleKey(tenantId: string, roleId: string, subType?: string): string {
    return KeyNamespaceService.getNamespacedKey({
      tenantId,
      resourceType: KeyResourceType.ROLE,
      resourceId: roleId,
      subType
    });
  }
  
  /**
   * Get a key for tenant users (users in a specific tenant)
   * 
   * @param tenantId Tenant identifier
   * @returns Namespaced tenant users key
   */
  static getTenantUsersKey(tenantId: string): string {
    return KeyNamespaceService.getNamespacedKey({
      tenantId,
      resourceType: KeyResourceType.TENANT,
      subType: 'users'
    });
  }
  
  /**
   * Get a key for user roles in a specific tenant
   * 
   * @param userId User identifier
   * @param tenantId Tenant identifier
   * @returns Namespaced user roles key
   */
  static getUserRolesKey(userId: string, tenantId: string): string {
    return KeyNamespaceService.getNamespacedKey({
      tenantId,
      resourceType: KeyResourceType.USER,
      resourceId: userId,
      subType: 'roles'
    });
  }
  
  /**
   * Get all global roles key (for roles that apply across tenants but with restrictions)
   * 
   * @returns Namespaced global roles key
   */
  static getGlobalRolesKey(): string {
    return KeyNamespaceService.getSystemKey(KeyResourceType.ROLE, 'global');
  }
  
  /**
   * Get a key pattern for all user roles across all tenants
   * 
   * @param userId User identifier
   * @returns Key pattern for all user roles
   */
  static getAllUserRolesPattern(userId: string): string {
    return `*${NAMESPACE_DELIMITER}${KeyResourceType.USER}${NAMESPACE_DELIMITER}${userId}${NAMESPACE_DELIMITER}roles`;
  }
  
  /**
   * Get a key for audit events in a specific tenant
   * 
   * @param tenantId Tenant identifier
   * @param eventId Optional specific event ID
   * @returns Namespaced audit event key
   */
  static getAuditEventKey(tenantId: string, eventId?: string): string {
    return KeyNamespaceService.getNamespacedKey({
      tenantId,
      resourceType: KeyResourceType.AUDIT,
      resourceId: eventId,
      subType: 'event'
    });
  }
  
  /**
   * Get a key for tenant settings
   * 
   * @param tenantId Tenant identifier
   * @param settingKey Optional specific setting key
   * @returns Namespaced tenant settings key
   */
  static getTenantSettingsKey(tenantId: string, settingKey?: string): string {
    return KeyNamespaceService.getNamespacedKey({
      tenantId,
      resourceType: KeyResourceType.SETTINGS,
      resourceId: settingKey
    });
  }
  
  /**
   * Validate that two keys belong to the same tenant to prevent cross-tenant operations
   * 
   * @param key1 First Redis key
   * @param key2 Second Redis key
   * @param userId Optional user ID for audit logging
   * @returns true if keys belong to the same tenant, false otherwise
   */
  static async validateSameTenant(key1: string, key2: string, userId?: string): Promise<boolean> {
    // Extract tenant IDs from keys
    const tenantId1 = KeyNamespaceService.extractTenantId(key1);
    const tenantId2 = KeyNamespaceService.extractTenantId(key2);
    
    // Check if both keys are system keys (no tenant validation needed)
    if (tenantId1 === SYSTEM_NAMESPACE && tenantId2 === SYSTEM_NAMESPACE) {
      return true;
    }
    
    // If one is system and one is tenant-specific, that's a potential issue
    if (tenantId1 === SYSTEM_NAMESPACE || tenantId2 === SYSTEM_NAMESPACE) {
      // This is acceptable in some cases, but we should log it for audit
      if (userId) {
        await AuditService.logSecurityEvent(
          userId,
          tenantId1 === SYSTEM_NAMESPACE ? tenantId2 : tenantId1,
          'security',
          'system-tenant-key-access',
          {
            systemKey: tenantId1 === SYSTEM_NAMESPACE ? key1 : key2,
            tenantKey: tenantId1 === SYSTEM_NAMESPACE ? key2 : key1
          }
        );
      }
      
      // Allow system to tenant access as it's a common pattern
      return true;
    }
    
    // Check if tenants match
    const sameTenant = tenantId1 === tenantId2;
    
    // Log cross-tenant access attempts
    if (!sameTenant && userId) {
      await AuditService.logSecurityEvent(
        userId,
        tenantId1, // Use the first tenant ID for the audit context
        'security',
        'cross-tenant-key-access-attempt',
        {
          key1,
          key2,
          tenantId1,
          tenantId2
        }
      );
    }
    
    return sameTenant;
  }
  
  /**
   * Extract tenant ID from a namespaced key
   * 
   * @param key Redis key to extract tenant ID from
   * @returns Tenant ID or system namespace
   */
  static extractTenantId(key: string): string {
    if (!key.includes(NAMESPACE_DELIMITER)) {
      return SYSTEM_NAMESPACE;
    }
    
    // First part before delimiter is the tenant ID
    return key.split(NAMESPACE_DELIMITER)[0];
  }
  
  /**
   * Extract resource type from a namespaced key
   * 
   * @param key Redis key to extract resource type from
   * @returns Resource type or undefined
   */
  static extractResourceType(key: string): string | undefined {
    if (!key.includes(NAMESPACE_DELIMITER)) {
      return undefined;
    }
    
    // Second part is usually the resource type
    const parts = key.split(NAMESPACE_DELIMITER);
    return parts.length > 1 ? parts[1] : undefined;
  }
  
  /**
   * Generate a user session key (with tenant context)
   * 
   * @param sessionId Session identifier
   * @param tenantId Optional tenant context (recommended)
   * @returns Namespaced session key
   */
  static getSessionKey(sessionId: string, tenantId?: string): string {
    if (tenantId) {
      return KeyNamespaceService.getNamespacedKey({
        tenantId,
        resourceType: KeyResourceType.SESSION,
        resourceId: sessionId
      });
    } else {
      // Fall back to system namespace if no tenant provided
      return KeyNamespaceService.getSystemKey(KeyResourceType.SESSION, sessionId);
    }
  }
}

export default KeyNamespaceService;