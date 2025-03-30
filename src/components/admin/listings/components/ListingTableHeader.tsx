'use client';

import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { ListingTableHeaderProps } from '../types';

/**
 * Header component with search and filtering controls
 */
export function ListingTableHeader({
  totalListings,
  siteSlug,
  searchTerm,
  setSearchTerm,
  categoryFilter,
  setCategoryFilter,
  siteFilter,
  setSiteFilter,
  categories,
  sites
}: ListingTableHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">
          Listings ({totalListings})
        </h2>
        <Link 
          href={siteSlug ? `/admin/${siteSlug}/listings/new` : "/admin/listings/new"}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Add New Listing
        </Link>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search input */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search size={18} className="text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search listings..."
              className="w-full pl-10 pr-10 py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search listings"
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={18} className="text-gray-400 hover:text-gray-600" aria-hidden="true" />
              </button>
            )}
          </div>
          
          {/* Category filter */}
          {categories.length > 0 && (
            <div className="w-full sm:w-64">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                aria-label="Filter by category"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Site filter (only in multi-site mode) */}
          {!siteSlug && sites.length > 0 && (
            <div className="w-full sm:w-64">
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                aria-label="Filter by site"
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Enable both named and default exports
export default ListingTableHeader;
