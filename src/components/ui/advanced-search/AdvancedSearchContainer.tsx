'use client';

import React from 'react';
import { useAdvancedSearch, UseAdvancedSearchOptions } from './hooks/useAdvancedSearch';
import { AdvancedSearchPresentation } from './AdvancedSearchPresentation';

export interface AdvancedSearchContainerProps extends UseAdvancedSearchOptions {
  children?: React.ReactNode;
  dialogClassName?: string;
  triggerButtonVariant?: 'default' | 'outline' | 'ghost' | 'link';
  triggerButtonSize?: 'default' | 'sm' | 'lg';
  triggerButtonClassName?: string;
  advancedSearchHook?: typeof useAdvancedSearch;
}

/**
 * Container component for advanced search
 * 
 * Manages state and logic for the advanced search dialog
 */
export function AdvancedSearchContainer({
  initialQuery,
  initialScope,
  initialFilters,
  initialOpen,
  initialShowFilters,
  searchPath,
  children,
  dialogClassName,
  triggerButtonVariant,
  triggerButtonSize,
  triggerButtonClassName,
  advancedSearchHook = useAdvancedSearch
}: AdvancedSearchContainerProps) {
  // Use the advanced search hook
  const {
    open,
    setOpen,
    query,
    setQuery,
    scope,
    setScope,
    filters,
    showFilters,
    setShowFilters,
    handleSearch,
    addFilter,
    removeFilter,
    clearFilters
  } = advancedSearchHook({
    initialQuery,
    initialScope,
    initialFilters,
    initialOpen,
    initialShowFilters,
    searchPath
  });

  return (
    <AdvancedSearchPresentation
      open={open}
      onOpenChange={setOpen}
      query={query}
      onQueryChange={setQuery}
      scope={scope}
      onScopeChange={setScope}
      filters={filters}
      showFilters={showFilters}
      onShowFiltersChange={setShowFilters}
      onSearch={handleSearch}
      onAddFilter={addFilter}
      onRemoveFilter={removeFilter}
      onClearFilters={clearFilters}
      children={children}
      dialogClassName={dialogClassName}
      triggerButtonVariant={triggerButtonVariant}
      triggerButtonSize={triggerButtonSize}
      triggerButtonClassName={triggerButtonClassName}
    />
  );
}
