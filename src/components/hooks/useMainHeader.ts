'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';
import { usePublicTenantSite } from '@/contexts/PublicTenantSiteContext';

export interface UseMainHeaderOptions {
  initialMobileMenuOpen?: boolean;
  initialTenantMenuOpen?: boolean;
  initialSiteMenuOpen?: boolean;
}

export interface UseMainHeaderResult {
  isAuthenticated: boolean;
  user: any;
  isScrolled: boolean;
  mobileMenuOpen: boolean;
  tenantMenuOpen: boolean;
  siteMenuOpen: boolean;
  tenants: any[];
  sites: any[];
  currentTenantId: string | null;
  currentSiteId: string | null;
  currentTenant: any;
  currentSite: any;
  hasMultipleTenants: boolean;
  hasMultipleSites: boolean;
  toggleMobileMenu: () => void;
  toggleTenantMenu: () => void;
  toggleSiteMenu: () => void;
  handleSelectTenant: (tenantId: string) => void;
  handleSelectSite: (siteId: string) => void;
}

/**
 * Custom hook for MainHeader component logic
 */
export function useMainHeader({
  initialMobileMenuOpen = false,
  initialTenantMenuOpen = false,
  initialSiteMenuOpen = false
}: UseMainHeaderOptions = {}): UseMainHeaderResult {
  // Auth and tenant/site context
  const { isAuthenticated, user } = useAuth();
  const { 
    tenants, 
    sites, 
    currentTenantId, 
    currentSiteId, 
    setCurrentTenantId, 
    setCurrentSiteId 
  } = usePublicTenantSite();

  // State
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(initialMobileMenuOpen);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(initialTenantMenuOpen);
  const [siteMenuOpen, setSiteMenuOpen] = useState(initialSiteMenuOpen);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get current tenant and site
  const currentTenant = tenants.find(t => t.id === currentTenantId);
  const currentSite = sites.find(s => s.id === currentSiteId);

  // Check if user has multiple tenants or sites
  const hasMultipleTenants = tenants.length > 1;
  const hasMultipleSites = sites.length > 1;

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Toggle tenant menu
  const toggleTenantMenu = () => {
    setTenantMenuOpen(!tenantMenuOpen);
    if (siteMenuOpen) setSiteMenuOpen(false);
  };

  // Toggle site menu
  const toggleSiteMenu = () => {
    setSiteMenuOpen(!siteMenuOpen);
    if (tenantMenuOpen) setTenantMenuOpen(false);
  };

  // Handle tenant selection
  const handleSelectTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    setTenantMenuOpen(false);
  };

  // Handle site selection
  const handleSelectSite = (siteId: string) => {
    setCurrentSiteId(siteId);
    setSiteMenuOpen(false);
  };

  return {
    isAuthenticated,
    user,
    isScrolled,
    mobileMenuOpen,
    tenantMenuOpen,
    siteMenuOpen,
    tenants,
    sites,
    currentTenantId,
    currentSiteId,
    currentTenant,
    currentSite,
    hasMultipleTenants,
    hasMultipleSites,
    toggleMobileMenu,
    toggleTenantMenu,
    toggleSiteMenu,
    handleSelectTenant,
    handleSelectSite
  };
}
