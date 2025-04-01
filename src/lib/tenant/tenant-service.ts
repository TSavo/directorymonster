import { redis, kv } from '@/lib/redis-client';
import { KeyNamespaceService } from '@/lib/key-namespace-service';
import crypto from 'crypto';

// Define tenant configuration type
export interface TenantConfig {
  id: string;
  slug: string;
  name: string;
  hostnames: string[];
  primaryHostname: string;
  theme: string;
  settings: Record<string, any>;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Keys for Redis storage
const TENANT_PREFIX = 'tenant:';
const HOSTNAME_PREFIX = 'hostname:';
const ALL_TENANTS_KEY = 'tenants:all';

/**
 * TenantService provides methods for managing multi-tenant functionality
 * including hostname lookups, tenant configuration, and caching.
 */
export class TenantService {
  /**
   * Get tenant by hostname
   * @param hostname The hostname to lookup
   * @returns The tenant config or null if not found
   */
  static async getTenantByHostname(
    hostname: string
  ): Promise<TenantConfig | null> {
    try {
      // Clean the hostname
      const cleanHostname = this.normalizeHostname(hostname);
      
      // Try to get the tenant id from hostname lookup
      const tenantId = await kv.get<string>(`${HOSTNAME_PREFIX}${cleanHostname}`);
      
      if (!tenantId) {
        console.log(`No tenant found for hostname: ${cleanHostname}`);
        return null;
      }
      
      // Get the tenant config
      return await this.getTenantById(tenantId);
    } catch (error) {
      console.error('Error getting tenant by hostname:', error);
      return null;
    }
  }
  
  /**
   * Get tenant by ID
   * @param id The tenant ID
   * @returns The tenant config or null if not found
   */
  static async getTenantById(id: string): Promise<TenantConfig | null> {
    try {
      // Validate tenant ID format for security (part of Tenant ID Protection)
      if (!KeyNamespaceService.isValidTenantId(id) && id !== 'default') {
        console.warn(`Invalid tenant ID format: ${id}`);
        return null;
      }
      
      return await kv.get<TenantConfig>(`${TENANT_PREFIX}${id}`);
    } catch (error) {
      console.error(`Error getting tenant with ID ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Get tenant by slug
   * @param slug The tenant slug
   * @returns The tenant config or null if not found
   */
  static async getTenantBySlug(slug: string): Promise<TenantConfig | null> {
    try {
      // Get all tenant IDs
      const tenantIds = await redis.smembers(ALL_TENANTS_KEY);
      
      // Find the tenant with the matching slug
      for (const id of tenantIds) {
        const tenant = await this.getTenantById(id);
        if (tenant && tenant.slug === slug) {
          return tenant;
        }
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting tenant with slug ${slug}:`, error);
      return null;
    }
  }
  
  /**
   * Create a new tenant
   * @param config The tenant configuration
   * @returns The created tenant config
   */
  static async createTenant(
    config: Omit<TenantConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TenantConfig> {
    try {
      // Generate a secure UUID for tenant ID
      const id = KeyNamespaceService.generateSecureTenantId();
      
      // Normalize hostnames
      const normalizedHostnames = config.hostnames.map(h => 
        this.normalizeHostname(h)
      );
      
      // Check for duplicate hostnames
      for (const hostname of normalizedHostnames) {
        const existingTenantId = await kv.get<string>(`${HOSTNAME_PREFIX}${hostname}`);
        if (existingTenantId) {
          throw new Error(`Hostname ${hostname} is already used by another tenant`);
        }
      }
      
      // Create the tenant object
      const tenant: TenantConfig = {
        ...config,
        id,
        hostnames: normalizedHostnames,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Store the tenant
      await kv.set(`${TENANT_PREFIX}${id}`, tenant);
      
      // Add to the set of all tenants
      await redis.sadd(ALL_TENANTS_KEY, id);
      
      // Create hostname lookups
      for (const hostname of normalizedHostnames) {
        await kv.set(`${HOSTNAME_PREFIX}${hostname}`, id);
      }
      
      return tenant;
    } catch (error) {
      console.error('Error creating tenant:', error);
      throw new Error('Failed to create tenant');
    }
  }
  
  /**
   * Update an existing tenant
   * @param id The tenant ID
   * @param updates Partial tenant config to update
   * @returns The updated tenant config
   */
  static async updateTenant(
    id: string,
    updates: Partial<TenantConfig>
  ): Promise<TenantConfig | null> {
    try {
      // Get the current tenant
      const currentTenant = await this.getTenantById(id);
      if (!currentTenant) {
        return null;
      }
      
      // Handle hostname changes
      if (updates.hostnames) {
        // Normalize new hostnames
        const normalizedNewHostnames = updates.hostnames.map(h => 
          this.normalizeHostname(h)
        );
        
        // Remove old hostname lookups
        for (const hostname of currentTenant.hostnames) {
          if (!normalizedNewHostnames.includes(hostname)) {
            await kv.del(`${HOSTNAME_PREFIX}${hostname}`);
          }
        }
        
        // Add new hostname lookups
        for (const hostname of normalizedNewHostnames) {
          if (!currentTenant.hostnames.includes(hostname)) {
            await kv.set(`${HOSTNAME_PREFIX}${hostname}`, id);
          }
        }
      }
      
      // Update the tenant
      const updatedTenant: TenantConfig = {
        ...currentTenant,
        ...updates,
        hostnames: updates.hostnames 
          ? updates.hostnames.map(h => this.normalizeHostname(h))
          : currentTenant.hostnames,
        updatedAt: new Date().toISOString(),
      };
      
      // Store the updated tenant
      await kv.set(`${TENANT_PREFIX}${id}`, updatedTenant);
      
      return updatedTenant;
    } catch (error) {
      console.error(`Error updating tenant ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Delete a tenant
   * @param id The tenant ID
   * @returns True if successful, false otherwise
   */
  static async deleteTenant(id: string): Promise<boolean> {
    // Validate tenant ID format for security (part of Tenant ID Protection)
    if (!KeyNamespaceService.isValidTenantId(id) && id !== 'default') {
      console.warn(`Invalid tenant ID format: ${id}`);
      return false;
    }
    
    try {
      // Get the tenant
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        return false;
      }
      
      // Remove hostname lookups
      for (const hostname of tenant.hostnames) {
        await kv.del(`${HOSTNAME_PREFIX}${hostname}`);
      }
      
      // Remove from the set of all tenants
      await redis.srem(ALL_TENANTS_KEY, id);
      
      // Delete the tenant
      await kv.del(`${TENANT_PREFIX}${id}`);
      
      return true;
    } catch (error) {
      console.error(`Error deleting tenant ${id}:`, error);
      return false;
    }
  }
  
  /**
   * Get all tenants
   * @returns Array of all tenant configs
   */
  static async getAllTenants(): Promise<TenantConfig[]> {
    try {
      const tenantIds = await redis.smembers(ALL_TENANTS_KEY);
      const tenants: TenantConfig[] = [];
      
      for (const id of tenantIds) {
        const tenant = await this.getTenantById(id);
        if (tenant) {
          tenants.push(tenant);
        }
      }
      
      return tenants;
    } catch (error) {
      console.error('Error getting all tenants:', error);
      return [];
    }
  }
  
  /**
   * Add a hostname to a tenant
   * @param id The tenant ID
   * @param hostname The hostname to add
   * @returns The updated tenant config
   */
  static async addHostname(
    id: string,
    hostname: string
  ): Promise<TenantConfig | null> {
    try {
      const normalizedHostname = this.normalizeHostname(hostname);
      
      // Check if hostname is already used
      const existingTenantId = await kv.get<string>(
        `${HOSTNAME_PREFIX}${normalizedHostname}`
      );
      
      if (existingTenantId && existingTenantId !== id) {
        throw new Error(`Hostname ${normalizedHostname} is already used by another tenant`);
      }
      
      // Get the tenant
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        return null;
      }
      
      // Add hostname if it doesn't exist
      if (!tenant.hostnames.includes(normalizedHostname)) {
        return await this.updateTenant(id, {
          hostnames: [...tenant.hostnames, normalizedHostname],
        });
      }
      
      return tenant;
    } catch (error) {
      console.error(`Error adding hostname ${hostname} to tenant ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Remove a hostname from a tenant
   * @param id The tenant ID
   * @param hostname The hostname to remove
   * @returns The updated tenant config
   */
  static async removeHostname(
    id: string,
    hostname: string
  ): Promise<TenantConfig | null> {
    try {
      const normalizedHostname = this.normalizeHostname(hostname);
      
      // Get the tenant
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        return null;
      }
      
      // Cannot remove the last hostname
      if (tenant.hostnames.length <= 1) {
        throw new Error('Cannot remove the last hostname from a tenant');
      }
      
      // Cannot remove the primary hostname
      if (normalizedHostname === tenant.primaryHostname) {
        throw new Error('Cannot remove the primary hostname');
      }
      
      // Remove hostname
      if (tenant.hostnames.includes(normalizedHostname)) {
        // Remove the hostname lookup
        await kv.del(`${HOSTNAME_PREFIX}${normalizedHostname}`);
        
        // Update the tenant
        return await this.updateTenant(id, {
          hostnames: tenant.hostnames.filter(h => h !== normalizedHostname),
        });
      }
      
      return tenant;
    } catch (error) {
      console.error(`Error removing hostname ${hostname} from tenant ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Set the primary hostname for a tenant
   * @param id The tenant ID
   * @param hostname The hostname to set as primary
   * @returns The updated tenant config
   */
  static async setPrimaryHostname(
    id: string,
    hostname: string
  ): Promise<TenantConfig | null> {
    try {
      const normalizedHostname = this.normalizeHostname(hostname);
      
      // Get the tenant
      const tenant = await this.getTenantById(id);
      if (!tenant) {
        return null;
      }
      
      // Make sure the hostname exists
      if (!tenant.hostnames.includes(normalizedHostname)) {
        throw new Error(`Hostname ${normalizedHostname} is not associated with this tenant`);
      }
      
      // Update the primary hostname
      return await this.updateTenant(id, {
        primaryHostname: normalizedHostname,
      });
    } catch (error) {
      console.error(`Error setting primary hostname ${hostname} for tenant ${id}:`, error);
      return null;
    }
  }
  
  /**
   * Check if any tenants exist
   * @returns True if at least one tenant exists
   */
  static async tenantsExist(): Promise<boolean> {
    try {
      const tenantIds = await redis.smembers(ALL_TENANTS_KEY);
      return tenantIds.length > 0;
    } catch (error) {
      console.error('Error checking if tenants exist:', error);
      return false;
    }
  }
  
  /**
   * Normalize a hostname for consistent storage and lookup
   * @param hostname The hostname to normalize
   * @returns Normalized hostname
   */
  static normalizeHostname(hostname: string): string {
    // Convert to lowercase and remove trailing slash
    let normalized = hostname.toLowerCase().trim();
    
    // Remove protocol (http/https)
    normalized = normalized.replace(/^https?:\/\//i, '');
    
    // Remove port
    normalized = normalized.replace(/:\d+$/, '');
    
    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');
    
    // www is treated the same as non-www
    if (normalized.startsWith('www.')) {
      normalized = normalized.substring(4);
    }
    
    return normalized;
  }
  
  /**
   * Create a default tenant for development
   * @returns The default tenant config
   */
  static async createDefaultTenant(): Promise<TenantConfig> {
    // Check if tenants exist
    const tenantsExist = await this.tenantsExist();
    
    if (tenantsExist) {
      throw new Error('Cannot create default tenant when tenants already exist');
    }
    
    // Create a default tenant for localhost
    return await this.createTenant({
      slug: 'default',
      name: 'Default Tenant',
      hostnames: ['localhost', '127.0.0.1'],
      primaryHostname: 'localhost',
      theme: 'default',
      settings: {},
      active: true,
    });
  }
  
  /**
   * Get a tenant from context (for use in page components)
   * @param requestHeaders The request headers with x-debug-hostname
   * @param hostname The actual hostname from the request
   * @returns The tenant config or null if not found
   */
  static async getTenantFromContext(
    requestHeaders: Headers,
    hostname: string
  ): Promise<TenantConfig | null> {
    // Check for debug hostname header
    const debugHostname = requestHeaders.get('x-debug-hostname');
    
    // Use debug hostname if available
    const hostnameToUse = debugHostname || hostname;
    
    // Get tenant by hostname
    return await this.getTenantByHostname(hostnameToUse);
  }
}

// Export the service
export default TenantService;