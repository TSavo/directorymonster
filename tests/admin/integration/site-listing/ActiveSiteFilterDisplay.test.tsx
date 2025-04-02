import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('ActiveSiteFilterDisplay', () => {
  let store;
  
  beforeEach(() => {
    // Apply the mock hook
    (useListings as jest.Mock).mockReturnValue(
      createMockUseListings({
        activeFilters: { siteId: 'site1' },
      })
    );
    
    // Mock sites hook
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        filters: {
          siteId: 'site1',
        },
      },
      sites: {
        items: mockSites,
      },
    });
  });

  it('should display the active site filter', () => {
    const { container } = render(
      <Provider store={store}>
        <SiteFilterDropdown selectedSiteId="site1" />
      </Provider>
    );

    // Check that the badge with the site name is displayed
    const badge = container.querySelector('.ui-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Test Site 1');
    
    // Check that the clear button is shown
    const clearButton = container.querySelector('[data-testid="clear-site-filter"]');
    expect(clearButton).toBeInTheDocument();
  });
});
