// Tenant service for multi-tenant functionality
import { redis, kv } from './redis-client';

// Tenant types
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  hostname?: string;
  customDomains?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Memory fallback for tenant data when Redis is unavailable
const inMemoryTenants: Map<string, Tenant> = new Map();

// Initialize with default tenant
inMemoryTenants.set('localhost', {
  id: 'default',
  slug: 'default',
  name: 'Default Tenant',
  hostname: 'localhost',
  customDomains: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

/**
 * TenantService provides methods for managing multi-tenant functionality
 */
export class TenantService {
  /**
   * Get a tenant by hostname (includes custom domains)
   */
  static async getTenantByHostname(hostname: string): Promise<Tenant | null> {
    try {
      // Try memory cache first
      if (inMemoryTenants.has(hostname)) {
        return inMemoryTenants.get(hostname) || null;
      }
      
      // Some special cases to handle for testing and development
      if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
        // Create a default tenant for local development
        const defaultTenant: Tenant = {
          id: 'default',
          slug: 'default',
          name: 'Default Tenant',
          hostname: 'localhost',
          customDomains: []
        };
        
        // Cache it in memory
        inMemoryTenants.set(hostname, defaultTenant);
        
        return defaultTenant;
      }
      
      // First check direct hostname match
      let tenant = await kv.get<Tenant>(`tenant:hostname:${hostname}`);
      
      // If no tenant found, check custom domains
      if (!tenant) {
        // Get all tenants with custom domains
        const tenantIds = await redis.smembers('tenants:with:custom:domains');
        
        // Check each tenant's custom domains
        for (const tenantId of tenantIds) {
          const tenantData = await kv.get<Tenant>(`tenant:${tenantId}`);
          
          if (tenantData?.customDomains?.includes(hostname)) {
            tenant = tenantData;
            break;
          }
        }
      }
      
      // Cache the tenant in memory for future requests if found
      if (tenant) {
        inMemoryTenants.set(hostname, tenant);
      }
      
      return tenant || null;
    } catch (error) {
      console.error(`[TenantService] Error getting tenant by hostname ${hostname}:`, error);
      
      // Return default tenant for localhost in case of errors
      if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
        return {
          id: 'default',
          slug: 'default',
          name: 'Default Tenant',
          hostname: 'localhost',
          customDomains: []
        };
      }
      
      return null;
    }
  }
  
  /**
   * Check if any tenants exist in the system
   */
  static async tenantsExist(): Promise<boolean> {
    try {
      const count = await redis.scard('tenants');
      return count > 0;
    } catch (error) {
      console.error('[TenantService] Error checking if tenants exist:', error);
      // Return true as a fallback to prevent unexpected setup redirects
      return true;
    }
  }
  
  /**
   * Create a default tenant for development
   */
  static async createDefaultTenant(): Promise<Tenant> {
    try {
      const defaultTenant: Tenant = {
        id: 'default',
        slug: 'default',
        name: 'Default Site',
        hostname: 'localhost',
        customDomains: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Store tenant data
      await kv.set(`tenant:${defaultTenant.id}`, defaultTenant);
      await kv.set(`tenant:slug:${defaultTenant.slug}`, defaultTenant.id);
      await kv.set(`tenant:hostname:${defaultTenant.hostname}`, defaultTenant);
      
      // Add to tenant index
      await redis.sadd('tenants', defaultTenant.id);
      
      // Cache it in memory
      inMemoryTenants.set(defaultTenant.hostname, defaultTenant);
      
      return defaultTenant;
    } catch (error) {
      console.error('[TenantService] Error creating default tenant:', error);
      
      // Return a basic tenant object even if storage fails
      return {
        id: 'default',
        slug: 'default',
        name: 'Default Site',
        hostname: 'localhost',
        customDomains: []
      };
    }
  }
}