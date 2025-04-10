'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { UnifiedAuthComponent } from '@/components/auth';
import SearchBar from './SearchBar';
import { Menu, X, ChevronDown } from 'lucide-react';
import { KeyboardShortcut } from '@/components/ui/keyboard-shortcut';

export interface SiteInfo {
  id: string;
  name: string;
  logoUrl?: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
}

export interface TenantInfo {
  id: string;
  name: string;
}

export interface MainHeaderPresentationProps {
  site: SiteInfo;
  categories: CategoryInfo[];
  isAuthenticated: boolean;
  isScrolled: boolean;
  mobileMenuOpen: boolean;
  tenantMenuOpen: boolean;
  siteMenuOpen: boolean;
  tenants: TenantInfo[];
  sites: SiteInfo[];
  currentTenantId: string | null;
  currentSiteId: string | null;
  currentTenant?: TenantInfo | null;
  currentSite?: SiteInfo | null;
  hasMultipleTenants: boolean;
  hasMultipleSites: boolean;
  onToggleMobileMenu: () => void;
  onToggleTenantMenu: () => void;
  onToggleSiteMenu: () => void;
  onSelectTenant: (tenantId: string) => void;
  onSelectSite: (siteId: string) => void;
}

/**
 * Presentation component for the main header
 */
export function MainHeaderPresentation({
  site,
  categories = [],
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
  onToggleMobileMenu,
  onToggleTenantMenu,
  onToggleSiteMenu,
  onSelectTenant,
  onSelectSite
}: MainHeaderPresentationProps) {
  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-md shadow-md' : 'bg-white shadow-sm'}`}
      data-testid="main-header"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 md:py-6">
          {/* Logo and site name */}
          <div className="flex items-center">
            {site.logoUrl && (
              <div className="relative h-10 w-10 mr-3 overflow-hidden rounded-md">
                <Image
                  src={site.logoUrl}
                  alt={site.name}
                  fill={true}
                  className="object-contain hover:scale-105 transition-transform duration-300"
                  data-testid="site-logo"
                  priority
                />
              </div>
            )}
            <Link
              href="/"
              className="text-2xl font-bold text-gradient hover:opacity-90 transition-opacity"
              aria-label={`${site.name} - Home`}
            >
              {site.name}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8" data-testid="desktop-navigation">
            <Link
              href="/"
              className="text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
            >
              Home
            </Link>
            {categories.map(category => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className="text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
              >
                {category.name}
              </Link>
            ))}
            <Link
              href="/search"
              className="text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
            >
              Advanced Search
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {/* Search Bar - Desktop */}
            <div className="hidden md:block" data-testid="desktop-search-bar">
              <SearchBar siteId={site.id} />
            </div>

            {/* Tenant and Site Selectors for authenticated users */}
            {isAuthenticated && (
              <div className="hidden md:flex items-center space-x-2">
                {/* Tenant Selector */}
                {hasMultipleTenants && (
                  <div className="relative" data-testid="tenant-selector-container">
                    <button
                      type="button"
                      className="flex items-center space-x-1 px-3 py-2 border border-neutral-200 rounded-md bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors focus-visible"
                      onClick={onToggleTenantMenu}
                      data-testid="tenant-selector-button"
                    >
                      <span data-testid="current-tenant">
                        {currentTenant?.name || 'Select Tenant'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    </button>

                    {tenantMenuOpen && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" data-testid="tenant-selector-dropdown">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {tenants.map((tenant) => (
                            <button
                              key={tenant.id}
                              className={`block w-full text-left px-4 py-2 text-sm ${currentTenantId === tenant.id ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-50'} transition-colors`}
                              onClick={() => onSelectTenant(tenant.id)}
                              role="menuitem"
                              data-testid={`tenant-option-${tenant.id}`}
                            >
                              {tenant.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Site Selector */}
                {hasMultipleSites && (
                  <div className="relative" data-testid="site-selector-container">
                    <button
                      type="button"
                      className="flex items-center space-x-1 px-3 py-2 border border-neutral-200 rounded-md bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors focus-visible"
                      onClick={onToggleSiteMenu}
                      data-testid="site-selector-button"
                    >
                      <span data-testid="current-site">
                        {currentSite?.name || 'Select Site'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-neutral-400" />
                    </button>

                    {siteMenuOpen && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" data-testid="site-selector-dropdown">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {sites.map((site) => (
                            <button
                              key={site.id}
                              className={`block w-full text-left px-4 py-2 text-sm ${currentSiteId === site.id ? 'bg-primary-50 text-primary-700' : 'text-neutral-700 hover:bg-neutral-50'} transition-colors`}
                              onClick={() => onSelectSite(site.id)}
                              role="menuitem"
                              data-testid={`site-option-${site.id}`}
                            >
                              {site.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Unified Auth Component */}
            <div className="hidden md:block">
              <UnifiedAuthComponent />
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-md text-neutral-700 hover:text-primary-600 hover:bg-neutral-100 transition-colors focus-visible"
              onClick={onToggleMobileMenu}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
              data-testid="mobile-menu-button"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
          data-testid="mobile-navigation"
        >
          <nav className="py-4 border-t border-neutral-200">
            <ul className="flex flex-col space-y-4">
              <li>
                <Link
                  href="/"
                  className="block text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                  onClick={onToggleMobileMenu}
                >
                  Home
                </Link>
              </li>
              {categories.map(category => (
                <li key={category.id}>
                  <Link
                    href={`/${category.slug}`}
                    className="block text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                    onClick={onToggleMobileMenu}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/search"
                  className="block text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                  onClick={onToggleMobileMenu}
                >
                  Advanced Search
                </Link>
              </li>
              <li className="pt-2">
                <SearchBar siteId={site.id} />
              </li>
              {isAuthenticated && (
                <li className="pt-2 border-t border-neutral-100">
                  <UnifiedAuthComponent />
                </li>
              )}
            </ul>
          </nav>
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <KeyboardShortcut
        combination={{ key: 'm', altKey: true }}
        onKeyDown={onToggleMobileMenu}
      />
      {hasMultipleTenants && (
        <KeyboardShortcut
          combination={{ key: 't', altKey: true }}
          onKeyDown={onToggleTenantMenu}
        />
      )}
      {hasMultipleSites && (
        <KeyboardShortcut
          combination={{ key: 's', altKey: true }}
          onKeyDown={onToggleSiteMenu}
        />
      )}
    </header>
  );
}
