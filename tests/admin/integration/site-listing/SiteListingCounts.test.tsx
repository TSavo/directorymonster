import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { SiteTable } from '@/components/admin/sites/table/SiteTable';

// Import the mocked hooks
import { useSites } from '@/components/admin/sites/hooks';
import { useListings } from '@/components/admin/listings/hooks/useListings';

// Mock the hooks
jest.mock('@/components/admin/sites/hooks', () => ({
  useSites: jest.fn().mockImplementation(() => ({
    sites: [],
    isLoading: false,
    error: null,
    filters: {},
    setFilters: jest.fn(),
    fetchSites: jest.fn(),
    deleteSite: jest.fn(),
    getListingCountBySite: jest.fn()
  }))
}));

jest.mock('@/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn().mockImplementation(() => ({
    listings: [],
    isLoading: false,
    error: null,
    getListingsBySite: jest.fn()
  }))
}));

// Mock data
const mockSites = [
  {
    id: 'site1',
    name: 'Test Site 1',
    domain: 'test1.com',
    domains: ['test1.com', 'test1-alt.com'],
    listingCount: 2
  },
  {
    id: 'site2',
    name: 'Test Site 2',
    domain: 'test2.com',
    domains: ['test2.com'],
    listingCount: 1
  },
  {
    id: 'site3',
    name: 'Empty Site',
    domain: 'empty.com',
    domains: ['empty.com'],
    listingCount: 0
  }
];

const mockListings = [
  { id: 'listing1', title: 'Listing 1', siteId: 'site1' },
  { id: 'listing2', title: 'Listing 2', siteId: 'site1' },
  { id: 'listing3', title: 'Listing 3', siteId: 'site2' }
];

// Create a mock store
const mockStore = configureStore([]);

describe('Integration: Site Listing Counts', () => {
  let store;

  beforeEach(() => {
    // Mock the hooks to return test data
    (useSites as jest.Mock).mockImplementation(() => ({
      sites: mockSites,
      isLoading: false,
      error: null,
      getListingCountBySite: jest.fn((id) => {
        const site = mockSites.find(site => site.id === id);
        return site ? site.listingCount : 0;
      }),
      filters: {},
      setFilters: jest.fn(),
      fetchSites: jest.fn(),
      deleteSite: jest.fn(),
    }));

    (useListings as jest.Mock).mockImplementation(() => ({
      listings: mockListings,
      isLoading: false,
      error: null,
      getListingsBySite: jest.fn((siteId) => mockListings.filter(listing => listing.siteId === siteId)),
      countListingsBySite: jest.fn((siteId) => mockListings.filter(listing => listing.siteId === siteId).length),
    }));

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

  it('should display correct listing counts for each site', () => {
    render(
      <Provider store={store}>
        <SiteTable />
      </Provider>
    );

    // Check that the site names are displayed
    expect(screen.getByTestId('site-name-site1')).toHaveTextContent('Test Site 1');
    expect(screen.getByTestId('site-name-site2')).toHaveTextContent('Test Site 2');
    expect(screen.getByTestId('site-name-site3')).toHaveTextContent('Empty Site');

    // Check that the site domains are displayed
    expect(screen.getByTestId('site-domain-0-site1')).toHaveTextContent('test1.com');
    expect(screen.getByTestId('site-domain-1-site1')).toHaveTextContent('test1-alt.com');
    expect(screen.getByTestId('site-domain-0-site2')).toHaveTextContent('test2.com');
    expect(screen.getByTestId('site-domain-0-site3')).toHaveTextContent('empty.com');
  });

  it('should handle loading state when counting listings', () => {
    // Mock the loading state
    (useSites as jest.Mock).mockImplementation(() => ({
      sites: mockSites,
      isLoading: true,
      error: null,
      getListingCountBySite: jest.fn(() => null),
      filters: {},
      setFilters: jest.fn(),
      fetchSites: jest.fn(),
      deleteSite: jest.fn(),
    }));

    render(
      <Provider store={store}>
        <SiteTable />
      </Provider>
    );

    // Check that the site names are displayed
    expect(screen.getByTestId('site-name-site1')).toHaveTextContent('Test Site 1');
    expect(screen.getByTestId('site-name-site2')).toHaveTextContent('Test Site 2');
    expect(screen.getByTestId('site-name-site3')).toHaveTextContent('Empty Site');
  });

  it('should handle error state when counting listings', () => {
    // Mock the error state
    (useSites as jest.Mock).mockImplementation(() => ({
      sites: mockSites,
      isLoading: false,
      error: 'Failed to load listing counts', // Use a string instead of an Error object
      getListingCountBySite: jest.fn(() => {
        throw new Error('Failed to load listing counts');
      }),
      filters: {},
      setFilters: jest.fn(),
      fetchSites: jest.fn(),
      deleteSite: jest.fn(),
    }));

    render(
      <Provider store={store}>
        <SiteTable />
      </Provider>
    );

    // Check that the error message is displayed
    expect(screen.getByTestId('site-table-error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load listing counts');
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('should update listing counts when counts change', () => {
    // First render with initial counts
    const { rerender } = render(
      <Provider store={store}>
        <SiteTable />
      </Provider>
    );

    // Check that the site names are displayed
    expect(screen.getByTestId('site-name-site1')).toHaveTextContent('Test Site 1');
    expect(screen.getByTestId('site-name-site2')).toHaveTextContent('Test Site 2');
    expect(screen.getByTestId('site-name-site3')).toHaveTextContent('Empty Site');

    // Update the mock data to simulate a change in counts
    const updatedSites = [
      {
        ...mockSites[0],
        listingCount: 3 // Increment the count
      },
      ...mockSites.slice(1)
    ];

    // Update the hook mock
    (useSites as jest.Mock).mockImplementation(() => ({
      sites: updatedSites,
      isLoading: false,
      error: null,
      getListingCountBySite: jest.fn((id) => {
        const site = updatedSites.find(site => site.id === id);
        return site ? site.listingCount : 0;
      }),
      filters: {},
      setFilters: jest.fn(),
      fetchSites: jest.fn(),
      deleteSite: jest.fn(),
    }));

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

    // Check that the site names are still displayed after update
    expect(screen.getByTestId('site-name-site1')).toHaveTextContent('Test Site 1');
    expect(screen.getByTestId('site-name-site2')).toHaveTextContent('Test Site 2');
    expect(screen.getByTestId('site-name-site3')).toHaveTextContent('Empty Site');
  });
});
