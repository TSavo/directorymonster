/**
 * Secure Redis Client
 * 
 * A tenant-aware Redis client that enforces proper key namespacing
 * to prevent cross-tenant data access. This is a critical security
 * component for multi-tenant isolation.
 * 
 * Part of the Cross-Tenant Attack Prevention implementation (Issue #58)
 */

import { redis, kv } from './redis-client';
import { KeyNamespaceService } from './key-namespace-service';
import { AuditService } from './audit/audit-service';

/**
 * Interface for tenant context in Redis operations
 */
export interface TenantRedisContext {
  tenantId: string;
  userId?: string;  // Optional user ID for audit logging
}

/**
 * Secure Redis client that enforces tenant isolation through key namespacing
 */
export class SecureRedisClient {
  private tenantContext: TenantRedisContext;
  
  /**
   * Create a new secure Redis client with tenant context
   * 
   * @param tenantContext The tenant context for this Redis client
   */
  constructor(tenantContext: TenantRedisContext) {
    this.tenantContext = tenantContext;
  }
  
  /**
   * Get a value from Redis with tenant namespace protection
   * 
   * @param key The key to get (will be automatically namespaced)
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @returns The value or null if not found
   */
  async get<T>(key: string, resourceType: string, subType?: string): Promise<T | null> {
    const namespacedKey = KeyNamespaceService.getNamespacedKey({
      tenantId: this.tenantContext.tenantId,
      resourceType,
      resourceId: key,
      subType
    });
    
    try {
      // Use the underlying Redis client with the namespaced key
      const value = await redis.get(namespacedKey);
      if (!value) return null;
      
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`[SecureRedisClient.get] Error getting key ${namespacedKey}:`, error);
      return null;
    }
  }
  
  /**
   * Set a value in Redis with tenant namespace protection
   * 
   * @param key The key to set (will be automatically namespaced)
   * @param value The value to set
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @param options Optional Redis options like expiration
   * @returns void
   */
  async set<T>(
    key: string, 
    value: T, 
    resourceType: string, 
    subType?: string,
    options?: { ex?: number }
  ): Promise<void> {
    const namespacedKey = KeyNamespaceService.getNamespacedKey({
      tenantId: this.tenantContext.tenantId,
      resourceType,
      resourceId: key,
      subType
    });
    
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (options?.ex) {
        await redis.set(namespacedKey, serializedValue, 'EX', options.ex);
      } else {
        await redis.set(namespacedKey, serializedValue);
      }
    } catch (error) {
      console.error(`[SecureRedisClient.set] Error setting key ${namespacedKey}:`, error);
    }
  }
  
  /**
   * Delete a value from Redis with tenant namespace protection
   * 
   * @param key The key to delete (will be automatically namespaced)
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @returns void
   */
  async del(key: string, resourceType: string, subType?: string): Promise<void> {
    const namespacedKey = KeyNamespaceService.getNamespacedKey({
      tenantId: this.tenantContext.tenantId,
      resourceType,
      resourceId: key,
      subType
    });
    
    try {
      await redis.del(namespacedKey);
    } catch (error) {
      console.error(`[SecureRedisClient.del] Error deleting key ${namespacedKey}:`, error);
    }
  }
  
  /**
   * Get keys matching a pattern with tenant namespace protection
   * 
   * @param pattern The pattern to match
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @returns Array of matching keys (without namespace prefix)
   */
  async keys(pattern: string, resourceType: string, subType?: string): Promise<string[]> {
    // Create a namespaced pattern with tenant context
    const namespacedPattern = KeyNamespaceService.getNamespacedKey({
      tenantId: this.tenantContext.tenantId,
      resourceType,
      subType,
      resourceId: pattern
    });
    
    try {
      const keys = await redis.keys(namespacedPattern);
      
      // Remove tenant prefixes from the keys before returning
      return keys.map(key => {
        const parts = key.split(':');
        // Remove tenant and resource type from key
        // Extract only the resourceId part (everything after resourceType and optional subType)
        const prefixCount = subType ? 3 : 2; // tenant:resourceType:subType: or tenant:resourceType:
        return parts.slice(prefixCount).join(':');
      });
    } catch (error) {
      console.error(`[SecureRedisClient.keys] Error getting keys with pattern ${namespacedPattern}:`, error);
      return [];
    }
  }
  
  /**
   * Add members to a set with tenant namespace protection
   * 
   * @param key The set key (will be automatically namespaced)
   * @param values Values to add to the set
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @returns Number of members added
   */
  async sadd(key: string, values: any[], resourceType: string, subType?: string): Promise<number> {
    const namespacedKey = KeyNamespaceService.getNamespacedKey({
      tenantId: this.tenantContext.tenantId,
      resourceType,
      resourceId: key,
      subType
    });
    
    try {
      return await redis.sadd(namespacedKey, ...values);
    } catch (error) {
      console.error(`[SecureRedisClient.sadd] Error adding to set ${namespacedKey}:`, error);
      return 0;
    }
  }
  
  /**
   * Get all members of a set with tenant namespace protection
   * 
   * @param key The set key (will be automatically namespaced)
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @returns Array of set members
   */
  async smembers(key: string, resourceType: string, subType?: string): Promise<string[]> {
    const namespacedKey = KeyNamespaceService.getNamespacedKey({
      tenantId: this.tenantContext.tenantId,
      resourceType,
      resourceId: key,
      subType
    });
    
    try {
      return await redis.smembers(namespacedKey);
    } catch (error) {
      console.error(`[SecureRedisClient.smembers] Error getting members of set ${namespacedKey}:`, error);
      return [];
    }
  }
  
  /**
   * Remove members from a set with tenant namespace protection
   * 
   * @param key The set key (will be automatically namespaced)
   * @param members Members to remove from the set
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @returns Number of members removed
   */
  async srem(key: string, members: string[], resourceType: string, subType?: string): Promise<number> {
    const namespacedKey = KeyNamespaceService.getNamespacedKey({
      tenantId: this.tenantContext.tenantId,
      resourceType,
      resourceId: key,
      subType
    });
    
    try {
      return await redis.srem(namespacedKey, ...members);
    } catch (error) {
      console.error(`[SecureRedisClient.srem] Error removing from set ${namespacedKey}:`, error);
      return 0;
    }
  }
  
  /**
   * Get the intersection of multiple sets with tenant namespace protection
   * 
   * @param keys Set keys to intersect (will be automatically namespaced)
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @returns Array of members in the intersection
   */
  async sinter(keys: string[], resourceType: string, subType?: string): Promise<string[]> {
    try {
      const namespacedKeys = keys.map(key => 
        KeyNamespaceService.getNamespacedKey({
          tenantId: this.tenantContext.tenantId,
          resourceType,
          resourceId: key,
          subType
        })
      );
      
      return await redis.sinter(...namespacedKeys);
    } catch (error) {
      console.error(`[SecureRedisClient.sinter] Error getting set intersection:`, error);
      return [];
    }
  }
  
  /**
   * Count members in a set with tenant namespace protection
   * 
   * @param key The set key (will be automatically namespaced)
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @returns Number of members in the set
   */
  async scard(key: string, resourceType: string, subType?: string): Promise<number> {
    const namespacedKey = KeyNamespaceService.getNamespacedKey({
      tenantId: this.tenantContext.tenantId,
      resourceType,
      resourceId: key,
      subType
    });
    
    try {
      return await redis.scard(namespacedKey);
    } catch (error) {
      console.error(`[SecureRedisClient.scard] Error getting set cardinality ${namespacedKey}:`, error);
      return 0;
    }
  }
  
  /**
   * Set expiration on a key with tenant namespace protection
   * 
   * @param key The key to set expiration on (will be automatically namespaced)
   * @param seconds Seconds until expiration
   * @param resourceType The type of resource being accessed
   * @param subType Optional sub-type or category
   * @returns void
   */
  async expire(key: string, seconds: number, resourceType: string, subType?: string): Promise<void> {
    const namespacedKey = KeyNamespaceService.getNamespacedKey({
      tenantId: this.tenantContext.tenantId,
      resourceType,
      resourceId: key,
      subType
    });
    
    try {
      await redis.expire(namespacedKey, seconds);
    } catch (error) {
      console.error(`[SecureRedisClient.expire] Error setting expiry for key ${namespacedKey}:`, error);
    }
  }
  
  /**
   * Directly access a system-level key (not tenant-specific)
   * Use with caution - this bypasses tenant isolation!
   * 
   * @param key The system key
   * @param resourceType The type of resource being accessed
   * @param operation Description of the operation for audit logging
   * @returns Redis client for the system key
   */
  async accessSystemKey(key: string, resourceType: string, operation: string): Promise<any> {
    // Log this access for security auditing
    if (this.tenantContext.userId) {
      await AuditService.logSecurityEvent(
        this.tenantContext.userId,
        this.tenantContext.tenantId,
        'security',
        'system-key-access',
        {
          key,
          resourceType,
          operation,
        }
      );
    }
    
    const systemKey = KeyNamespaceService.getSystemKey(resourceType, key);
    return redis.get(systemKey);
  }
}

/**
 * Factory function to create a secure Redis client with tenant context
 * 
 * @param tenantContext The tenant context for this Redis client
 * @returns A secure Redis client instance
 */
export function createSecureRedisClient(tenantContext: TenantRedisContext): SecureRedisClient {
  return new SecureRedisClient(tenantContext);
}

/**
 * Secure KV interface for simple key-value operations with tenant isolation
 */
export function createSecureKV(tenantContext: TenantRedisContext) {
  const secureRedis = new SecureRedisClient(tenantContext);
  
  return {
    /**
     * Get a value from the key-value store with tenant isolation
     */
    get: async <T>(key: string, resourceType: string, subType?: string): Promise<T | null> => {
      return secureRedis.get<T>(key, resourceType, subType);
    },
    
    /**
     * Set a value in the key-value store with tenant isolation
     */
    set: async <T>(key: string, value: T, resourceType: string, subType?: string, options?: { ex?: number }): Promise<void> => {
      return secureRedis.set<T>(key, value, resourceType, subType, options);
    },
    
    /**
     * Delete a value from the key-value store with tenant isolation
     */
    del: async (key: string, resourceType: string, subType?: string): Promise<void> => {
      return secureRedis.del(key, resourceType, subType);
    },
    
    /**
     * Get keys matching a pattern with tenant isolation
     */
    keys: async (pattern: string, resourceType: string, subType?: string): Promise<string[]> => {
      return secureRedis.keys(pattern, resourceType, subType);
    },
    
    /**
     * Set expiration on a key with tenant isolation
     */
    expire: async (key: string, seconds: number, resourceType: string, subType?: string): Promise<void> => {
      return secureRedis.expire(key, seconds, resourceType, subType);
    }
  };
}

export default {
  createSecureRedisClient,
  createSecureKV
};