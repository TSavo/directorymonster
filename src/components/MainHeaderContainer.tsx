'use client';

import React from 'react';
import { useMainHeader, UseMainHeaderOptions } from './hooks/useMainHeader';
import { MainHeaderPresentation, SiteInfo, CategoryInfo } from './MainHeaderPresentation';

export interface MainHeaderContainerProps {
  site: SiteInfo;
  categories?: CategoryInfo[];
  mainHeaderHook?: typeof useMainHeader;
  initialOptions?: UseMainHeaderOptions;
}

/**
 * Container component for the main header
 * 
 * Handles state and business logic, delegates rendering to presentation component
 */
export function MainHeaderContainer({
  site,
  categories = [],
  mainHeaderHook = useMainHeader,
  initialOptions
}: MainHeaderContainerProps) {
  // Use the main header hook
  const {
    isAuthenticated,
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
  } = mainHeaderHook(initialOptions);

  return (
    <MainHeaderPresentation
      site={site}
      categories={categories}
      isAuthenticated={isAuthenticated}
      isScrolled={isScrolled}
      mobileMenuOpen={mobileMenuOpen}
      tenantMenuOpen={tenantMenuOpen}
      siteMenuOpen={siteMenuOpen}
      tenants={tenants}
      sites={sites}
      currentTenantId={currentTenantId}
      currentSiteId={currentSiteId}
      currentTenant={currentTenant}
      currentSite={currentSite}
      hasMultipleTenants={hasMultipleTenants}
      hasMultipleSites={hasMultipleSites}
      onToggleMobileMenu={toggleMobileMenu}
      onToggleTenantMenu={toggleTenantMenu}
      onToggleSiteMenu={toggleSiteMenu}
      onSelectTenant={handleSelectTenant}
      onSelectSite={handleSelectSite}
    />
  );
}
