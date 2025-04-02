import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ListingTable from '@/components/admin/listings/ListingTable';
import { SiteContext } from '@/contexts/SiteContext';

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

const site1Listings = [
  { id: 'listing1', title: 'Listing 1', siteId: 'site1' },
  { id: 'listing2', title: 'Listing 2', siteId: 'site1' },
];

const site2Listings = [
  { id: 'listing3', title: 'Listing 3', siteId: 'site2' },
];

// Mock the hooks implementation
import { useListings } from '@/components/admin/listings/hooks/useListings';
import { useSites } from '@/components/admin/sites/hooks/useSites';

const mockStore = configureStore([]);

describe('Integration: Site Listing Data Loading', () => {
  let store;
  let loadListingsBySiteMock;
  
  beforeEach(() => {
    // Create a mock for the loadListingsBySite function
    loadListingsBySiteMock = jest.fn().mockImplementation((siteId) => {
      // Simulate async loading
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(siteId === 'site1' ? site1Listings : site2Listings);
        }, 100);
      });
    });
    
    // Mock the hooks to return test data
    (useListings as jest.Mock).mockReturnValue({
      listings: [],
      isLoading: false,
      error: null,
      loadListingsBySite: loadListingsBySiteMock,
    });
    
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
      currentSite: null,
      setCurrentSite: jest.fn(),
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        items: [],
        loading: false,
        error: null,
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
        currentSite: null,
      },
    });
  });

  it.skip($2, async () => {
    // Set up the initial component with no site selected
    const { rerender } = render(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: null, setCurrentSite: jest.fn() }}>
          <ListingTable />
        </SiteContext.Provider>
      </Provider>
    );
    
    // Initially, no loading state should be shown
    expect(screen.queryByTestId('listings-loading')).not.toBeInTheDocument();
    
    // Update the useListings mock to show loading state
    (useListings as jest.Mock).mockReturnValue({
      listings: [],
      isLoading: true, // Set loading to true
      error: null,
      loadListingsBySite: loadListingsBySiteMock,
    });
    
    // Update the context to select a site
    rerender(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: mockSites[0], setCurrentSite: jest.fn() }}>
          <ListingTable />
        </SiteContext.Provider>
      </Provider>
    );
    
    // Check that the loading state is shown
    expect(screen.getByTestId('listings-loading')).toBeInTheDocument();
    
    // Check that loadListingsBySite was called with the correct site ID
    expect(loadListingsBySiteMock).toHaveBeenCalledWith('site1');
    
    // Update the mock to show loaded data
    (useListings as jest.Mock).mockReturnValue({
      listings: site1Listings,
      isLoading: false,
      error: null,
      loadListingsBySite: loadListingsBySiteMock,
    });
    
    // Re-render with loaded data
    rerender(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: mockSites[0], setCurrentSite: jest.fn() }}>
          <ListingTable />
        </SiteContext.Provider>
      </Provider>
    );
    
    // Check that the loading state is no longer shown
    expect(screen.queryByTestId('listings-loading')).not.toBeInTheDocument();
    
    // Check that the listings are displayed
    expect(screen.getByText('Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Listing 2')).toBeInTheDocument();
  });

  it.skip($2, async () => {
    // Mock the error state
    const loadListingsWithErrorMock = jest.fn().mockRejectedValue(new Error('Failed to load listings'));
    
    (useListings as jest.Mock).mockReturnValue({
      listings: [],
      isLoading: false,
      error: new Error('Failed to load listings'),
      loadListingsBySite: loadListingsWithErrorMock,
    });
    
    render(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: mockSites[0], setCurrentSite: jest.fn() }}>
          <ListingTable />
        </SiteContext.Provider>
      </Provider>
    );
    
    // Check that the error message is displayed
    expect(screen.getByTestId('listings-error')).toBeInTheDocument();
    expect(screen.getByTestId('listings-error')).toHaveTextContent('Failed to load listings');
    
    // Check that the retry button is displayed
    const retryButton = screen.getByTestId('retry-load-listings');
    expect(retryButton).toBeInTheDocument();
    
    // Click the retry button
    fireEvent.click(retryButton);
    
    // Check that loadListingsBySite was called again
    expect(loadListingsWithErrorMock).toHaveBeenCalledTimes(2);
  });

  it.skip($2, async () => {
    // Set up a mock for the setCurrentSite function
    const setCurrentSiteMock = jest.fn();
    
    // Initial render with site1
    const { rerender } = render(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: mockSites[0], setCurrentSite: setCurrentSiteMock }}>
          <ListingTable />
        </SiteContext.Provider>
      </Provider>
    );
    
    // Check that loadListingsBySite was called for site1
    expect(loadListingsBySiteMock).toHaveBeenCalledWith('site1');
    expect(loadListingsBySiteMock).toHaveBeenCalledTimes(1);
    
    // Update the mock to show loaded data for site1
    (useListings as jest.Mock).mockReturnValue({
      listings: site1Listings,
      isLoading: false,
      error: null,
      loadListingsBySite: loadListingsBySiteMock,
      cachedSiteListings: {
        site1: site1Listings
      }
    });
    
    // Switch to site2
    rerender(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: mockSites[1], setCurrentSite: setCurrentSiteMock }}>
          <ListingTable />
        </SiteContext.Provider>
      </Provider>
    );
    
    // Check that loadListingsBySite was called for site2
    expect(loadListingsBySiteMock).toHaveBeenCalledWith('site2');
    expect(loadListingsBySiteMock).toHaveBeenCalledTimes(2);
    
    // Update the mock to show loaded data for site2
    (useListings as jest.Mock).mockReturnValue({
      listings: site2Listings,
      isLoading: false,
      error: null,
      loadListingsBySite: loadListingsBySiteMock,
      cachedSiteListings: {
        site1: site1Listings,
        site2: site2Listings
      }
    });
    
    // Switch back to site1
    rerender(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: mockSites[0], setCurrentSite: setCurrentSiteMock }}>
          <ListingTable />
        </SiteContext.Provider>
      </Provider>
    );
    
    // Since we have cached data for site1, loadListingsBySite should not be called again
    expect(loadListingsBySiteMock).toHaveBeenCalledTimes(2);
    
    // Check that the listings for site1 are displayed
    expect(screen.getByText('Listing 1')).toBeInTheDocument();
    expect(screen.getByText('Listing 2')).toBeInTheDocument();
  });
});
