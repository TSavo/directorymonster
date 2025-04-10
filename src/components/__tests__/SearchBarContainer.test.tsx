import React from 'react';
import { render } from '@testing-library/react';
import { SearchBarContainer } from '../SearchBarContainer';
import { SearchBarPresentation } from '../SearchBarPresentation';

// Mock the useSearch hook
jest.mock('../hooks/useSearch', () => ({
  useSearch: jest.fn(() => ({
    searchTerm: '',
    setSearchTerm: jest.fn(),
    handleSearch: jest.fn(),
    isSearching: false
  }))
}));

// Mock the SearchBarPresentation component
jest.mock('../SearchBarPresentation', () => ({
  SearchBarPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('SearchBarContainer', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the presentation component with correct props', () => {
    // Render the container
    render(<SearchBarContainer siteId="site-1" />);

    // Check that the presentation component was rendered with correct props
    expect(SearchBarPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: expect.any(String),
        onSearchTermChange: expect.any(Function),
        onSubmit: expect.any(Function),
        isSearching: expect.any(Boolean)
      }),
      expect.anything()
    );
  });

  it('passes siteId to the useSearch hook', () => {
    // Import the actual hook to access the mock
    const { useSearch } = require('../hooks/useSearch');

    // Render the container with siteId
    render(<SearchBarContainer siteId="site-1" />);

    // Check that useSearch was called with correct props
    expect(useSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        siteId: 'site-1'
      })
    );
  });

  it('passes initialSearchTerm to the useSearch hook', () => {
    // Import the actual hook to access the mock
    const { useSearch } = require('../hooks/useSearch');

    // Render the container with initialSearchTerm
    render(<SearchBarContainer siteId="site-1" initialSearchTerm="initial query" />);

    // Check that useSearch was called with correct props
    expect(useSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        initialSearchTerm: 'initial query'
      })
    );
  });

  it('passes placeholder to the presentation component', () => {
    // Render the container with placeholder
    render(<SearchBarContainer siteId="site-1" placeholder="Custom placeholder" />);

    // Check that the presentation component was rendered with correct props
    expect(SearchBarPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: 'Custom placeholder'
      }),
      expect.anything()
    );
  });

  it('passes className to the presentation component', () => {
    // Render the container with className
    render(<SearchBarContainer siteId="site-1" className="custom-class" />);

    // Check that the presentation component was rendered with correct props
    expect(SearchBarPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        className: 'custom-class'
      }),
      expect.anything()
    );
  });

  it('passes buttonLabel to the presentation component', () => {
    // Render the container with buttonLabel
    render(<SearchBarContainer siteId="site-1" buttonLabel="Search" />);

    // Check that the presentation component was rendered with correct props
    expect(SearchBarPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        buttonLabel: 'Search'
      }),
      expect.anything()
    );
  });

  it('uses the provided searchHook when specified', () => {
    // Create a mock search hook
    const mockSearchHook = jest.fn(() => ({
      searchTerm: 'custom',
      setSearchTerm: jest.fn(),
      handleSearch: jest.fn(),
      isSearching: true
    }));

    // Render the container with the custom search hook
    render(<SearchBarContainer siteId="site-1" searchHook={mockSearchHook} />);

    // Check that the custom search hook was used
    expect(mockSearchHook).toHaveBeenCalled();

    // Check that the presentation component was rendered with correct props
    expect(SearchBarPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        searchTerm: 'custom',
        isSearching: true
      }),
      expect.anything()
    );
  });
});
