/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { renderWithWrapper } from '../TestWrapper';

// Mock the search component
const SearchComponent = () => {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [isOpen, setIsOpen] = React.useState(false);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setResults(['Result 1', 'Result 2', 'Result 3']);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        if (selectedIndex >= 0) {
          e.preventDefault();
          alert(`Selected: ${results[selectedIndex]}`);
          setIsOpen(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSearch} data-testid="search-form">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          aria-label="Search"
          data-testid="search-input"
        />
        <button type="submit" data-testid="search-button">Search</button>
      </form>
      
      {isOpen && results.length > 0 && (
        <ul data-testid="search-results">
          {results.map((result, index) => (
            <li
              key={index}
              data-testid={`search-result-${index}`}
              className={selectedIndex === index ? 'selected' : ''}
              style={{ backgroundColor: selectedIndex === index ? '#eee' : 'transparent' }}
            >
              {result}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

describe('Search Keyboard Navigation', () => {
  it('opens search results when submitting the form', async () => {
    renderWithWrapper(<SearchComponent />);
    
    // Type in the search input
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Submit the form
    const searchForm = screen.getByTestId('search-form');
    fireEvent.submit(searchForm);
    
    // Check that search results are displayed
    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });
    
    // Check that all results are rendered
    expect(screen.getByText('Result 1')).toBeInTheDocument();
    expect(screen.getByText('Result 2')).toBeInTheDocument();
    expect(screen.getByText('Result 3')).toBeInTheDocument();
  });
  
  it('navigates through search results with arrow keys', async () => {
    renderWithWrapper(<SearchComponent />);
    
    // Type in the search input
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Submit the form
    const searchForm = screen.getByTestId('search-form');
    fireEvent.submit(searchForm);
    
    // Check that search results are displayed
    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });
    
    // Initially, no result is selected
    expect(screen.getByTestId('search-result-0')).not.toHaveClass('selected');
    expect(screen.getByTestId('search-result-1')).not.toHaveClass('selected');
    expect(screen.getByTestId('search-result-2')).not.toHaveClass('selected');
    
    // Press ArrowDown to select the first result
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(screen.getByTestId('search-result-0')).toHaveStyle({ backgroundColor: '#eee' });
    
    // Press ArrowDown again to select the second result
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(screen.getByTestId('search-result-1')).toHaveStyle({ backgroundColor: '#eee' });
    
    // Press ArrowUp to go back to the first result
    fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
    expect(screen.getByTestId('search-result-0')).toHaveStyle({ backgroundColor: '#eee' });
  });
  
  it('closes search results with Escape key', async () => {
    renderWithWrapper(<SearchComponent />);
    
    // Type in the search input
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // Submit the form
    const searchForm = screen.getByTestId('search-form');
    fireEvent.submit(searchForm);
    
    // Check that search results are displayed
    await waitFor(() => {
      expect(screen.getByTestId('search-results')).toBeInTheDocument();
    });
    
    // Press Escape to close the results
    fireEvent.keyDown(searchInput, { key: 'Escape' });
    
    // Check that search results are no longer displayed
    expect(screen.queryByTestId('search-results')).not.toBeInTheDocument();
  });
});
