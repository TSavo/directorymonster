'use client';

import React, { useEffect, useState } from 'react';
import { useSites } from '../hooks';
import SiteTableHeader from './SiteTableHeader';
import SiteTableSortHeader from './SiteTableSortHeader';
import SiteTableRow from './SiteTableRow';
import SiteTablePagination from './SiteTablePagination';
import SiteMobileCard from './SiteMobileCard';
import DeleteConfirmationModal from './DeleteConfirmationModal';

export interface SiteTableProps {
  /**
   * API endpoint for fetching sites
   */
  apiEndpoint?: string;
}

/**
 * SiteTable - Table for listing and managing sites
 * 
 * Features:
 * - Displays all sites with key information
 * - Provides links to edit and manage sites
 * - Handles loading and error states
 * - Supports filtering, sorting, and pagination
 * - Responsive design with mobile view
 */
export const SiteTable: React.FC<SiteTableProps> = ({
  apiEndpoint = '/api/sites'
}) => {
  // State for delete confirmation
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [siteToDelete, setSiteToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Use the sites hook
  const {
    sites,
    totalSites,
    isLoading,
    error,
    filters,
    setFilters,
    fetchSites,
    deleteSite
  } = useSites({ 
    apiEndpoint,
    defaultFilters: {
      search: '',
      sortBy: 'name',
      sortOrder: 'asc',
      page: 1,
      limit: 10
    }
  });
  
  // Fetch sites on initial load and when filters change
  useEffect(() => {
    fetchSites();
  }, [fetchSites, filters]);
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value,
      page: 1 // Reset to page 1 when searching
    });
  };
  
  // Handle sort change
  const handleSort = (field: string) => {
    setFilters({
      ...filters,
      sortBy: field,
      sortOrder: filters.sortBy === field && filters.sortOrder === 'asc' ? 'desc' : 'asc'
    });
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters({
      ...filters,
      page
    });
  };
  
  // Handle page size change
  const handlePageSizeChange = (limit: number) => {
    setFilters({
      ...filters,
      page: 1, // Reset to page 1 when changing page size
      limit
    });
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (id: string) => {
    const site = sites.find(s => s.id === id);
    if (site) {
      setSiteToDelete({
        id: site.id,
        name: site.name
      });
      setDeleteModalOpen(true);
    }
  };
  
  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (siteToDelete) {
      await deleteSite(siteToDelete.id);
      setDeleteModalOpen(false);
      setSiteToDelete(null);
    }
  };
  
  // Handle cancel delete
  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setSiteToDelete(null);
  };
  
  // Loading state
  if (isLoading && sites.length === 0) {
    return (
      <div className="p-4" data-testid="site-table-loading">
        <SiteTableHeader 
          searchTerm={filters.search}
          onSearchChange={handleSearch}
        />
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-16 bg-gray-200 rounded mb-2"></div>
          <div className="h-16 bg-gray-200 rounded mb-2"></div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="p-4" data-testid="site-table-error">
        <SiteTableHeader 
          searchTerm={filters.search}
          onSearchChange={handleSearch}
        />
        <div className="bg-red-100 text-red-700 p-4 rounded mb-4" role="alert">
          <p className="font-medium">Error loading sites:</p>
          <p>{error}</p>
          <button
            onClick={() => fetchSites()}
            className="mt-2 px-4 py-1 bg-red-700 text-white rounded hover:bg-red-800"
            data-testid="retry-button"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (sites.length === 0) {
    return (
      <div className="p-4" data-testid="site-table-empty">
        <SiteTableHeader 
          searchTerm={filters.search}
          onSearchChange={handleSearch}
        />
        <div className="text-center py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg 
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            ></path>
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No sites found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filters.search 
              ? `No sites matching "${filters.search}". Try a different search term.` 
              : 'Get started by creating your first site.'}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4" data-testid="site-table">
      <SiteTableHeader 
        searchTerm={filters.search}
        onSearchChange={handleSearch}
      />
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200" data-testid="sites-desktop-table">
          <SiteTableSortHeader 
            sortBy={filters.sortBy}
            sortOrder={filters.sortOrder as 'asc' | 'desc'}
            onSort={handleSort}
          />
          <tbody>
            {sites.map(site => (
              <SiteTableRow 
                key={site.id}
                site={site}
                onDelete={handleDeleteClick}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Mobile Card View */}
      <div className="md:hidden" data-testid="sites-mobile-cards">
        {sites.map(site => (
          <SiteMobileCard 
            key={site.id}
            site={site}
            onDelete={handleDeleteClick}
          />
        ))}
      </div>
      
      {/* Pagination */}
      <SiteTablePagination 
        totalItems={totalSites}
        currentPage={filters.page}
        pageSize={filters.limit}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        siteName={siteToDelete?.name || ''}
        isLoading={isLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default SiteTable;