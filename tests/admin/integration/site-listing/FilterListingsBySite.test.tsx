import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ListingTable } from '@/components/admin/listings/ListingTable';
import { SiteFilterDropdown } from '@/components/admin/listings/components/SiteFilterDropdown';

// Mock the hooks and API calls
jest.mock('@/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('@/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock data
const mockSites = [
  { id: 'site1', name: 'Test Site 1', domain: 'test1.com' },
  { id: 'site2', name: 'Test Site 2', domain: 'test2.com' },
];

const mockListings = [
  { id: 'listing1', title: 'Listing 1', siteId: 'site1' },
  { id: 'listing2', title: 'Listing 2', siteId: 'site1' },
  { id: 'listing3', title: 'Listing 3', siteId: 'site2' },
  { id: 'listing4', title: 'Listing 4', siteId: null },
];

// Mock the hooks implementation
import { useListings } from '@/hooks/useListings';
import { useSites } from '@/hooks/useSites';

const mockStore = configureStore([]);

describe('Integration: Filtering Listings By Site', () => {
  let store;
  
  beforeEach(() => {
    // Mock the hooks to return test data
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings,
      isLoading: false,
      error: null,
      filterBySite: jest.fn((siteId) => {
        return mockListings.filter(listing => listing.siteId === siteId);
      }),
      clearFilters: jest.fn(),
    });
    
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        items: mockListings,
        loading: false,
        error: null,
        filters: {
          siteId: null,
        },
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
  });

  it('should display all listings when no site filter is applied', () => {
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );

    // Check that all listings are visible
    expect(screen.getByText('Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Listing 2')).toBeInTheDocument();
    expect(screen.getByText('Listing 3')).toBeInTheDocument();
    expect(screen.getByText('Listing 4')).toBeInTheDocument();
  });

  it('should filter listings when a site is selected', async () => {
    const { filterBySite } = useListings();
    
    render(
      <Provider store={store}>
        <SiteFilterDropdown />
        <ListingTable />
      </Provider>
    );

    // Open the site filter dropdown
    fireEvent.click(screen.getByTestId('site-filter-dropdown'));
    
    // Select the first site
    fireEvent.click(screen.getByText('Test Site 1'));
    
    // Check that filterBySite was called with the correct site ID
    expect(filterBySite).toHaveBeenCalledWith('site1');
    
    // Update the mock to simulate filtered results
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings.filter(listing => listing.siteId === 'site1'),
      isLoading: false,
      error: null,
      filterBySite,
      clearFilters: jest.fn(),
    });
    
    // Re-render with updated data
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Wait for the component to update
    await waitFor(() => {
      // Check that only listings from site1 are visible
      expect(screen.getByText('Listing 1')).toBeInTheDocument();
      expect(screen.getByText('Listing 2')).toBeInTheDocument();
      expect(screen.queryByText('Listing 3')).not.toBeInTheDocument();
      expect(screen.queryByText('Listing 4')).not.toBeInTheDocument();
    });
  });

  it('should display the active site filter in the UI', async () => {
    // Mock the store with an active site filter
    store = mockStore({
      listings: {
        items: mockListings.filter(listing => listing.siteId === 'site1'),
        loading: false,
        error: null,
        filters: {
          siteId: 'site1',
        },
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
    
    render(
      <Provider store={store}>
        <SiteFilterDropdown />
      </Provider>
    );
    
    // Check that the active filter is displayed
    expect(screen.getByTestId('active-site-filter')).toHaveTextContent('Test Site 1');
  });

  it('should clear site filter when the clear button is clicked', async () => {
    const { clearFilters } = useListings();
    
    // Mock the store with an active site filter
    store = mockStore({
      listings: {
        items: mockListings.filter(listing => listing.siteId === 'site1'),
        loading: false,
        error: null,
        filters: {
          siteId: 'site1',
        },
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
    
    render(
      <Provider store={store}>
        <SiteFilterDropdown />
      </Provider>
    );
    
    // Click the clear filter button
    fireEvent.click(screen.getByTestId('clear-site-filter'));
    
    // Check that clearFilters was called
    expect(clearFilters).toHaveBeenCalled();
    
    // Update the mock to simulate cleared filters
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings,
      isLoading: false,
      error: null,
      filterBySite: jest.fn(),
      clearFilters,
    });
    
    // Re-render with updated data
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Wait for the component to update
    await waitFor(() => {
      // Check that all listings are visible again
      expect(screen.getByText('Listing 1')).toBeInTheDocument();
      expect(screen.getByText('Listing 2')).toBeInTheDocument();
      expect(screen.getByText('Listing 3')).toBeInTheDocument();
      expect(screen.getByText('Listing 4')).toBeInTheDocument();
    });
  });

  it('should handle the case when there are no listings for a selected site', async () => {
    // Mock a site with no listings
    const noListingsSiteId = 'site3';
    const updatedMockSites = [
      ...mockSites,
      { id: noListingsSiteId, name: 'Empty Site', domain: 'empty.com' }
    ];
    
    (useSites as jest.Mock).mockReturnValue({
      sites: updatedMockSites,
      isLoading: false,
      error: null,
    });
    
    const { filterBySite } = useListings();
    
    render(
      <Provider store={store}>
        <SiteFilterDropdown />
      </Provider>
    );
    
    // Open the site filter dropdown
    fireEvent.click(screen.getByTestId('site-filter-dropdown'));
    
    // Select the empty site
    fireEvent.click(screen.getByText('Empty Site'));
    
    // Check that filterBySite was called with the correct site ID
    expect(filterBySite).toHaveBeenCalledWith(noListingsSiteId);
    
    // Update the mock to simulate empty results
    (useListings as jest.Mock).mockReturnValue({
      listings: [],
      isLoading: false,
      error: null,
      filterBySite,
      clearFilters: jest.fn(),
    });
    
    // Re-render with updated data
    render(
      <Provider store={store}>
        <ListingTable />
      </Provider>
    );
    
    // Wait for the component to update
    await waitFor(() => {
      // Check that the empty state message is displayed
      expect(screen.getByTestId('empty-listings-message')).toBeInTheDocument();
      expect(screen.getByTestId('empty-listings-message')).toHaveTextContent('No listings found for this site');
    });
  });
});
