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

describe('ClearSiteFilter', () => {
  let store;
  let clearSiteFilter;
  
  beforeEach(() => {
    // Set up mock clear function
    clearSiteFilter = jest.fn();
    
    // Create mock listings hook with the clear function
    const mockUseListings = createMockUseListings({
      activeFilters: { siteId: 'site1' }
    });
    mockUseListings.clearSiteFilter = clearSiteFilter;
    
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
        filters: { siteId: 'site1' },
      },
      sites: {
        items: mockSites,
      },
    });
  });

  it('should call clearSiteFilter when the clear button is clicked', () => {
    render(
      <Provider store={store}>
        <SiteFilterDropdown 
          selectedSiteId="site1"
          onSelectSite={() => clearSiteFilter()} 
        />
      </Provider>
    );

    // Find and click the clear button
    const clearButton = screen.getByTestId('clear-site-filter');
    fireEvent.click(clearButton);
    
    // Verify the clearSiteFilter function was called
    expect(clearSiteFilter).toHaveBeenCalled();
  });
});
