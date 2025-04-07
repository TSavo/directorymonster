'use client';

import React, { useState, useEffect } from 'react';
import ListingCard from '../ListingCard';
import { Listing, SiteConfig, Category } from '@/types';
import SearchFilters from './filters/SearchFilters';

interface SearchResultsProps {
  query: string;
  siteId?: string;
  site: SiteConfig;
  categories?: Category[];
  isAdmin?: boolean;
}

/**
 * SearchResults component that fetches and displays search results
 */
const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  siteId,
  site,
  categories = [],
  isAdmin = false,
}) => {
  const [results, setResults] = useState<Listing[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and filters state
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    categoryId: '',
    featured: false,
    status: '',
    sortBy: 'relevance',
  });

  // Fetch search results when query, siteId, or filters change
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build search URL with all parameters
        const searchParams = new URLSearchParams();

        if (query) {
          searchParams.set('q', query);
        }

        // Add filter parameters
        if (filters.categoryId) {
          searchParams.set('categoryId', filters.categoryId);
        }

        if (filters.featured) {
          searchParams.set('featured', 'true');
        }

        if (isAdmin && filters.status) {
          searchParams.set('status', filters.status);
        }

        // Add sorting parameter
        searchParams.set('sortBy', filters.sortBy);

        // Add pagination parameters
        searchParams.set('page', String(page));
        searchParams.set('perPage', '10');

        // Fetch search results from site-specific endpoint
        const response = await fetch(`/api/sites/${site.slug}/search?${searchParams.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to load search results');
        }

        const data = await response.json();

        setResults(data.results);
        setTotalResults(data.pagination.totalResults);
        setTotalPages(data.pagination.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query, siteId, filters, page, isAdmin]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: {
    categoryId?: string;
    featured?: boolean;
    status?: string;
    sortBy?: string;
  }) => {
    // Reset to page 1 when filters change
    setPage(1);
    setFilters({
      ...filters,
      ...newFilters,
    });
  };

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="space-y-6">
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

      {/* Search filters */}
      <div className="lg:grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <SearchFilters
            categories={categories}
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            showStatusFilter={isAdmin}
          />
        </div>

        <div className="lg:col-span-3">
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" role="alert">
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          )}

          {/* No results state */}
          {!isLoading && !error && results.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-gray-50">
              <p className="text-lg text-gray-600">No results found</p>
              <p className="text-gray-500 mt-2">Try different keywords or check your spelling</p>
            </div>
          )}

          {/* Results list */}
          {!isLoading && !error && results.length > 0 && (
            <div className="space-y-6">
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
                <div className="flex justify-center pt-4 border-t">
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
};

export default SearchResults;