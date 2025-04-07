'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePublicTenantSite } from '@/contexts/PublicTenantSiteContext';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';
import { UnifiedAuthComponent } from '@/components/auth';
import SearchBar from './SearchBar';
import { Menu, X, ChevronDown, Search } from 'lucide-react';

interface MainHeaderProps {
  site: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export default function MainHeader({ site, categories = [] }: MainHeaderProps) {
  const { isAuthenticated, user } = useAuth();
  const { tenants, sites, currentTenantId, currentSiteId, setCurrentTenantId, setCurrentSiteId } = usePublicTenantSite();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);

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
          <nav className="hidden md:flex items-center space-x-8" data-testid="site-navigation">
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
            <div className="hidden md:block">
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
                      onClick={toggleTenantMenu}
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
                              onClick={() => handleSelectTenant(tenant.id)}
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
                      onClick={toggleSiteMenu}
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
                              onClick={() => handleSelectSite(site.id)}
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
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label="Toggle menu"
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
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <nav className="py-4 border-t border-neutral-200">
            <ul className="flex flex-col space-y-4">
              <li>
                <Link
                  href="/"
                  className="block text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
              </li>
              {categories.map(category => (
                <li key={category.id}>
                  <Link
                    href={`/${category.slug}`}
                    className="block text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/search"
                  className="block text-base font-medium text-neutral-700 hover:text-primary-600 transition-colors focus-visible"
                  onClick={() => setMobileMenuOpen(false)}
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
    </header>
  );
}
