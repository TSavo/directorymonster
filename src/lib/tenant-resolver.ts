import { headers } from 'next/headers';
import { redis, kv } from './redis-client';

// Tenant types (same as before)
export interface Tenant {
  id: string;
  slug: string;
  name: string;
  hostname?: string;
  customDomains?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// Cache for tenant data to minimize Redis calls
const tenantCache = new Map<string, Tenant>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const tenantCacheTimestamps = new Map<string, number>();

/**
 * Get tenant information based on request headers
 * Designed to work in server components and API routes
 */
export async function resolveTenant(): Promise<Tenant | null> {
  // Get headers from request
  const headersList = headers();
  const hostname = headersList.get('x-hostname') || 'localhost';
  const tenantId = headersList.get('x-tenant-id');
  const tenantSlug = headersList.get('x-tenant-slug');
  
  // Logging to help with debugging
  console.log(`[TenantResolver] Resolving tenant for hostname: ${hostname}`);
  
  // Check cache first (with TTL)
  const cacheKey = `tenant:${hostname}`;
  if (tenantCache.has(cacheKey)) {
    const timestamp = tenantCacheTimestamps.get(cacheKey) || 0;
    if (Date.now() - timestamp < CACHE_TTL) {
      console.log(`[TenantResolver] Cache hit for ${hostname}`);
      return tenantCache.get(cacheKey) || null;
    } else {
      console.log(`[TenantResolver] Cache expired for ${hostname}`);
      tenantCache.delete(cacheKey);
      tenantCacheTimestamps.delete(cacheKey);
    }
  }
  
  try {
    // First, try direct lookup by hostname
    let tenant = await kv.get<Tenant>(`tenant:hostname:${hostname}`);
    
    // If not found, try lookup by the tenant ID from headers
    if (!tenant && tenantId) {
      tenant = await kv.get<Tenant>(`tenant:${tenantId}`);
    }
    
    // If not found, try lookup by the tenant slug from headers
    if (!tenant && tenantSlug) {
      const id = await kv.get<string>(`tenant:slug:${tenantSlug}`);
      if (id) {
        tenant = await kv.get<Tenant>(`tenant:${id}`);
      }
    }
    
    // If still not found, check custom domains
    if (!tenant) {
      // Get all tenants with custom domains
      const tenantIds = await redis.smembers('tenants:with:custom:domains');
      
      // Check each tenant's custom domains
      for (const id of tenantIds) {
        const tenantData = await kv.get<Tenant>(`tenant:${id}`);
        
        if (tenantData?.customDomains?.includes(hostname)) {
          tenant = tenantData;
          break;
        }
      }
    }
    
    // If we found a tenant, cache it
    if (tenant) {
      console.log(`[TenantResolver] Found tenant ${tenant.name} for ${hostname}`);
      tenantCache.set(cacheKey, tenant);
      tenantCacheTimestamps.set(cacheKey, Date.now());
      return tenant;
    }
    
    // For localhost, create a default tenant if none exists
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      // Check if any tenants exist
      const tenantCount = await redis.scard('tenants');
      
      if (tenantCount === 0) {
        console.log('[TenantResolver] No tenants exist, creating default tenant');
        // Create default tenant
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
        
        // Cache it
        tenantCache.set(cacheKey, defaultTenant);
        tenantCacheTimestamps.set(cacheKey, Date.now());
        
        return defaultTenant;
      }
    }
    
    console.log(`[TenantResolver] No tenant found for ${hostname}`);
    return null;
  } catch (error) {
    console.error(`[TenantResolver] Error resolving tenant for ${hostname}:`, error);
    
    // For localhost, return a basic default tenant even if Redis fails
    if (hostname === 'localhost' || hostname.includes('127.0.0.1')) {
      const fallbackTenant: Tenant = {
        id: 'default',
        slug: 'default',
        name: 'Default Site (Fallback)',
        hostname: 'localhost',
        customDomains: []
      };
      
      return fallbackTenant;
    }
    
    return null;
  }
}

/**
 * Check if any tenants exist (for first-time setup)
 */
export async function tenantsExist(): Promise<boolean> {
  try {
    const count = await redis.scard('tenants');
    return count > 0;
  } catch (error) {
    console.error('[TenantResolver] Error checking if tenants exist:', error);
    // Default to true to prevent unexpected setup redirects in error cases
    return true;
  }
}

/**
 * Create a default tenant (for first-time setup)
 */
export async function createDefaultTenant(): Promise<Tenant> {
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
    
    // Cache it
    const cacheKey = `tenant:localhost`;
    tenantCache.set(cacheKey, defaultTenant);
    tenantCacheTimestamps.set(cacheKey, Date.now());
    
    return defaultTenant;
  } catch (error) {
    console.error('[TenantResolver] Error creating default tenant:', error);
    
    // Return a basic tenant object even if Redis fails
    return {
      id: 'default',
      slug: 'default',
      name: 'Default Site (Fallback)',
      hostname: 'localhost',
      customDomains: []
    };
  }
}