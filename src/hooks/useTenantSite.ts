import { useContext } from 'react';
import { TenantSiteContext, TenantSiteContextType } from '../contexts/TenantSiteContext';

/**
 * Custom hook for accessing the tenant/site context
 * @returns The tenant/site context
 */
export function useTenantSite(): TenantSiteContextType {
  const context = useContext(TenantSiteContext);
  
  if (!context) {
    throw new Error('useTenantSite must be used within a TenantSiteProvider');
  }
  
  return context;
}
