import { useEffect, useState } from 'react';
import { headers } from 'next/headers';
import { TenantConfig, TenantService } from './tenant-service';

/**
 * Helper function to get tenant info from headers (server-side only)
 * @returns Tenant information from headers
 */
export function getTenantFromHeaders(): {
  tenantId?: string;
  tenantSlug?: string;
  tenantName?: string;
  hostname?: string;
  isDebug?: boolean;
} {
  try {
    const headersList = headers();
    
    return {
      tenantId: headersList.get('x-tenant-id') || undefined,
      tenantSlug: headersList.get('x-tenant-slug') || undefined,
      tenantName: headersList.get('x-tenant-name') || undefined,
      hostname: headersList.get('x-hostname') || undefined,
      isDebug: !!headersList.get('x-debug-hostname'),
    };
  } catch (error) {
    console.error('Error getting tenant from headers:', error);
    return {};
  }
}

/**
 * Hook for accessing the current tenant in client components
 * @param tenantId Optional tenant ID to load
 * @returns Tenant information and loading state
 */
export function useTenant(tenantId?: string) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchTenant = async () => {
      try {
        setLoading(true);
        
        if (tenantId) {
          // If tenantId is provided, fetch directly
          const response = await fetch(`/api/tenants/${tenantId}`);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch tenant: ${response.statusText}`);
          }
          
          const data = await response.json();
          setTenant(data);
        } else {
          // Otherwise, try to get the current tenant
          const response = await fetch('/api/tenants/current');
          
          if (!response.ok) {
            throw new Error(`Failed to fetch current tenant: ${response.statusText}`);
          }
          
          const data = await response.json();
          setTenant(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchTenant();
  }, [tenantId]);
  
  return { tenant, loading, error };
}

/**
 * Function to get the current tenant (server-side only)
 * @returns The current tenant or null if not found
 */
export async function getCurrentTenant(): Promise<TenantConfig | null> {
  try {
    const { tenantId } = getTenantFromHeaders();
    
    if (!tenantId) {
      return null;
    }
    
    return await TenantService.getTenantById(tenantId);
  } catch (error) {
    console.error('Error getting current tenant:', error);
    return null;
  }
}

export default useTenant;