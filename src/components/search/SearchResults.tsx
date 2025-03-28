'use client';

import React, { useState, useEffect } from 'react';
import ListingCard from '../ListingCard';
import { Listing, SiteConfig } from '@/types';

interface SearchResultsProps {
  query: string;
  siteId?: string;
  site: SiteConfig;
}

/**
 * SearchResults component that fetches and displays search results
 */
const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  siteId,
  site,
}) => {
  const [results, setResults] = useState<Listing[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const resultsPerPage = 10;

  // Fetch search results when query or siteId changes
  useEffect(() => {
    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Build search URL
        const searchParams = new URLSearchParams();
        searchParams.set('q', query);
        
        if (siteId) {
          searchParams.set('siteId', siteId);
        }
        
        // Fetch search results
        const response = await fetch(`/api/search?${searchParams.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to load search results');
        }
        
        const data = await response.json();
        
        setResults(data.results);
        setTotalResults(data.totalResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResults();
  }, [query, siteId]);

  // Calculate paginated results
  const paginatedResults = results.slice(
    (page - 1) * resultsPerPage,
    page * resultsPerPage
  );
  
  // Calculate total pages
  const totalPages = Math.ceil(results.length / resultsPerPage);
  
  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // Scroll to top of results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
        <div className="text-center py-12">
          <p className="text-lg text-gray-600">No results found for "{query}"</p>
          <p className="text-gray-500 mt-2">Try different keywords or check your spelling</p>
        </div>
      )}

      {/* Results list */}
      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-6">
          <div className="grid gap-6 grid-cols-1">
            {paginatedResults.map((listing) => (
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
  );
};

export default SearchResults;