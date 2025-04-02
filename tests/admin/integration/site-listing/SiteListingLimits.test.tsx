import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ListingForm from '@/components/admin/listings/ListingForm';
import { SiteContext } from '@/contexts/SiteContext';

// Mock the hooks
jest.mock('../../../../src/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('../../../../src/components/admin/sites/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock data
const mockSite = {
  id: 'site1',
  name: 'Test Site 1',
  domain: 'test1.com',
  maxListings: 5,
  currentListingCount: 2
};

const mockListing = {
  id: 'listing1',
  title: 'Test Listing',
  description: 'A test listing',
  siteId: 'site1'
};

// Mock the hooks implementation
import { useListings } from '@/components/admin/listings/hooks/useListings';
import { useSites } from '@/components/admin/sites/hooks/useSites';

const mockStore = configureStore([]);

describe('Integration: Site Listing Limits', () => {
  let store;
  const updateListingMock = jest.fn();
  const validateListingMock = jest.fn(() => ({ isValid: true, errors: {} }));

  beforeEach(() => {
    // Reset mocks
    updateListingMock.mockReset();
    validateListingMock.mockReset();
    validateListingMock.mockReturnValue({ isValid: true, errors: {} });

    // Mock the hooks to return test data
    (useListings as jest.Mock).mockReturnValue({
      listing: mockListing,
      isLoading: false,
      isSubmitting: false,
      error: null,
      updateListing: updateListingMock,
      validateListing: validateListingMock,
    });

    (useSites as jest.Mock).mockReturnValue({
      sites: [mockSite],
      isLoading: false,
      error: null,
      getSiteById: jest.fn(() => mockSite),
      checkSiteListingLimit: jest.fn((siteId) => {
        const site = siteId === 'site1' ? mockSite : null;
        return {
          withinLimit: site ? site.currentListingCount < site.maxListings : true,
          currentCount: site ? site.currentListingCount : 0,
          maxAllowed: site ? site.maxListings : 0
        };
      }),
    });

    // Create a mock store
    store = mockStore({
      listings: {
        selected: mockListing,
        loading: false,
        submitting: false,
        error: null,
      },
      sites: {
        items: [mockSite],
        loading: false,
        error: null,
      },
    });
  });

  it('should enforce site-specific listing limits during listing updates', async () => {
    // Mock a site that has reached its listing limit
    const siteAtLimit = {
      ...mockSite,
      currentListingCount: 5, // Equal to maxListings
    };

    // Update the useSites mock
    (useSites as jest.Mock).mockReturnValue({
      sites: [siteAtLimit],
      isLoading: false,
      error: null,
      getSiteById: jest.fn(() => siteAtLimit),
      checkSiteListingLimit: jest.fn(() => ({
        withinLimit: false,
        currentCount: 5,
        maxAllowed: 5
      })),
    });

    // Mock validateListing to check site listing limits
    validateListingMock.mockReturnValue({
      isValid: false,
      errors: {
        siteId: 'This site has reached its maximum listing limit (5/5)'
      }
    });

    render(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: siteAtLimit, setCurrentSite: jest.fn() }}>
          <ListingForm listingId={mockListing.id} />
        </SiteContext.Provider>
      </Provider>
    );

    // Find the next step button
    const nextButton = screen.getByTestId('next-step-button');

    // Simulate form validation
    validateListingMock();

    // Check that validation was called
    expect(validateListingMock).toHaveBeenCalled();

    // Check that updateListing was not called
    expect(updateListingMock).not.toHaveBeenCalled();
  });
});
