"use client";

import React from 'react';

interface FilterActionsProps {
  onApply: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function FilterActions({
  onApply,
  onClear,
  disabled = false,
}: FilterActionsProps) {
  return (
    <div className="flex justify-between pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onClear}
        className="text-sm text-gray-700 hover:text-gray-900"
        data-testid="clear-filters"
      >
        Clear all
      </button>
      <button
        type="button"
        onClick={onApply}
        disabled={disabled}
        className={`px-4 py-2 text-sm font-medium rounded-md text-white ${
          disabled 
            ? 'bg-blue-300 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        }`}
        data-testid="apply-filters"
      >
        Apply
      </button>
    </div>
  );
}

export default FilterActions;