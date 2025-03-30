'use client';

import React, { useState } from 'react';
import { Category } from '@/types';

interface SearchFiltersProps {
  categories: Category[];
  onFilterChange: (filters: {
    categoryId?: string;
    featured?: boolean;
    status?: string;
    sortBy?: string;
  }) => void;
  initialFilters?: {
    categoryId?: string;
    featured?: boolean;
    status?: string;
    sortBy?: string;
  };
  showStatusFilter?: boolean;
}

const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'title_asc', label: 'Title (A-Z)' },
  { value: 'title_desc', label: 'Title (Z-A)' },
  { value: 'featured', label: 'Featured' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

/**
 * SearchFilters component for filtering search results
 */
const SearchFilters: React.FC<SearchFiltersProps> = ({
  categories,
  onFilterChange,
  initialFilters = {},
  showStatusFilter = false,
}) => {
  const [filters, setFilters] = useState({
    categoryId: initialFilters.categoryId || '',
    featured: initialFilters.featured || false,
    status: initialFilters.status || '',
    sortBy: initialFilters.sortBy || 'relevance',
  });

  const handleFilterChange = (name: string, value: string | boolean) => {
    const newFilters = {
      ...filters,
      [name]: value,
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <h3 className="text-lg font-semibold mb-4">Filter Results</h3>
      
      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="categoryFilter"
            value={filters.categoryId}
            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        
        {/* Featured Filter */}
        <div>
          <div className="flex items-center">
            <input
              id="featuredFilter"
              type="checkbox"
              checked={filters.featured}
              onChange={(e) => handleFilterChange('featured', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="featuredFilter" className="ml-2 block text-sm font-medium text-gray-700">
              Featured Items Only
            </label>
          </div>
        </div>
        
        {/* Status Filter (Admin Only) */}
        {showStatusFilter && (
          <div>
            <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="statusFilter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Sort By Filter */}
        <div>
          <label htmlFor="sortFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sortFilter"
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;