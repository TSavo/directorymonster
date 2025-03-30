'use client';

import React from 'react';

export interface SiteTableSortHeaderProps {
  /**
   * Current sort field
   */
  sortBy: string;
  /**
   * Current sort order
   */
  sortOrder: 'asc' | 'desc';
  /**
   * Handler for sort changes
   */
  onSort: (field: string) => void;
}

/**
 * SiteTableSortHeader - Table headers with sorting functionality
 * 
 * Displays column headers with sort indicators and handles sort changes
 */
export const SiteTableSortHeader: React.FC<SiteTableSortHeaderProps> = ({
  sortBy,
  sortOrder,
  onSort
}) => {
  const renderSortIndicator = (field: string) => {
    if (sortBy === field) {
      return (
        <span className="ml-1" aria-hidden="true">
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      );
    }
    return null;
  };
  
  return (
    <thead>
      <tr className="bg-gray-100">
        <th className="py-2 px-4 text-left border-b" data-testid="site-column-name">
          <button
            className="font-medium text-gray-700 flex items-center"
            onClick={() => onSort('name')}
            data-testid="sort-by-name"
            aria-sort={sortBy === 'name' ? sortOrder : undefined}
          >
            Name
            {renderSortIndicator('name')}
            <span className="sr-only">
              {sortBy === 'name' ? `sorted ${sortOrder}ending` : 'sort by name'}
            </span>
          </button>
        </th>
        <th className="py-2 px-4 text-left border-b" data-testid="site-column-slug">
          <button
            className="font-medium text-gray-700 flex items-center"
            onClick={() => onSort('slug')}
            data-testid="sort-by-slug"
            aria-sort={sortBy === 'slug' ? sortOrder : undefined}
          >
            Slug
            {renderSortIndicator('slug')}
            <span className="sr-only">
              {sortBy === 'slug' ? `sorted ${sortOrder}ending` : 'sort by slug'}
            </span>
          </button>
        </th>
        <th className="py-2 px-4 text-left border-b" data-testid="site-column-domains">
          Domains
        </th>
        <th className="py-2 px-4 text-left border-b" data-testid="site-column-created">
          <button
            className="font-medium text-gray-700 flex items-center"
            onClick={() => onSort('createdAt')}
            data-testid="sort-by-created"
            aria-sort={sortBy === 'createdAt' ? sortOrder : undefined}
          >
            Created
            {renderSortIndicator('createdAt')}
            <span className="sr-only">
              {sortBy === 'createdAt' ? `sorted ${sortOrder}ending` : 'sort by creation date'}
            </span>
          </button>
        </th>
        <th className="py-2 px-4 text-center border-b" data-testid="site-column-actions">
          Actions
        </th>
      </tr>
    </thead>
  );
};

export default SiteTableSortHeader;