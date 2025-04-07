/**
 * @jest-environment jsdom
 */

import React from 'react';
import { fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderForSnapshot, snapshotTest } from './setup';

// Mock the search component
const SearchComponent = () => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (query.trim()) {
      setIsLoading(true);
      setIsOpen(true);

      // Simulate API call
      setTimeout(() => {
        setResults([
          'Search Result 1',
          'Search Result 2',
          'Search Result 3',
          'Search Result 4',
          'Search Result 5',
        ]);
        setIsLoading(false);
      }, 500);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };

  return (
    <div className="search-container">
      <form onSubmit={handleSearch} className="search-form" data-testid="search-form">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search..."
          aria-label="Search"
          className="search-input"
          data-testid="search-input"
        />
        <button type="submit" className="search-button" data-testid="search-button">
          Search
        </button>
      </form>

      {isOpen && (
        <div className="search-results" data-testid="search-results">
          {isLoading ? (
            <div className="loading-indicator" data-testid="loading-indicator">
              Loading...
            </div>
          ) : results.length > 0 ? (
            <ul className="results-list">
              {results.map((result, index) => (
                <li key={index} className="result-item" data-testid={`result-item-${index}`}>
                  {result}
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-results" data-testid="no-results">
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

describe('Search Component Visual Regression', () => {
  it('renders the search form correctly', () => {
    const container = renderForSnapshot(<SearchComponent />);
    snapshotTest(container, 'search-component-default');
  });

  it('renders the loading state correctly', () => {
    const container = renderForSnapshot(<SearchComponent />);

    // Enter a search query
    const searchInput = container.querySelector('[data-testid="search-input"]');
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test query' } });
    }

    // Submit the form
    const searchForm = container.querySelector('[data-testid="search-form"]');
    if (searchForm) {
      fireEvent.submit(searchForm);
    }

    snapshotTest(container, 'search-component-loading');
  });

  it('renders the search form with query correctly', () => {
    const container = renderForSnapshot(<SearchComponent />);

    // Enter a search query
    const searchInput = container.querySelector('[data-testid="search-input"]');
    if (searchInput) {
      fireEvent.change(searchInput, { target: { value: 'test query' } });
    }

    snapshotTest(container, 'search-component-with-query');
  });
});
