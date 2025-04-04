import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ListingDetailPanel } from '@/components/admin/listings/components';

// Mock the hooks
jest.mock('@/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('@/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock data
const mockListing = {
  id: 'listing1',
  title: 'Listing 1',
  description: 'Test description',
  siteId: 'site1',
  site: {
    id: 'site1',
    name: 'Test Site 1',
    domain: 'test1.com'
  }
};

// Mock the hooks implementation
import { useListings } from '@/components/admin/listings/hooks/useListings';
import { useSites } from '@/components/admin/sites/hooks/useSites';

const mockStore = configureStore([]);

describe('Integration: Listing Site Association Display', () => {
  let store;

  beforeEach(() => {
    // Mock the hooks to return test data
    (useListings as jest.Mock).mockReturnValue({
      getListingById: jest.fn(() => mockListing),
      isLoading: false,
      error: null,
    });

    (useSites as jest.Mock).mockReturnValue({
      getSiteById: jest.fn(() => mockListing.site),
      isLoading: false,
      error: null,
    });

    // Create a mock store
    store = mockStore({
      listings: {
        selected: mockListing,
        loading: false,
        error: null,
      },
      sites: {
        items: [mockListing.site],
        loading: false,
        error: null,
      },
    });
  });

  it('should display associated site information in listing details', () => {
    render(
      <Provider store={store}>
        <ListingDetailPanel listingId={mockListing.id} />
      </Provider>
    );

    // Check that the site information section is present
    expect(screen.getByTestId('listing-site-info')).toBeInTheDocument();

    // Check that the site name is displayed correctly
    expect(screen.getByTestId('listing-site-name')).toHaveTextContent('Test Site 1');

    // Check that the site domain is displayed correctly
    expect(screen.getByTestId('listing-site-domain')).toHaveTextContent('test1.com');

    // Check for the site link
    const siteLink = screen.getByTestId('listing-site-link');
    expect(siteLink).toBeInTheDocument();
    expect(siteLink).toHaveAttribute('href', expect.stringContaining('/admin/sites/site1'));
  });

  it('should show appropriate UI for a listing with no associated site', () => {
    // Update the mock to return a listing with no site
    const listingWithNoSite = {
      ...mockListing,
      siteId: null,
      site: null
    };

    (useListings as jest.Mock).mockReturnValue({
      getListingById: jest.fn(() => listingWithNoSite),
      isLoading: false,
      error: null,
    });

    render(
      <Provider store={store}>
        <ListingDetailPanel listingId={listingWithNoSite.id} />
      </Provider>
    );

    // Check that the "No site associated" message is displayed
    expect(screen.getByTestId('listing-no-site-message')).toBeInTheDocument();
    expect(screen.getByTestId('listing-no-site-message')).toHaveTextContent('No site associated');

    // Check that the link to assign a site is present
    expect(screen.getByTestId('assign-site-button')).toBeInTheDocument();
  });

  it('should handle loading state when fetching site information', () => {
    // Mock the loading state
    (useListings as jest.Mock).mockReturnValue({
      getListingById: jest.fn(() => mockListing),
      isLoading: false,
      error: null,
    });

    (useSites as jest.Mock).mockReturnValue({
      getSiteById: jest.fn(() => null),
      isLoading: true,
      error: null,
    });

    render(
      <Provider store={store}>
        <ListingDetailPanel listingId={mockListing.id} />
      </Provider>
    );

    // Check that the loading indicator is displayed
    expect(screen.getByTestId('site-info-loading')).toBeInTheDocument();
  });

  it('should handle error state when site information cannot be retrieved', () => {
    // Mock the error state
    (useListings as jest.Mock).mockReturnValue({
      getListingById: jest.fn(() => mockListing),
      isLoading: false,
      error: null,
    });

    (useSites as jest.Mock).mockReturnValue({
      getSiteById: jest.fn(() => null),
      isLoading: false,
      error: new Error('Failed to load site information'),
    });

    render(
      <Provider store={store}>
        <ListingDetailPanel listingId={mockListing.id} />
      </Provider>
    );

    // Check that the error message is displayed
    expect(screen.getByTestId('site-info-error')).toBeInTheDocument();
    expect(screen.getByTestId('site-info-error')).toHaveTextContent('Failed to load site information');
  });
});
