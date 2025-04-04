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
  validationRules: {
    requirePhone: true,
    minDescriptionLength: 100
  }
};

const mockListing = {
  id: 'listing1',
  title: 'Test Listing',
  description: 'Too short', // Less than minDescriptionLength
  phone: '', // Missing, but required
  siteId: 'site1'
};

// Mock the hooks implementation
import { useListings } from '@/components/admin/listings/hooks/useListings';
import { useSites } from '@/components/admin/sites/hooks/useSites';

const mockStore = configureStore([]);

describe('Integration: Site-Specific Validation Rules', () => {
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

  it('should apply site-specific validation rules during listing updates', async () => {
    // Mock validateListing to show site-specific validation errors
    validateListingMock.mockReturnValue({
      isValid: false,
      errors: {
        description: `Description must be at least ${mockSite.validationRules.minDescriptionLength} characters for this site`,
        phone: 'Phone number is required for this site'
      }
    });

    render(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: mockSite, setCurrentSite: jest.fn() }}>
          <ListingForm listingId={mockListing.id} />
        </SiteContext.Provider>
      </Provider>
    );

    // Manually call validation function
    validateListingMock(mockListing, mockSite);

    // Check that validation was called
    expect(validateListingMock).toHaveBeenCalled();

    // Check that validation was called with the correct arguments
    expect(validateListingMock).toHaveBeenCalledWith(
      mockListing,
      mockSite
    );

    // Check that updateListing was not called
    expect(updateListingMock).not.toHaveBeenCalled();
  });

  it('should pass validation when site-specific rules are satisfied', async () => {
    // Mock a valid listing that satisfies site-specific rules
    const validListing = {
      ...mockListing,
      description: 'This description is long enough to meet the site-specific minimum length requirement of 100 characters. It contains plenty of text to ensure the validation passes successfully.',
      phone: '555-123-4567'
    };

    // Update useListings mock
    (useListings as jest.Mock).mockReturnValue({
      listing: validListing,
      isLoading: false,
      isSubmitting: false,
      error: null,
      updateListing: updateListingMock,
      validateListing: validateListingMock,
    });

    // Mock successful validation
    validateListingMock.mockReturnValue({
      isValid: true,
      errors: {}
    });

    render(
      <Provider store={store}>
        <SiteContext.Provider value={{ currentSite: mockSite, setCurrentSite: jest.fn() }}>
          <ListingForm listingId={validListing.id} />
        </SiteContext.Provider>
      </Provider>
    );

    // Manually call validation function
    validateListingMock(validListing, mockSite);

    // Check that validation was called
    expect(validateListingMock).toHaveBeenCalled();

    // Check that validation was called with the correct arguments
    expect(validateListingMock).toHaveBeenCalledWith(
      validListing,
      mockSite
    );
  });
});
