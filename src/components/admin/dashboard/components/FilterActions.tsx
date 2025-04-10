"use client";

import React from 'react';
import { Button } from '@/components/ui/Button';

interface FilterActionsProps {
  onApply: () => void;
  onClear: () => void;
  hasFilters?: boolean;
}

function FilterActions({
  onApply,
  onClear,
  hasFilters = false,
}: FilterActionsProps) {
  return (
    <div className="flex justify-between pt-4 border-t border-gray-200 p-4">
      <Button
        type="button"
        onClick={onClear}
        variant="link"
        size="sm"
        className="text-gray-700 hover:text-gray-900"
        data-testid="clear-filters"
      >
        Clear Filters
      </Button>
      <Button
        type="button"
        onClick={onApply}
        variant="primary"
        size="sm"
        data-testid="apply-filters"
      >
        Apply
      </Button>
    </div>
  );
}

export default FilterActions;