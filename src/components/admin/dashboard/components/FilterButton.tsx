"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';

interface FilterButtonProps {
  onClick: () => void;
  hasFilters?: boolean;
  isOpen?: boolean;
}

function FilterButton({
  onClick,
  hasFilters = false,
  isOpen = false,
}: FilterButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={onClick}
      aria-expanded={isOpen}
      data-testid="filter-button"
      className="inline-flex items-center"
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
      {hasFilters && (
        <span className="ml-1 flex items-center justify-center w-2 h-2 bg-blue-500 rounded-full">
        </span>
      )}
    </Button>
  );
}

export default FilterButton;