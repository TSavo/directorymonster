"use client";

import React from 'react';

interface FilterButtonProps {
  onClick: () => void;
  activeFiltersCount?: number;
  isOpen?: boolean;
}

export function FilterButton({
  onClick,
  activeFiltersCount = 0,
  isOpen = false,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      onClick={onClick}
      aria-expanded={isOpen}
      data-testid="filter-button"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-4 w-4 mr-2" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" 
        />
      </svg>
      Filter
      {activeFiltersCount > 0 && (
        <span className="ml-1 flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-800 text-xs rounded-full">
          {activeFiltersCount}
        </span>
      )}
    </button>
  );
}

export default FilterButton;