'use client';

import React from 'react';
import ListingCard from '../ListingCard';
import { Listing, SiteConfig, Category } from '@/types';
import SearchFilters from './filters/SearchFilters';
import { SearchFilters as SearchFiltersType } from './hooks/useSearchResults';

export interface SearchResultsPresentationProps {
  // Data
  query: string;
  results: Listing[];
  totalResults: number;
  totalPages: number;
  pageNumbers: number[];
  site: SiteConfig;
  categories: Category[];
  
  // State
  isLoading: boolean;
  error: string | null;
  page: number;
  filters: SearchFiltersType;
  isAdmin: boolean;
  
  // Handlers
  handlePageChange: (newPage: number) => void;
  handleFilterChange: (newFilters: Partial<SearchFiltersType>) => void;
}

/**
 * SearchResultsPresentation Component
 * 
 * Pure UI component for rendering search results
 */
export function SearchResultsPresentation({
  // Data
  query,
  results,
  totalResults,
  totalPages,
  pageNumbers,
  site,
  categories,
  
  // State
  isLoading,
  error,
  page,
  filters,
  isAdmin,
  
  // Handlers
  handlePageChange,
  handleFilterChange
}: SearchResultsPresentationProps) {
  return (
    <div className="space-y-6" data-testid="search-results">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-semibold">
          {isLoading ? 'Searching...' : `Search Results for "${query}"`}
        </h2>
        {!isLoading && (
          <p className="text-gray-500">
            {totalResults} {totalResults === 1 ? 'result' : 'results'} found
          </p>
        )}
      </div>

      {/* Search filters and results grid */}
      <div className="lg:grid lg:grid-cols-4 gap-6">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <SearchFilters
            categories={categories}
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            showStatusFilter={isAdmin}
          />
        </div>

        {/* Results area */}
        <div className="lg:col-span-3">
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-12" data-testid="loading-indicator">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert" data-testid="error-message">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* No results state */}
          {!isLoading && !error && results.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-gray-50" data-testid="no-results">
              <p className="text-lg text-gray-600">No results found</p>
              <p className="text-gray-500 mt-2">Try different keywords or check your spelling</p>
            </div>
          )}

          {/* Results list */}
          {!isLoading && !error && results.length > 0 && (
            <div className="space-y-6" data-testid="results-list">
              <div className="grid gap-6 grid-cols-1">
                {results.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    site={site}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center pt-4 border-t" data-testid="pagination">
                  <nav className="inline-flex rounded-md shadow" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className={`px-4 py-2 rounded-l-md border ${
                        page === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-label="Previous page"
                      data-testid="prev-page"
                    >
                      Previous
                    </button>

                    {pageNumbers.map((number) => (
                      <button
                        key={number}
                        onClick={() => handlePageChange(number)}
                        className={`px-4 py-2 border-t border-b ${
                          page === number
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                        aria-label={`Page ${number}`}
                        aria-current={page === number ? 'page' : undefined}
                        data-testid={`page-${number}`}
                      >
                        {number}
                      </button>
                    ))}

                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className={`px-4 py-2 rounded-r-md border ${
                        page === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                      aria-label="Next page"
                      data-testid="next-page"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
