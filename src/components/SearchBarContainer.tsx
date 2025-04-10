'use client';

import React from 'react';
import { useSearch, UseSearchOptions } from './hooks/useSearch';
import { SearchBarPresentation } from './SearchBarPresentation';

export interface SearchBarContainerProps extends UseSearchOptions {
  placeholder?: string;
  className?: string;
  buttonLabel?: React.ReactNode;
  searchHook?: typeof useSearch;
}

export function SearchBarContainer({
  siteId,
  initialSearchTerm,
  placeholder,
  className,
  buttonLabel,
  searchHook = useSearch
}: SearchBarContainerProps) {
  // Use the search hook
  const {
    searchTerm,
    setSearchTerm,
    handleSearch,
    isSearching
  } = searchHook({
    siteId,
    initialSearchTerm
  });

  // Render the presentation component
  return (
    <SearchBarPresentation
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
      onSubmit={handleSearch}
      isSearching={isSearching}
      placeholder={placeholder}
      className={className}
      buttonLabel={buttonLabel}
    />
  );
}
