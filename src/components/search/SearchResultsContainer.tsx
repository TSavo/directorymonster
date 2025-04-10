'use client';

import React from 'react';
import { useSearchResults } from './hooks/useSearchResults';
import { SearchResultsPresentation } from './SearchResultsPresentation';
import { SiteConfig, Category } from '@/types';

export interface SearchResultsContainerProps {
  query: string;
  siteId?: string;
  site: SiteConfig;
  categories?: Category[];
  isAdmin?: boolean;
}

/**
 * SearchResultsContainer Component
 * 
 * Container component that connects the hook and presentation components
 */
export function SearchResultsContainer({
  query,
  siteId,
  site,
  categories = [],
  isAdmin = false
}: SearchResultsContainerProps) {
  // Use the hook to get data and handlers
  const searchResultsData = useSearchResults({
    query,
    siteId,
    site,
    categories,
    isAdmin
  });
  
  // Return the presentation component with props from hook
  return (
    <SearchResultsPresentation
      query={query}
      site={site}
      categories={categories}
      isAdmin={isAdmin}
      {...searchResultsData}
    />
  );
}
