import React from 'react';
import { render, screen } from '@testing-library/react';
import { AdvancedSearchContainer } from '../AdvancedSearchContainer';
import { AdvancedSearchPresentation } from '../AdvancedSearchPresentation';

// Mock the useAdvancedSearch hook
jest.mock('../hooks/useAdvancedSearch', () => ({
  useAdvancedSearch: jest.fn(() => ({
    open: false,
    setOpen: jest.fn(),
    query: 'test query',
    setQuery: jest.fn(),
    scope: 'all',
    setScope: jest.fn(),
    filters: [],
    showFilters: false,
    setShowFilters: jest.fn(),
    handleSearch: jest.fn(),
    addFilter: jest.fn(),
    removeFilter: jest.fn(),
    clearFilters: jest.fn()
  }))
}));

// Mock the AdvancedSearchPresentation component
jest.mock('../AdvancedSearchPresentation', () => ({
  AdvancedSearchPresentation: jest.fn(() => <div data-testid="mock-presentation" />)
}));

describe('AdvancedSearchContainer', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the presentation component with correct props', () => {
    // Render the container
    render(<AdvancedSearchContainer />);
    
    // Check that the presentation component was rendered with correct props
    expect(AdvancedSearchPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        open: false,
        onOpenChange: expect.any(Function),
        query: 'test query',
        onQueryChange: expect.any(Function),
        scope: 'all',
        onScopeChange: expect.any(Function),
        filters: [],
        showFilters: false,
        onShowFiltersChange: expect.any(Function),
        onSearch: expect.any(Function),
        onAddFilter: expect.any(Function),
        onRemoveFilter: expect.any(Function),
        onClearFilters: expect.any(Function)
      }),
      expect.anything()
    );
  });

  it('passes children to the presentation component', () => {
    // Render the container with children
    render(
      <AdvancedSearchContainer>
        <button>Custom Trigger</button>
      </AdvancedSearchContainer>
    );
    
    // Check that the presentation component was rendered with children
    expect(AdvancedSearchPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        children: <button>Custom Trigger</button>
      }),
      expect.anything()
    );
  });

  it('passes dialogClassName to the presentation component', () => {
    // Render the container with dialogClassName
    render(<AdvancedSearchContainer dialogClassName="custom-dialog-class" />);
    
    // Check that the presentation component was rendered with dialogClassName
    expect(AdvancedSearchPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        dialogClassName: 'custom-dialog-class'
      }),
      expect.anything()
    );
  });

  it('passes triggerButtonVariant to the presentation component', () => {
    // Render the container with triggerButtonVariant
    render(<AdvancedSearchContainer triggerButtonVariant="ghost" />);
    
    // Check that the presentation component was rendered with triggerButtonVariant
    expect(AdvancedSearchPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerButtonVariant: 'ghost'
      }),
      expect.anything()
    );
  });

  it('passes triggerButtonSize to the presentation component', () => {
    // Render the container with triggerButtonSize
    render(<AdvancedSearchContainer triggerButtonSize="lg" />);
    
    // Check that the presentation component was rendered with triggerButtonSize
    expect(AdvancedSearchPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerButtonSize: 'lg'
      }),
      expect.anything()
    );
  });

  it('passes triggerButtonClassName to the presentation component', () => {
    // Render the container with triggerButtonClassName
    render(<AdvancedSearchContainer triggerButtonClassName="custom-button-class" />);
    
    // Check that the presentation component was rendered with triggerButtonClassName
    expect(AdvancedSearchPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        triggerButtonClassName: 'custom-button-class'
      }),
      expect.anything()
    );
  });

  it('passes initialQuery to the useAdvancedSearch hook', () => {
    // Import the actual hook to access the mock
    const { useAdvancedSearch } = require('../hooks/useAdvancedSearch');
    
    // Render the container with initialQuery
    render(<AdvancedSearchContainer initialQuery="test query" />);
    
    // Check that useAdvancedSearch was called with initialQuery
    expect(useAdvancedSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        initialQuery: 'test query'
      })
    );
  });

  it('passes initialScope to the useAdvancedSearch hook', () => {
    // Import the actual hook to access the mock
    const { useAdvancedSearch } = require('../hooks/useAdvancedSearch');
    
    // Render the container with initialScope
    render(<AdvancedSearchContainer initialScope="users" />);
    
    // Check that useAdvancedSearch was called with initialScope
    expect(useAdvancedSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        initialScope: 'users'
      })
    );
  });

  it('passes initialFilters to the useAdvancedSearch hook', () => {
    // Import the actual hook to access the mock
    const { useAdvancedSearch } = require('../hooks/useAdvancedSearch');
    
    // Create initialFilters
    const initialFilters = [
      { key: 'userStatus', value: 'active', label: 'Status: active' }
    ];
    
    // Render the container with initialFilters
    render(<AdvancedSearchContainer initialFilters={initialFilters} />);
    
    // Check that useAdvancedSearch was called with initialFilters
    expect(useAdvancedSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        initialFilters
      })
    );
  });

  it('passes initialOpen to the useAdvancedSearch hook', () => {
    // Import the actual hook to access the mock
    const { useAdvancedSearch } = require('../hooks/useAdvancedSearch');
    
    // Render the container with initialOpen
    render(<AdvancedSearchContainer initialOpen={true} />);
    
    // Check that useAdvancedSearch was called with initialOpen
    expect(useAdvancedSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        initialOpen: true
      })
    );
  });

  it('passes initialShowFilters to the useAdvancedSearch hook', () => {
    // Import the actual hook to access the mock
    const { useAdvancedSearch } = require('../hooks/useAdvancedSearch');
    
    // Render the container with initialShowFilters
    render(<AdvancedSearchContainer initialShowFilters={true} />);
    
    // Check that useAdvancedSearch was called with initialShowFilters
    expect(useAdvancedSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        initialShowFilters: true
      })
    );
  });

  it('passes searchPath to the useAdvancedSearch hook', () => {
    // Import the actual hook to access the mock
    const { useAdvancedSearch } = require('../hooks/useAdvancedSearch');
    
    // Render the container with searchPath
    render(<AdvancedSearchContainer searchPath="/custom/search" />);
    
    // Check that useAdvancedSearch was called with searchPath
    expect(useAdvancedSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        searchPath: '/custom/search'
      })
    );
  });

  it('uses the provided advancedSearchHook when specified', () => {
    // Create a mock advanced search hook
    const mockAdvancedSearchHook = jest.fn(() => ({
      open: true,
      setOpen: jest.fn(),
      query: 'custom query',
      setQuery: jest.fn(),
      scope: 'users',
      setScope: jest.fn(),
      filters: [{ key: 'userStatus', value: 'active', label: 'Status: active' }],
      showFilters: true,
      setShowFilters: jest.fn(),
      handleSearch: jest.fn(),
      addFilter: jest.fn(),
      removeFilter: jest.fn(),
      clearFilters: jest.fn()
    }));
    
    // Render the container with the custom advanced search hook
    render(<AdvancedSearchContainer advancedSearchHook={mockAdvancedSearchHook} />);
    
    // Check that the custom advanced search hook was used
    expect(mockAdvancedSearchHook).toHaveBeenCalled();
    
    // Check that the presentation component was rendered with the custom hook's values
    expect(AdvancedSearchPresentation).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        query: 'custom query',
        scope: 'users',
        filters: [{ key: 'userStatus', value: 'active', label: 'Status: active' }],
        showFilters: true
      }),
      expect.anything()
    );
  });
});
