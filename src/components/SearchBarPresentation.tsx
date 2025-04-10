'use client';

import React from 'react';

export interface SearchBarPresentationProps {
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSearching?: boolean;
  placeholder?: string;
  className?: string;
  buttonLabel?: React.ReactNode;
}

export function SearchBarPresentation({
  searchTerm,
  onSearchTermChange,
  onSubmit,
  isSearching = false,
  placeholder = 'Search...',
  className = 'w-full max-w-lg',
  buttonLabel = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}: SearchBarPresentationProps) {
  return (
    <form onSubmit={onSubmit} className={className} data-testid="search-form">
      <div className="relative">
        <input
          type="text"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          data-testid="search-input"
          disabled={isSearching}
        />
        <button
          type="submit"
          className="absolute inset-y-0 right-0 px-3 flex items-center bg-blue-600 text-white rounded-r-md hover:bg-blue-700 disabled:bg-blue-400"
          data-testid="search-button"
          disabled={isSearching}
        >
          {buttonLabel}
        </button>
      </div>
    </form>
  );
}
