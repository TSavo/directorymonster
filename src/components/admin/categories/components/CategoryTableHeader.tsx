'use client';

import Link from 'next/link';
import { Search, X, Layers, RefreshCcw } from 'lucide-react';
import { CategoryTableHeaderProps } from '../types';
import { useState } from 'react';

/**
 * Header component with search and filtering controls for the category table
 */
export default function CategoryTableHeader({
  totalCategories,
  siteSlug,
  searchTerm,
  setSearchTerm,
  parentFilter,
  setParentFilter,
  siteFilter,
  setSiteFilter,
  categories,
  sites
}: CategoryTableHeaderProps) {
  const [showHierarchy, setShowHierarchy] = useState(false);
  
  // Get only parent categories for the filter (exclude child categories)
  const parentCategories = categories.filter(category => !category.parentId);
  
  // Check if any filters are applied
  const hasFilters = searchTerm !== '' || parentFilter !== '' || siteFilter !== '';
  
  // Reset all filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setParentFilter('');
    setSiteFilter('');
  };
  
  // Toggle hierarchy view
  const toggleHierarchyView = () => {
    setShowHierarchy(!showHierarchy);
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold">
          Categories ({totalCategories})
        </h2>
        <div className="flex gap-2">
          <button
            onClick={toggleHierarchyView}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-1"
            aria-label="View Hierarchy"
          >
            <Layers size={16} />
            <span>View Hierarchy</span>
          </button>
          <Link 
            href={siteSlug ? `/admin/sites/${siteSlug}/categories/new` : "/admin/categories/new"}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Category
          </Link>
        </div>
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
              placeholder="Search categories..."
              className="w-full pl-10 pr-10 py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search categories"
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
          
          {/* Parent filter */}
          {parentCategories.length > 0 && (
            <div className="w-full sm:w-64">
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="w-full py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                aria-label="Filter by parent"
              >
                <option value="">All Categories</option>
                {parentCategories.map((category) => (
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
          
          {/* Reset filters button */}
          {hasFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-1"
              aria-label="Reset Filters"
            >
              <RefreshCcw size={16} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
