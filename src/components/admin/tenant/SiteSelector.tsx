import React, { useState } from 'react';
import { Site } from '../../../contexts/TenantSiteContext';
import { useTenantSite } from '../../../hooks/useTenantSite';

interface SiteSelectorProps {
  className?: string;
}

export function SiteSelector({ className = '' }: SiteSelectorProps) {
  const {
    hasMultipleSites,
    sites,
    currentSiteId,
    setCurrentSiteId,
    loading
  } = useTenantSite();

  const [isOpen, setIsOpen] = useState(false);

  // Don't render if tenant only has one site
  if (!hasMultipleSites) {
    return null;
  }

  // Find the current site
  const currentSite = sites.find(site => site.id === currentSiteId);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle site selection
  const handleSelectSite = (siteId: string) => {
    setCurrentSiteId(siteId);
    setIsOpen(false);
  };

  // Show loading state
  if (loading) {
    return (
      <div
        className={`site-selector ${className}`}
        data-testid="site-selector-loading"
      >
        <div className="flex items-center space-x-2">
          <span>Loading sites...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`site-selector relative ${className}`}
      data-testid="site-selector"
    >
      <button
        type="button"
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={toggleDropdown}
        data-testid="site-selector-button"
      >
        <span data-testid="site-selector-current">
          {currentSite?.name || 'Select Site'}
        </span>
        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
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
  );
}
