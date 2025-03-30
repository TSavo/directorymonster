import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ListingForm } from '@/components/admin/listings/ListingForm';
import { BasicInfoStep } from '@/components/admin/listings/components/BasicInfoStep';

// Mock the hooks and API calls
jest.mock('@/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('@/hooks/useSites', () => ({
  useSites: jest.fn(),
}));

// Mock data
const mockSites = [
  { id: 'site1', name: 'Test Site 1', domain: 'test1.com' },
  { id: 'site2', name: 'Test Site 2', domain: 'test2.com' },
];

// Mock the hooks implementation
import { useListings } from '@/hooks/useListings';
import { useSites } from '@/hooks/useSites';

const mockStore = configureStore([]);

describe('Integration: Listing Creation With Site', () => {
  let store;
  
  beforeEach(() => {
    // Mock the hooks to return test data
    (useListings as jest.Mock).mockReturnValue({
      createListing: jest.fn(),
      validateListing: jest.fn(() => ({ isValid: true, errors: {} })),
      isSubmitting: false,
      error: null,
    });
    
    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
    });
    
    // Create a mock store
    store = mockStore({
      listings: {
        loading: false,
        error: null,
      },
      sites: {
        items: mockSites,
        loading: false,
        error: null,
      },
    });
  });

  it('should display site selection in the listing form', () => {
    render(
      <Provider store={store}>
        <ListingForm />
      </Provider>
    );

    // Navigate to the BasicInfoStep if not directly rendered
    if (screen.queryByTestId('site-select') === null) {
      fireEvent.click(screen.getByText('Basic Info'));
    }

    // Check that the site selection dropdown is present
    expect(screen.getByTestId('site-select')).toBeInTheDocument();
    
    // Check that both sites are available in the dropdown
    fireEvent.click(screen.getByTestId('site-select'));
    expect(screen.getByText('Test Site 1')).toBeInTheDocument();
    expect(screen.getByText('Test Site 2')).toBeInTheDocument();
  });

  it('should pre-select a site when a siteId is provided in the URL', () => {
    // Mock the URL parameters
    jest.mock('next/navigation', () => ({
      useSearchParams: () => new URLSearchParams('?siteId=site1'),
      usePathname: () => '/admin/listings/new',
    }));

    render(
      <Provider store={store}>
        <ListingForm />
      </Provider>
    );

    // Navigate to the BasicInfoStep if not directly rendered
    if (screen.queryByTestId('site-select') === null) {
      fireEvent.click(screen.getByText('Basic Info'));
    }

    // Check that the site selection dropdown has the pre-selected site
    expect(screen.getByTestId('site-select')).toHaveTextContent('Test Site 1');
  });

  it('should pass the selected site to the listing creation function', async () => {
    const { createListing } = useListings();
    
    render(
      <Provider store={store}>
        <ListingForm />
      </Provider>
    );

    // Navigate to the BasicInfoStep if not directly rendered
    if (screen.queryByTestId('site-select') === null) {
      fireEvent.click(screen.getByText('Basic Info'));
    }

    // Fill out the required fields
    fireEvent.change(screen.getByTestId('listing-title-input'), {
      target: { value: 'Test Listing' }
    });
    
    // Select a site
    fireEvent.click(screen.getByTestId('site-select'));
    fireEvent.click(screen.getByText('Test Site 2'));
    
    // Navigate through form steps and submit
    // This will depend on your form navigation implementation
    // For simplicity, let's assume there's a direct submit button
    fireEvent.click(screen.getByTestId('submit-listing-button'));
    
    // Check that createListing was called with the correct site ID
    await waitFor(() => {
      expect(createListing).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Listing',
          siteId: 'site2'
        })
      );
    });
  });

  it('should validate site-specific fields during listing creation', async () => {
    // Mock validateListing to return an error for a site-specific field
    (useListings as jest.Mock).mockReturnValue({
      createListing: jest.fn(),
      validateListing: jest.fn(() => ({ 
        isValid: false, 
        errors: { 
          siteSpecificField: 'This field is required for the selected site' 
        } 
      })),
      isSubmitting: false,
      error: null,
    });
    
    render(
      <Provider store={store}>
        <BasicInfoStep />
      </Provider>
    );

    // Select a site that triggers specific validation
    fireEvent.click(screen.getByTestId('site-select'));
    fireEvent.click(screen.getByText('Test Site 1'));
    
    // Try to proceed to the next step
    fireEvent.click(screen.getByTestId('next-step-button'));
    
    // Check that the site-specific validation error is displayed
    await waitFor(() => {
      expect(screen.getByText('This field is required for the selected site')).toBeInTheDocument();
    });
  });

  it('should show site-specific form fields when a site is selected', async () => {
    // Mock a site with custom fields
    const siteWithCustomFields = {
      id: 'site3',
      name: 'Custom Fields Site',
      domain: 'custom.com',
      customFields: ['customField1', 'customField2']
    };
    
    (useSites as jest.Mock).mockReturnValue({
      sites: [...mockSites, siteWithCustomFields],
      isLoading: false,
      error: null,
      getSiteById: jest.fn((id) => {
        if (id === 'site3') return siteWithCustomFields;
        return mockSites.find(site => site.id === id);
      })
    });
    
    render(
      <Provider store={store}>
        <BasicInfoStep />
      </Provider>
    );

    // Initially, custom fields should not be visible
    expect(screen.queryByTestId('custom-field-1')).not.toBeInTheDocument();
    
    // Select the site with custom fields
    fireEvent.click(screen.getByTestId('site-select'));
    fireEvent.click(screen.getByText('Custom Fields Site'));
    
    // Check that the custom fields are now visible
    await waitFor(() => {
      expect(screen.getByTestId('custom-field-1')).toBeInTheDocument();
      expect(screen.getByTestId('custom-field-2')).toBeInTheDocument();
    });
  });
});
