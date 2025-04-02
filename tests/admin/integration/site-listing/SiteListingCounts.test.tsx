import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { SiteTable } from '@/components/admin/sites/SiteTable';

// Mock the hooks
jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

jest.mock('../../../../src/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

// Mock data
const mockSites = [
  { 
    id: 'site1', 
    name: 'Test Site 1', 
    domain: 'test1.com',
    listingCount: 2 
  },
  { 
    id: 'site2', 
    name: 'Test Site 2', 
    domain: 'test2.com',
    listingCount: 1 
  },
  { 
    id: 'site3', 
    name: 'Empty Site', 
    domain: 'empty.com',
    listingCount: 0 
  }
];

const mockListings = [
  { id: 'listing1', title: 'Listing 1', siteId: 'site1' },
  { id: 'listing2', title: 'Listing 2', siteId: 'site1' },
  { id: 'listing3', title: 'Listing 3', siteId: 'site2' }
];

// Mock the hooks implementation
import { useSites } from '@/components/admin/sites/hooks/useSites';
import { useListings } from '@/components/admin/listings/hooks/useListings';

const mockStore = configureStore([]);

describe.skip('Integration: Site Listing Counts', () => {
  let store;
  
  beforeEach(() => {
    // Mock the hooks to return test data
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
      getListingCountBySite: jest.fn((id) => {
        const site = mockSites.find(site => site.id === id);
        return site ? site.listingCount : 0;
      }),
    });
    
    (useListings as jest.Mock).mockReturnValue({
      listings: mockListings,
      isLoading: false,
      error: null,
      getListingsBySite: jest.fn((siteId) => mockListings.filter(listing => listing.siteId === siteId)),
      countListingsBySite: jest.fn((siteId) => mockListings.filter(listing => listing.siteId === siteId).length),
    });
    
    // Create a mock store
    store = mockStore({
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
      listings: {
        items: mockListings,
        loading: false,
        error: null,
      },
    });
  });

  it.skip('should display correct listing counts for each site', () => {
    render(
      <Provider store={store}>
        <SiteTable />
      </Provider>
    );

    // Get all site rows
    const siteRows = screen.getAllByTestId('site-table-row');
    
    // Check the count for site1
    const site1Row = siteRows.find(row => row.textContent?.includes('Test Site 1'));
    expect(site1Row).toBeInTheDocument();
    const site1Count = screen.getByTestId('site-listing-count-site1');
    expect(site1Count).toHaveTextContent('2');
    
    // Check the count for site2
    const site2Row = siteRows.find(row => row.textContent?.includes('Test Site 2'));
    expect(site2Row).toBeInTheDocument();
    const site2Count = screen.getByTestId('site-listing-count-site2');
    expect(site2Count).toHaveTextContent('1');
    
    // Check the count for the empty site
    const site3Row = siteRows.find(row => row.textContent?.includes('Empty Site'));
    expect(site3Row).toBeInTheDocument();
    const site3Count = screen.getByTestId('site-listing-count-site3');
    expect(site3Count).toHaveTextContent('0');
  });

  it.skip('should handle loading state when counting listings', () => {
    // Mock the loading state
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: true,
      error: null,
      getListingCountBySite: jest.fn(() => null),
    });
    
    render(
      <Provider store={store}>
        <SiteTable />
      </Provider>
    );

    // Check that loading indicators are displayed
    const loadingIndicators = screen.getAllByTestId(/site-listing-count-loading/);
    expect(loadingIndicators.length).toBe(mockSites.length);
  });

  it.skip('should handle error state when counting listings', () => {
    // Mock the error state
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: new Error('Failed to load listing counts'),
      getListingCountBySite: jest.fn(() => {
        throw new Error('Failed to load listing counts');
      }),
    });
    
    render(
      <Provider store={store}>
        <SiteTable />
      </Provider>
    );

    // Check that error indicators are displayed
    const errorIndicators = screen.getAllByTestId(/site-listing-count-error/);
    expect(errorIndicators.length).toBe(mockSites.length);
  });

  it.skip('should update listing counts when counts change', () => {
    // First render with initial counts
    const { rerender } = render(
      <Provider store={store}>
        <SiteTable />
      </Provider>
    );
    
    // Check initial counts
    expect(screen.getByTestId('site-listing-count-site1')).toHaveTextContent('2');
    
    // Update the mock data to simulate a change in counts
    const updatedSites = [
      ...mockSites.slice(0, 1),
      {
        ...mockSites[0],
        listingCount: 3 // Increment the count
      },
      ...mockSites.slice(1)
    ];
    
    // Update the hook mock
    (useSites as jest.Mock).mockReturnValue({
      sites: updatedSites,
      isLoading: false,
      error: null,
      getListingCountBySite: jest.fn((id) => {
        const site = updatedSites.find(site => site.id === id);
        return site ? site.listingCount : 0;
      }),
    });
    
    // Update the store
    store = mockStore({
      sites: {
        items: updatedSites,
        loading: false,
        error: null,
      },
      listings: {
        items: [
          ...mockListings,
          { id: 'listing4', title: 'New Listing', siteId: 'site1' }
        ],
        loading: false,
        error: null,
      },
    });
    
    // Re-render with updated store
    rerender(
      <Provider store={store}>
        <SiteTable />
      </Provider>
    );
    
    // Check that the count has been updated
    expect(screen.getByTestId('site-listing-count-site1')).toHaveTextContent('3');
  });
});
