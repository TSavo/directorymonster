import React from 'react';
import { render, screen } from '@testing-library/react';
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

// Mock the hooks implementation
import { useListings } from '../../../../src/components/admin/listings/hooks/useListings';
import { useSites } from '../../../../src/components/admin/sites/hooks/useSites';

const mockStore = configureStore([]);

describe('Empty Site List Handling', () => {
  let store;

  beforeEach(() => {
    // Create mock listings hook
    const mockUseListings = createMockUseListings();

    // Apply the mock
    (useListings as jest.Mock).mockReturnValue(mockUseListings);

    // Mock sites hook with empty sites array
    (useSites as jest.Mock).mockReturnValue({
      sites: [],
      isLoading: false,
      error: null,
    });

    // Create a mock store
    store = mockStore({
      listings: {
        items: [],
        loading: false,
        error: null,
      },
      sites: {
        items: [],
        loading: false,
        error: null,
      },
    });
  });

  it('should handle empty sites list gracefully', () => {
    render(
      <Provider store={store}>
        <SiteFilterDropdown onSelectSite={jest.fn()} />
      </Provider>
    );

    // The dropdown should still render
    const dropdown = screen.getByTestId('site-filter-dropdown');
    expect(dropdown).toBeInTheDocument();

    // Debug the rendered HTML
    console.log('Rendered HTML:', dropdown.outerHTML);

    // Verify the dropdown is rendered even with empty sites list
    expect(dropdown.querySelector('.ui-dropdown')).toBeInTheDocument();
  });
});
