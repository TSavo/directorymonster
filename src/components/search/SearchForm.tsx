'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface SearchFormProps {
  siteId?: string;
  className?: string;
  placeholder?: string;
  buttonText?: string;
  minQueryLength?: number;
}

/**
 * SearchForm component that handles user search input and redirects to search results
 */
const SearchForm: React.FC<SearchFormProps> = ({
  siteId,
  className = '',
  placeholder = 'Search...',
  buttonText = 'Search',
  minQueryLength = 3,
}) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    // Validate query length
    if (!query.trim()) {
      setError('Please enter a search term');
      return;
    }

    const terms = query.trim().split(/\s+/).filter(term => term.length > 2);

    if (terms.length === 0) {
      setError(`Search terms must be at least ${minQueryLength} characters long`);
      return;
    }

    // Clear any error
    setError(null);

    // Build search URL
    const searchParams = new URLSearchParams();
    searchParams.set('q', query);

    // Redirect to search results page - site context is handled by middleware
    router.push(`/search?${searchParams.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col sm:flex-row gap-2 ${className}`}
      role="search"
      aria-label="Site search"
    >
      <div className="relative flex-grow">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Search query"
          aria-required="true"
          aria-invalid={!!error}
          aria-describedby={error ? "search-error" : undefined}
        />
        {error && (
          <div
            id="search-error"
            className="text-red-500 text-sm mt-1 absolute"
            role="alert"
          >
            {error}
          </div>
        )}
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        aria-label="Submit search"
      >
        {buttonText}
      </button>
    </form>
  );
};

export default SearchForm;