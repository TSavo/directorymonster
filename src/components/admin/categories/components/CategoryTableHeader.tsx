'use client';

import Link from 'next/link';
import { Search, X, Layers, RefreshCcw } from 'lucide-react';
import { CategoryTableHeaderProps } from '../types';
import { useState } from 'react';

/**
 * Header component with search and filtering controls for the category table
 */
export function CategoryTableHeader({
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
    <div className="mb-6" data-testid="category-header">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-lg font-semibold" data-testid="category-count">
          Categories ({totalCategories})
        </h2>
        <div className="flex gap-2" data-testid="header-actions">
          <button
            onClick={toggleHierarchyView}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-1"
            aria-label="View Hierarchy"
            data-testid="view-hierarchy-button"
          >
            <Layers size={16} />
            <span>View Hierarchy</span>
          </button>
          <Link 
            href={siteSlug ? `/admin/sites/${siteSlug}/categories/new` : "/admin/categories/new"}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            data-testid="add-category-button"
          >
            Add Category
          </Link>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4" data-testid="filter-controls">
          {/* Search input */}
          <div className="relative flex-grow" data-testid="search-container">
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
              data-testid="search-input"
            />
            {searchTerm && (
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                data-testid="clear-search-button"
              >
                <X size={18} className="text-gray-400 hover:text-gray-600" aria-hidden="true" />
              </button>
            )}
          </div>
          
          {/* Parent filter */}
          {parentCategories.length > 0 && (
            <div className="w-full sm:w-64" data-testid="parent-filter-container">
              <select
                value={parentFilter}
                onChange={(e) => setParentFilter(e.target.value)}
                className="w-full py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                aria-label="Filter by parent"
                data-testid="parent-filter-select"
              >
                <option value="">All Categories</option>
                {parentCategories.map((category) => (
                  <option key={category.id} value={category.id} data-testid={`parent-option-${category.id}`}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Site filter (only in multi-site mode) */}
          {sites.length > 0 && siteSlug === undefined && (
            <div className="w-full sm:w-64" data-testid="site-filter-container">
              <select
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="w-full py-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                aria-label="Filter by site"
                data-testid="site-filter-select"
              >
                <option value="">All Sites</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id} data-testid={`site-option-${site.id}`}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Reset filters button - only show when filters are actually applied */}
          {(searchTerm !== '' || parentFilter !== '' || siteFilter !== '') && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-1"
              aria-label="Reset Filters"
              data-testid="reset-filters-button"
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

// Also export as default for backward compatibility
export default CategoryTableHeader;
