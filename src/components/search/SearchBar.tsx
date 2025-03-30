'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import SearchIcon from './SearchIcon';

interface SearchBarProps {
  siteId?: string;
  className?: string;
  expanded?: boolean;
}

/**
 * Compact search bar component for headers and navigation
 */
const SearchBar: React.FC<SearchBarProps> = ({
  siteId,
  className = '',
  expanded = false,
}) => {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(expanded);
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      return;
    }
    
    const terms = query.trim().split(/\s+/).filter(term => term.length > 2);
    
    if (terms.length === 0) {
      return;
    }
    
    // Build search URL
    const searchParams = new URLSearchParams();
    searchParams.set('q', query);
    
    if (siteId) {
      searchParams.set('siteId', siteId);
    }
    
    // Redirect to search results page
    router.push(`/search?${searchParams.toString()}`);
  };

  return (
    <div className={`relative ${className}`} data-testid="search-bar">
      <form 
        onSubmit={handleSubmit}
        role="search"
        className="flex items-center"
        data-testid="search-form"
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 text-gray-500 hover:text-gray-700 transition-colors ${isExpanded ? 'hidden' : 'block'}`}
          aria-label="Open search"
        >
          <SearchIcon />
        </button>
        
        <div
          className={`flex items-center ${
            isExpanded 
              ? 'opacity-100 w-60 transition-all duration-200' 
              : 'opacity-0 w-0 pointer-events-none transition-all duration-200'
          }`}
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full border-b-2 border-gray-300 focus:border-blue-500 outline-none py-1 px-2 text-sm"
            aria-label="Search query"
            data-testid="search-input"
          />
          
          <button
            type="submit"
            className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Submit search"
          >
            <SearchIcon />
          </button>
          
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="ml-2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close search"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;