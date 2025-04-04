"use client";

import { useEffect, useState } from 'react';
import { TenantConfig } from './tenant-service';

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

export default useTenant;
