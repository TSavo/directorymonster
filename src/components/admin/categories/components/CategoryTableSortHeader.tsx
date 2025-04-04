'use client';

import { ArrowUpDown } from 'lucide-react';
import { CategoryTableSortHeaderProps } from '../types';

/**
 * Sortable column header component for categories table
 */
export function CategoryTableSortHeader({ 
  label, 
  field, 
  currentSortField, 
  currentSortOrder, 
  onSort 
}: CategoryTableSortHeaderProps) {
  const isActive = field === currentSortField;
  const ariaLabel = `Sort by ${label}${isActive ? ` (currently sorted ${currentSortOrder})` : ''}`;
  
  return (
    <th 
      scope="col" 
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
      data-testid={`sort-header-${field}`}
    >
      <button
        className="flex items-center space-x-1 focus:outline-none focus:underline"
        onClick={() => onSort(field)}
        aria-label={ariaLabel}
        data-testid={`sort-button-${field}`}
      >
        <span data-testid={`sort-label-${field}`}>{label}</span>
        <ArrowUpDown 
          size={14} 
          className={isActive ? 'text-blue-500' : 'text-gray-400'} 
          aria-hidden="true"
          data-testid={`sort-icon-${field}`}
        />
      </button>
    </th>
  );
}

// Add default export for dual-export pattern
export default CategoryTableSortHeader;
