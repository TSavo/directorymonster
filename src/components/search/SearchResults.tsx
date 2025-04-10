'use client';

import React from 'react';
import { SearchResultsContainer } from './SearchResultsContainer';
import { SiteConfig, Category } from '@/types';

export interface SearchResultsProps {
  query: string;
  siteId?: string;
  site: SiteConfig;
  categories?: Category[];
  isAdmin?: boolean;
}

/**
 * SearchResults Component
 *
 * This component displays search results with filtering, sorting, and pagination.
 * It has been refactored to use a container/presentation pattern for better
 * separation of concerns, testability, and maintainability.
 *
 * Features:
 * - Displays search results with pagination
 * - Provides filtering by category, featured status, and more
 * - Supports sorting by different criteria
 * - Handles loading and error states
 * - Responsive design for mobile and desktop
 */
export function SearchResults({
  query,
  siteId,
  site,
  categories = [],
  isAdmin = false
}: SearchResultsProps) {
  return (
    <SearchResultsContainer
      query={query}
      siteId={siteId}
      site={site}
      categories={categories}
      isAdmin={isAdmin}
    />
  );
}

export default SearchResults;