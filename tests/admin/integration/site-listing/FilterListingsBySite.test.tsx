import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { SiteFilterDropdown } from '../../../../src/components/admin/listings/components/SiteFilterDropdown';

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

describe('FilterListingsBySite', () => {
  let store;
  let filterBySite;

  beforeEach(() => {
    // Set up mock filter function
    filterBySite = jest.fn();

    // Create mock listings hook with the filter function
    const mockUseListings = createMockUseListings();
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

  it('should call filterBySite when a site is selected', () => {
    render(
      <Provider store={store}>
        <SiteFilterDropdown onSelectSite={filterBySite} />
      </Provider>
    );

    // Debug the rendered HTML
    console.log('Rendered HTML:', screen.getByTestId('site-filter-dropdown').outerHTML);

    // Find the dropdown trigger element
    const dropdownTrigger = screen.getByTestId('site-filter-dropdown').querySelector('.ui-dropdown-trigger');
    if (!dropdownTrigger) {
      // If we can't find the trigger, let's try clicking the dropdown directly
      fireEvent.click(screen.getByTestId('site-filter-dropdown'));
    } else {
      fireEvent.click(dropdownTrigger);
    }

    // Find and click the first site option
    const menuItems = screen.getAllByTestId('dropdown-menu-item');
    fireEvent.click(menuItems[0]); // First site option

    // Verify the filterBySite function was called with the correct site ID
    expect(filterBySite).toHaveBeenCalledWith('site1');
  });
});
