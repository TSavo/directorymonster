import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ListingTableHeader } from '../../../../src/components/admin/listings/components';

// Import the mock creator utility
import createMockUseListings from '../../../../src/components/admin/listings/hooks/useListings.mock';

// Mock the hooks
jest.mock('../../../../src/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock data
const mockSites = [
  { id: 'site1', name: 'Test Site 1', domain: 'test1.com' },
  { id: 'site2', name: 'Test Site 2', domain: 'test2.com' },
];

// Mock the hooks implementation
import { useListings } from '../../../../src/components/admin/listings/hooks/useListings';
import { useSites } from '../../../../src/components/admin/sites/hooks/useSites';

const mockStore = configureStore([]);

describe('Site Filter with Search Term', () => {
  let store;
  let setSearchTerm;
  let filterBySite;
  
  beforeEach(() => {
    // Set up mock functions
    setSearchTerm = jest.fn();
    filterBySite = jest.fn();
    
    // Create mock listings hook
    const mockUseListings = createMockUseListings();
    mockUseListings.setSearchTerm = setSearchTerm;
    mockUseListings.filterBySite = filterBySite;
    
    // Apply the mock
    (useListings as jest.Mock).mockReturnValue(mockUseListings);
    
    // Mock sites hook
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        items: [],
        loading: false,
        error: null,
        filters: {},
        search: '',
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
  });

  it('should allow searching within a site filter', () => {
    // First set up a site filter
    const mockUseListingsWithSiteFilter = createMockUseListings({
      activeFilters: { siteId: 'site1' },
      searchTerm: ''
    });
    mockUseListingsWithSiteFilter.setSearchTerm = setSearchTerm;
    mockUseListingsWithSiteFilter.filterBySite = filterBySite;
    
    (useListings as jest.Mock).mockReturnValue(mockUseListingsWithSiteFilter);
    
    // Render the component
    render(
      <Provider store={store}>
        <ListingTableHeader 
          totalListings={10}
          searchTerm=""
          setSearchTerm={setSearchTerm}
          categoryFilter={null}
          setCategoryFilter={jest.fn()}
          siteFilter="site1"
          setSiteFilter={filterBySite}
          categories={[]}
          sites={mockSites}
        />
      </Provider>
    );
    
    // Find the search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    
    // Enter a search term
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    // Fire the search submission
    fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });
    
    // Verify the search function was called
    expect(setSearchTerm).toHaveBeenCalledWith('test search');
    
    // The site filter should remain active while searching
    expect(mockUseListingsWithSiteFilter.activeFilters.siteId).toBe('site1');
  });
});
