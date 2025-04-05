import React, { useState } from 'react';
import { useTenantSite, Tenant } from '../../../contexts/TenantSiteContext';

interface TenantSelectorProps {
  className?: string;
}

export function TenantSelector({ className = '' }: TenantSelectorProps) {
  const {
    hasMultipleTenants,
    tenants,
    currentTenantId,
    setCurrentTenantId,
    loading
  } = useTenantSite();

  const [isOpen, setIsOpen] = useState(false);

  // Don't render if user only has access to one tenant
  if (!hasMultipleTenants) {
    return null;
  }

  // Filter out the public tenant
  const editableTenants = tenants.filter(tenant => tenant.id !== 'public');

  // Find the current tenant
  const currentTenant = tenants.find(tenant => tenant.id === currentTenantId);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle tenant selection
  const handleSelectTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    setIsOpen(false);
  };

  // Show loading state
  if (loading) {
    return (
      <div
        className={`tenant-selector ${className}`}
        data-testid="tenant-selector-loading"
      >
        <div className="flex items-center space-x-2">
          <span>Loading tenants...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`tenant-selector relative ${className}`}
      data-testid="tenant-selector"
    >
      <button
        type="button"
        className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        onClick={toggleDropdown}
        data-testid="tenant-selector-button"
      >
        <span data-testid="tenant-selector-current">
          Tenant: {currentTenant?.name || 'Select Tenant'}
        </span>
        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none" data-testid="tenant-selector-dropdown">
          <div className="py-1" role="menu" aria-orientation="vertical">
            {editableTenants.map((tenant) => (
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
  );
}
