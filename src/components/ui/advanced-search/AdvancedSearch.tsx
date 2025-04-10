'use client';

import React, { useState } from 'react';
import { AdvancedSearchPresentation } from './AdvancedSearchPresentation';
import { useAdvancedSearch } from './hooks/useAdvancedSearch';

export const AdvancedSearch: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const {
    query,
    setQuery,
    scope,
    setScope,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
    showFilters,
    setShowFilters,
    isLoading,
    handleSearch,
  } = useAdvancedSearch();

  const handleFormSubmit = (e: React.FormEvent) => {
    handleSearch(e);
    setIsOpen(false);
  };

  const handleAddFilter = (key: string, value: string, label: string) => {
    addFilter(key, value, label);
  };

  const handleRemoveFilter = (index: number) => {
    removeFilter(index);
  };

  return (
    <AdvancedSearchPresentation
      open={isOpen}
      onOpenChange={setIsOpen}
      query={query}
      onQueryChange={setQuery}
      onSearch={handleFormSubmit}
      scope={scope}
      onScopeChange={setScope}
      showFilters={showFilters}
      onShowFiltersChange={setShowFilters}
      filters={filters}
      onAddFilter={handleAddFilter}
      onRemoveFilter={handleRemoveFilter}
      onClearFilters={clearFilters}
      dialogClassName="sm:max-w-[600px]"
      triggerButtonVariant="outline"
      triggerButtonSize="sm"
    />
  );
};
