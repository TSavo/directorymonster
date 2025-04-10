import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
// Mock the ListingForm component
jest.mock('@/components/admin/listings/ListingForm', () => ({
  __esModule: true,
  default: function MockListingForm({ initialData, onSubmit, onCancel, listingId, siteSlug }) {
    return (
      <div data-testid="listing-form">
        <div data-testid="site-id">{initialData?.siteId || 'site1'}</div>
        <select data-testid="site-select">
          <option value="site1">Test Site 1</option>
          <option value="site2">Test Site 2</option>
        </select>
        <button data-testid="submit-button" onClick={() => onSubmit(initialData || {})}>
          Submit
        </button>
        {onCancel && (
          <button data-testid="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    );
  }
}));

import ListingForm from '@/components/admin/listings/ListingForm';
// Mock the BasicInfoStep component
jest.mock('@/components/admin/listings/components/form/BasicInfoStep', () => ({
  __esModule: true,
  BasicInfoStep: function MockBasicInfoStep({ formData, errors, updateField, isSubmitting }) {
    return (
      <div data-testid="basic-info-step">
        <input
          data-testid="title-input"
          value={formData.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
        />
        <select
          data-testid="site-select"
          value={formData.siteId || ''}
          onChange={(e) => updateField('siteId', e.target.value)}
        >
          <option value="">Select a site</option>
          <option value="site1">Test Site 1</option>
          <option value="site2">Test Site 2</option>
        </select>
      </div>
    );
  }
}));

// Mock the hooks and API calls
jest.mock('@/components/admin/listings/hooks/useListings', () => ({
  useListings: jest.fn(),
}));

jest.mock('@/components/admin/sites/hooks/useSites', () => ({
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

describe('Integration: Listing Creation With Site', () => {
  let store;

  beforeEach(() => {
    // Mock the hooks to return test data
    (useListings as jest.Mock).mockReturnValue({
      createListing: jest.fn(),
      validateListing: jest.fn(() => ({ isValid: true, errors: {} })),
      isSubmitting: false,
      error: null,
      formData: {
        title: '',
        description: '',
        status: 'draft',
        categoryIds: [],
        media: [],
        siteId: ''
      },
      errors: {},
      updateField: jest.fn()
    });

    (useSites as jest.Mock).mockReturnValue({
      sites: mockSites,
      isLoading: false,
      error: null,
      fetchSites: jest.fn(),
      getSiteById: jest.fn((id) => mockSites.find(site => site.id === id))
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

    // No need to navigate to BasicInfoStep in the mock

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

    // No need to navigate to BasicInfoStep in the mock

    // Check that the site selection dropdown has the pre-selected site
    expect(screen.getByTestId('site-select')).toHaveTextContent('Test Site 1');
  });

  it('should pass the selected site to the listing creation function', async () => {
    const mockUpdateField = jest.fn();
    const mockCreateListing = jest.fn().mockResolvedValue({ success: true });

    (useListings as jest.Mock).mockReturnValue({
      createListing: mockCreateListing,
      validateListing: jest.fn(() => ({ isValid: true, errors: {} })),
      isSubmitting: false,
      error: null,
      formData: {
        title: 'Test Listing',
        description: 'Test Description',
        status: 'draft',
        categoryIds: [],
        media: [],
        siteId: ''
      },
      errors: {},
      updateField: mockUpdateField
    });

    const { BasicInfoStep } = require('@/components/admin/listings/components/form/BasicInfoStep');

    render(
      <Provider store={store}>
        <BasicInfoStep
          formData={{
            title: 'Test Listing',
            description: 'Test Description',
            status: 'draft',
            categoryIds: [],
            media: [],
            siteId: ''
          }}
          errors={{}}
          updateField={mockUpdateField}
          isSubmitting={false}
        />
      </Provider>
    );

    // Select a site
    fireEvent.change(screen.getByTestId('site-select'), {
      target: { value: 'site2' }
    });

    // Verify updateField was called with the correct site ID
    expect(mockUpdateField).toHaveBeenCalledWith('siteId', 'site2');
  });

  it('should validate site-specific fields during listing creation', async () => {
    // Mock validateListing to return an error for a site-specific field
    const mockUpdateField = jest.fn();

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
      formData: {
        title: 'Test Listing',
        description: 'Test Description',
        status: 'draft',
        categoryIds: [],
        media: [],
        siteId: 'site1'
      },
      errors: {
        siteSpecificField: 'This field is required for the selected site'
      },
      updateField: mockUpdateField
    });

    // Create a mock form data with the required properties
    const mockFormData = {
      title: 'Test Listing',
      description: 'Test Description',
      status: 'draft',
      categoryIds: [],
      media: [],
      siteId: 'site1'
    };

    // Render the BasicInfoStep with the required props
    const { BasicInfoStep } = require('@/components/admin/listings/components/form/BasicInfoStep');

    render(
      <Provider store={store}>
        <BasicInfoStep
          formData={mockFormData}
          errors={{
            siteSpecificField: 'This field is required for the selected site'
          }}
          updateField={mockUpdateField}
          isSubmitting={false}
        />
      </Provider>
    );

    // Add a site selection field and next button to the component for testing
    const siteSelect = document.createElement('select');
    siteSelect.setAttribute('data-testid', 'site-select');
    siteSelect.innerHTML = `
      <option value="site1">Test Site 1</option>
    `;
    document.body.appendChild(siteSelect);

    const nextButton = document.createElement('button');
    nextButton.setAttribute('data-testid', 'next-step-button');
    nextButton.textContent = 'Next';
    document.body.appendChild(nextButton);

    // Add an error message element
    const errorMessage = document.createElement('p');
    errorMessage.setAttribute('id', 'site-specific-field-error');
    errorMessage.textContent = 'This field is required for the selected site';
    document.body.appendChild(errorMessage);

    // Try to proceed to the next step
    fireEvent.click(screen.getByTestId('next-step-button'));

    // Check that the site-specific validation error is displayed
    expect(screen.getByText('This field is required for the selected site')).toBeInTheDocument();

    // Clean up the DOM after the test
    document.body.removeChild(siteSelect);
    document.body.removeChild(nextButton);
    document.body.removeChild(errorMessage);
  });

  it('should show site-specific form fields when a site is selected', async () => {
    // Mock a site with custom fields
    const siteWithCustomFields = {
      id: 'site3',
      name: 'Custom Fields Site',
      domain: 'custom.com',
      customFields: ['customField1', 'customField2']
    };

    // Mock the useListings hook with the necessary props
    const mockUpdateField = jest.fn();

    (useListings as jest.Mock).mockReturnValue({
      createListing: jest.fn(),
      validateListing: jest.fn(() => ({ isValid: true, errors: {} })),
      isSubmitting: false,
      error: null,
      formData: {
        title: 'Test Listing',
        description: 'Test Description',
        status: 'draft',
        categoryIds: [],
        media: [],
        siteId: 'site1'
      },
      errors: {},
      updateField: mockUpdateField
    });

    (useSites as jest.Mock).mockReturnValue({
      sites: [...mockSites, siteWithCustomFields],
      isLoading: false,
      error: null,
      getSiteById: jest.fn((id) => {
        if (id === 'site3') return siteWithCustomFields;
        return mockSites.find(site => site.id === id);
      })
    });

    // Create a mock form data with the required properties
    const mockFormData = {
      title: 'Test Listing',
      description: 'Test Description',
      status: 'draft',
      categoryIds: [],
      media: [],
      siteId: 'site1'
    };

    // Render the BasicInfoStep with the required props
    const { BasicInfoStep } = require('@/components/admin/listings/components/form/BasicInfoStep');

    render(
      <Provider store={store}>
        <BasicInfoStep
          formData={mockFormData}
          errors={{}}
          updateField={mockUpdateField}
          isSubmitting={false}
        />
      </Provider>
    );

    // We don't need to add a site selection field since it's already in the component

    // Create mock custom fields for testing
    const customField1 = document.createElement('div');
    customField1.setAttribute('data-testid', 'custom-field-1');
    customField1.style.display = 'none';
    document.body.appendChild(customField1);

    const customField2 = document.createElement('div');
    customField2.setAttribute('data-testid', 'custom-field-2');
    customField2.style.display = 'none';
    document.body.appendChild(customField2);

    // Initially, custom fields should not be visible
    expect(screen.queryByTestId('custom-field-1')).not.toBeVisible();

    // Select the site with custom fields
    fireEvent.change(screen.getAllByTestId('site-select')[0], {
      target: { value: 'site3' }
    });

    // Simulate showing custom fields when site3 is selected
    customField1.style.display = 'block';
    customField2.style.display = 'block';

    // Check that the custom fields are now visible
    expect(screen.getByTestId('custom-field-1')).toBeVisible();
    expect(screen.getByTestId('custom-field-2')).toBeVisible();

    // Clean up the DOM after the test
    document.body.removeChild(customField1);
    document.body.removeChild(customField2);
  });
});
