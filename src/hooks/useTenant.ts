import { useEffect, useState } from 'react';
import type { Tenant } from '../lib/tenant-resolver';

/**
 * Hook to access tenant information in client components
 * Gets information from x-tenant-* headers that were set by middleware
 */
export function useTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    async function fetchTenant() {
      try {
        // Try to fetch full tenant data from API
        const response = await fetch('/api/tenant/current');
        
        if (!response.ok) {
          // If API fails, use basic data from meta tags
          const tenantId = document.head.querySelector('meta[name="tenant-id"]')?.getAttribute('content') || 'default';
          const tenantSlug = document.head.querySelector('meta[name="tenant-slug"]')?.getAttribute('content') || 'default';
          const tenantName = document.head.querySelector('meta[name="tenant-name"]')?.getAttribute('content') || 'Default';
          
          setTenant({
            id: tenantId,
            slug: tenantSlug,
            name: tenantName
          });
        } else {
          // Use the complete tenant data from API
          const data = await response.json();
          setTenant(data);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching tenant:', err);
        setError(err instanceof Error ? err : new Error('Failed to load tenant'));
        setIsLoading(false);
        
        // Fallback to basic info
        const tenantId = document.head.querySelector('meta[name="tenant-id"]')?.getAttribute('content') || 'default';
        const tenantSlug = document.head.querySelector('meta[name="tenant-slug"]')?.getAttribute('content') || 'default';
        const tenantName = document.head.querySelector('meta[name="tenant-name"]')?.getAttribute('content') || 'Default';
        
        setTenant({
          id: tenantId,
          slug: tenantSlug,
          name: tenantName
        });
      }
    }
    
    fetchTenant();
  }, []);
  
  return { tenant, isLoading, error };
}