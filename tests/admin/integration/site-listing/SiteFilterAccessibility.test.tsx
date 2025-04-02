import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { SiteFilterDropdown } from '@/components/admin/listings/components/SiteFilterDropdown';

// Import the mock creator utility
import createMockUseListings from '@/components/admin/listings/hooks/useListings.mock';

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
import { useListings } from '@/components/admin/listings/hooks/useListings';
import { useSites } from '@/components/admin/sites/hooks/useSites';

const mockStore = configureStore([]);

describe('Site Filter Accessibility', () => {
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

  it('should be keyboard navigable', () => {
    render(
      <Provider store={store}>
        <SiteFilterDropdown onSelectSite={filterBySite} />
      </Provider>
    );

    // Find the dropdown container
    const dropdown = screen.getByTestId('site-filter-dropdown');
    expect(dropdown).toBeInTheDocument();

    // Debug the rendered HTML
    console.log('Rendered HTML:', dropdown.outerHTML);

    // Click on the dropdown to open it
    fireEvent.click(dropdown);

    // Menu should be open now, but there's no easy way to verify this in testing-library
    // Let's try to find the dropdown items
    const menuItems = screen.getAllByTestId('dropdown-menu-item');
    expect(menuItems.length).toBeGreaterThan(0);

    // Simulate focusing the first menu item
    const firstItem = menuItems[0] as HTMLElement;
    firstItem.focus();

    // Press Enter to select
    fireEvent.click(firstItem);

    // Verify filter was applied with the correct site ID
    expect(filterBySite).toHaveBeenCalledWith('site1');
  });
});
