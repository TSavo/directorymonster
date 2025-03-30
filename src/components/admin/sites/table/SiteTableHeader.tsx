'use client';

import React from 'react';
import Link from 'next/link';

export interface SiteTableHeaderProps {
  /**
   * Search term
   */
  searchTerm: string;
  /**
   * Handler for search input changes
   */
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Optional create site link path
   */
  createPath?: string;
}

/**
 * SiteTableHeader - Header component for the site table
 * 
 * Provides search functionality and create button
 */
export const SiteTableHeader: React.FC<SiteTableHeaderProps> = ({
  searchTerm,
  onSearchChange,
  createPath = '/admin/sites/new'
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3" data-testid="site-table-header">
      <h2 className="text-xl font-semibold">Sites</h2>
      
      <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder="Search sites..."
            value={searchTerm}
            onChange={onSearchChange}
            className="w-full p-2 pl-8 border border-gray-300 rounded"
            data-testid="site-search-input"
          />
          <svg
            className="absolute left-2 top-2.5 w-4 h-4 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        
        {/* Create button */}
        <Link
          href={createPath}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
          data-testid="create-site-button"
        >
          Create Site
        </Link>
      </div>
    </div>
  );
};

export default SiteTableHeader;