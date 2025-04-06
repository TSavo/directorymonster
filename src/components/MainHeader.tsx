'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePublicTenantSite } from '@/contexts/PublicTenantSiteContext';
import { useAuth } from '@/components/admin/auth/hooks/useAuth';
import SearchBar from './SearchBar';

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);

  // Get current tenant and site
  const currentTenant = tenants.find(t => t.id === currentTenantId);
  const currentSite = sites.find(s => s.id === currentSiteId);

  // Check if user has multiple tenants or sites
  const hasMultipleTenants = tenants.length > 1;
  const hasMultipleSites = sites.length > 1;

  // Toggle user menu
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
    if (tenantMenuOpen) setTenantMenuOpen(false);
    if (siteMenuOpen) setSiteMenuOpen(false);
  };

  // Toggle tenant menu
  const toggleTenantMenu = () => {
    setTenantMenuOpen(!tenantMenuOpen);
    if (userMenuOpen) setUserMenuOpen(false);
    if (siteMenuOpen) setSiteMenuOpen(false);
  };

  // Toggle site menu
  const toggleSiteMenu = () => {
    setSiteMenuOpen(!siteMenuOpen);
    if (userMenuOpen) setUserMenuOpen(false);
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
    <header className="bg-white shadow-sm" data-testid="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-6">
          <div className="flex items-center">
            {site.logoUrl && (
              <div className="relative h-10 w-10 mr-3">
                <Image
                  src={site.logoUrl}
                  alt={site.name}
                  fill
                  className="object-contain"
                  data-testid="site-logo"
                />
              </div>
            )}
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              {site.name}
            </Link>
          </div>
          
          <div className="flex items-center mt-4 sm:mt-0 space-x-4">
            {/* Search Bar */}
            <div className="flex-grow">
              <SearchBar siteId={site.id} />
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-4">
              {categories.map(category => (
                <Link
                  key={category.id}
                  href={`/${category.slug}`}
                  className="text-gray-600 hover:text-gray-900"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
            
            {/* Tenant and Site Selectors for authenticated users */}
            {isAuthenticated && (
              <div className="flex items-center space-x-2">
                {/* Tenant Selector */}
                {hasMultipleTenants && (
                  <div className="relative" data-testid="tenant-selector-container">
                    <button
                      type="button"
                      className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={toggleTenantMenu}
                      data-testid="tenant-selector-button"
                    >
                      <span data-testid="current-tenant">
                        {currentTenant?.name || 'Select Tenant'}
                      </span>
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {tenantMenuOpen && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" data-testid="tenant-selector-dropdown">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {tenants.map((tenant) => (
                            <button
                              key={tenant.id}
                              className={`block w-full text-left px-4 py-2 text-sm ${currentTenantId === tenant.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
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
                      className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                      onClick={toggleSiteMenu}
                      data-testid="site-selector-button"
                    >
                      <span data-testid="current-site">
                        {currentSite?.name || 'Select Site'}
                      </span>
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {siteMenuOpen && (
                      <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" data-testid="site-selector-dropdown">
                        <div className="py-1" role="menu" aria-orientation="vertical">
                          {sites.map((site) => (
                            <button
                              key={site.id}
                              className={`block w-full text-left px-4 py-2 text-sm ${currentSiteId === site.id ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'}`}
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
            
            {/* User Menu */}
            <div className="relative" data-testid="user-menu-container">
              <button
                type="button"
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={toggleUserMenu}
                data-testid="user-menu-button"
              >
                <span>
                  {isAuthenticated ? (user?.name || 'Account') : 'Sign In'}
                </span>
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
              
              {userMenuOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" data-testid="user-menu-dropdown">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {isAuthenticated ? (
                      <>
                        <div className="block px-4 py-2 text-sm text-gray-700 border-b">
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-gray-500">{user?.email}</p>
                        </div>
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="admin-link"
                        >
                          Admin Dashboard
                        </Link>
                        <Link
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="profile-link"
                        >
                          Your Profile
                        </Link>
                        <Link
                          href="/logout"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="logout-link"
                        >
                          Sign Out
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="login-link"
                        >
                          Sign In
                        </Link>
                        <Link
                          href="/register"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          data-testid="register-link"
                        >
                          Register
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
