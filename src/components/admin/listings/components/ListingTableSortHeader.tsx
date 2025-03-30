'use client';

import { ArrowUpDown } from 'lucide-react';
import { ListingTableSortHeaderProps } from '../types';

/**
 * Sortable column header component
 */
export function ListingTableSortHeader({ 
  label, 
  field, 
  currentSortField, 
  currentSortOrder, 
  onSort 
}: ListingTableSortHeaderProps) {
  const isActive = field === currentSortField;
  const ariaLabel = `Sort by ${label} ${isActive ? `(currently sorted ${currentSortOrder})` : ''}`;
  
  return (
    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      <button
        className="flex items-center space-x-1 focus:outline-none focus:underline"
        onClick={() => onSort(field)}
        aria-label={ariaLabel}
      >
        <span>{label}</span>
        <ArrowUpDown 
          size={14} 
          className={isActive ? 'text-blue-500' : 'text-gray-400'} 
          aria-hidden="true" 
        />
      </button>
    </th>
  );
}

// Enable both named and default exports
export default ListingTableSortHeader;
